import {expect} from 'chai'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import Preview from '../../src/commands/devcenter/preview.js'
import {runCommand} from '../helpers/run-command.js'

describe('devcenter:preview', function () {
  let workDir: string
  let previousArticleCwd: string | undefined
  let previousTest: string | undefined

  beforeEach(function () {
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-preview-cmd-'))
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    previousTest = process.env.DEVCENTER_CLI_TEST
    process.env.DEVCENTER_CLI_CWD = workDir
    process.env.DEVCENTER_CLI_TEST = '1'
  })

  afterEach(function () {
    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    if (previousTest === undefined) {
      delete process.env.DEVCENTER_CLI_TEST
    } else {
      process.env.DEVCENTER_CLI_TEST = previousTest
    }

    rmSync(workDir, {recursive: true})
  })

  it('errors when slug is empty after trimming', async function () {
    const {error} = await runCommand(Preview, ['   '])
    expect(error?.message).to.contain('Please provide an article slug')
  })

  it('errors when the markdown file is missing', async function () {
    const {error} = await runCommand(Preview, ['missing'])
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

    const run = runCommand(Preview, ['live', '--port', '38474'])
    const t = setTimeout(() => {
      process.emit('SIGINT')
    }, 300)
    const {error} = await run
    clearTimeout(t)
    expect(error).to.equal(undefined)
  })
})
