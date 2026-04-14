import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import debug from 'debug'
import childProcess from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import sinon from 'sinon'

import Preview from '../../src/commands/devcenter/preview.js'
import {PLUGIN_ROOT} from '../helpers/plugin-root.js'
import {stubOpen} from '../helpers/stub-open.js'

describe('devcenter:preview', function () {
  let workDir: string
  let previousArticleCwd: string | undefined

  beforeEach(function () {
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-preview-cmd-'))
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    process.env.DEVCENTER_CLI_CWD = workDir
    stubOpen()
  })

  afterEach(function () {
    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    rmSync(workDir, {recursive: true})
    sinon.restore()
  })

  it('errors when slug is empty after trimming', async function () {
    const {error} = await runCommand(Preview, ['   '], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain('Please provide an article slug')
  })

  it('errors when the markdown file is missing', async function () {
    const {error} = await runCommand(Preview, ['missing'], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain("Can't find")
    expect(error?.message).to.contain('missing.md')
  })

  it('starts preview server and exits on SIGINT', async function () {
    writeFileSync(
      join(workDir, 'live.md'),
      `title: Live
id: 1

content
`,
      'utf8',
    )

    const run = runCommand(Preview, ['live', '--port', '38474'], {root: PLUGIN_ROOT})
    const t = setTimeout(() => {
      process.emit('SIGINT')
    }, 300)
    const {error} = await run
    clearTimeout(t)
    expect(error).to.equal(undefined)
    expect((childProcess.spawn as sinon.SinonStub).called).to.equal(true)
  })

  it('with DEBUG=devcenter:preview, logs HTTP handling to stderr', async function () {
    const prevDebug = process.env.DEBUG
    process.env.DEBUG = 'devcenter:preview'
    debug.enable('devcenter:preview')

    writeFileSync(
      join(workDir, 'x.md'),
      `title: X
id: 1

body
`,
      'utf8',
    )

    const run = runCommand(Preview, ['x', '--port', '38476'], {root: PLUGIN_ROOT})
    const fetchTimer = setTimeout(() => {
      fetch('http://127.0.0.1:38476/x').catch(() => {})
    }, 120)
    const sigTimer = setTimeout(() => {
      process.emit('SIGINT')
    }, 400)

    const {error, stderr} = await run
    clearTimeout(fetchTimer)
    clearTimeout(sigTimer)

    if (prevDebug === undefined) {
      debug.disable()
      delete process.env.DEBUG
    } else {
      process.env.DEBUG = prevDebug
      debug.enable(prevDebug)
    }

    expect(error).to.equal(undefined)
    expect(stderr).to.match(/Local article requested|Parsing|Serving/)
  })
})
