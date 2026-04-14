import {expect} from 'chai'
import {
  mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import request from 'supertest'

import {createPreviewApp, runPreview} from '../../src/lib/preview-server.js'

describe('createPreviewApp', function () {
  let workDir: string
  let previousArticleCwd: string | undefined

  beforeEach(function () {
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-preview-'))
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    process.env.DEVCENTER_CLI_CWD = workDir
  })

  afterEach(function () {
    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    rmSync(workDir, {recursive: true})
  })

  it('returns 200 and article HTML when the markdown file exists', async function () {
    writeFileSync(
      join(workDir, 'hello.md'),
      `title: Hello Title
id: 1

# Section
`,
      'utf8',
    )

    const {app} = createPreviewApp(() => {})
    const res = await request(app).get('/hello').expect(200)
    expect(res.text).to.contain('Hello Title')
    expect(res.text).to.contain('Section')
  })

  it('returns 404 HTML when the markdown file is missing', async function () {
    const {app} = createPreviewApp(() => {})
    const res = await request(app).get('/missing').expect(404)
    expect(res.text).to.contain('Ooops')
  })

  it('routes verbose request logs through debugLog when provided', async function () {
    writeFileSync(
      join(workDir, 'trace.md'),
      `title: T
id: 1

x
`,
      'utf8',
    )

    const lines: string[] = []
    const {app} = createPreviewApp(() => {}, m => {
      lines.push(m)
    })

    await request(app).get('/trace').expect(200)
    expect(lines.some(l => l.includes('Local article requested'))).to.equal(true)
    expect(lines.some(l => l.includes('Parsing'))).to.equal(true)
    expect(lines.some(l => l.includes('Serving'))).to.equal(true)
  })

  it('returns 204 for favicon', async function () {
    const {app} = createPreviewApp(() => {})
    await request(app).get('/favicon.ico').expect(204)
  })

  it('opens an SSE stream then aborts cleanly', async function () {
    const {app} = createPreviewApp(() => {})
    await new Promise<void>(resolve => {
      const r = request(app).get('/stream').end(() => {
        resolve()
      })

      setTimeout(() => {
        r.abort()
      }, 40)
    })
  })

  it('runPreview listens and exits when SIGINT is emitted', async function () {
    const previousTest = process.env.DEVCENTER_CLI_TEST
    process.env.DEVCENTER_CLI_TEST = '1'
    const mdPath = join(workDir, 'live.md')
    writeFileSync(
      mdPath,
      `title: Live
id: 1

content
`,
      'utf8',
    )

    const logs: string[] = []
    const debugLogs: string[] = []
    const run = runPreview({
      debugLog(m) {
        debugLogs.push(m)
      },
      host: '127.0.0.1',
      log(m) {
        logs.push(m)
      },
      mdPath,
      port: 38_471,
      slug: 'live',
    })
    const touch = setTimeout(() => {
      writeFileSync(mdPath, `${readFileSync(mdPath, 'utf8')}\n`, 'utf8')
    }, 80)
    const t = setTimeout(() => {
      process.emit('SIGINT')
    }, 250)
    await run
    clearTimeout(touch)
    clearTimeout(t)
    expect(debugLogs.some(l => l.includes('File modified'))).to.equal(true)
    if (previousTest === undefined) {
      delete process.env.DEVCENTER_CLI_TEST
    } else {
      process.env.DEVCENTER_CLI_TEST = previousTest
    }
  })
})
