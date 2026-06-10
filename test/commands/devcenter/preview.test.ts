import {runCommand} from '@heroku-cli/test-utils'
import childProcess from 'node:child_process'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {restore, type SinonStub} from 'sinon'
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest'

import Preview from '../../../src/commands/devcenter/preview.js'
import {stubOpen} from '../../helpers/stub-open.js'

describe('devcenter:preview', () => {
  let workDir: string
  let previousArticleCwd: string | undefined

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-preview-cmd-'))
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    process.env.DEVCENTER_CLI_CWD = workDir
    stubOpen()
  })

  afterEach(() => {
    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    rmSync(workDir, {recursive: true})
    restore()
  })

  it('errors when the markdown file is missing', async () => {
    const {error} = await runCommand(Preview, ['missing'])
    expect(error?.message).toContain("Can't find")
    expect(error?.message).toContain('missing.md')
  })

  it('starts preview server and exits on SIGINT', async () => {
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
    expect(error).toBeUndefined()
    expect((childProcess.spawn as SinonStub).called).toBe(true)
  })
})
