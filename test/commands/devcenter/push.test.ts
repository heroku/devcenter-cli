import {runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest'

import Push from '../../../src/commands/devcenter/push.js'
import {
  applyHomeEnv, type HomeEnvSnapshot, setHomeDirForTests, snapshotHomeEnv,
} from '../../helpers/test-home-env.js'

describe('devcenter:push', () => {
  let workDir: string
  let homeEnv: HomeEnvSnapshot
  let previousArticleCwd: string | undefined
  let isolatedHome: string
  let savedHerokuApiKey: string | undefined

  beforeEach(() => {
    homeEnv = snapshotHomeEnv()
    savedHerokuApiKey = process.env.HEROKU_API_KEY
    process.env.HEROKU_API_KEY = 'fake-api-token-for-tests'
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-push-'))
    isolatedHome = mkdtempSync(join(tmpdir(), 'devcenter-push-home-'))
    setHomeDirForTests(isolatedHome)
    process.env.DEVCENTER_CLI_CWD = workDir
  })

  afterEach(() => {
    nock.cleanAll()
    applyHomeEnv(homeEnv)

    if (savedHerokuApiKey === undefined) {
      delete process.env.HEROKU_API_KEY
    } else {
      process.env.HEROKU_API_KEY = savedHerokuApiKey
    }

    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    rmSync(workDir, {recursive: true})
    rmSync(isolatedHome, {recursive: true})
  })

  it('pushes article content through validate and update APIs', async () => {
    writeFileSync(
      join(workDir, 'acme.md'),
      `title: Acme Co
id: 7

Hello **world**.
`,
      'utf8',
    )

    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/7/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/7.json')
      .reply(200, {
        status: 'published',
        title: 'Acme Co',
        url: 'https://devcenter.heroku.com/articles/acme',
      })

    const {error} = await runCommand(Push, ['acme'])
    expect(error).toBeUndefined()
  })

  it('logs broken links when the API returns some', async () => {
    writeFileSync(
      join(workDir, 'brk.md'),
      `title: B
id: 8

[link](http://broken)
`,
      'utf8',
    )

    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [{text: 'link', url: 'http://broken'}])
      .post('/api/v1/private/articles/8/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/8.json')
      .reply(200, {status: 'draft', title: 'B', url: 'https://devcenter.heroku.com/articles/brk'})

    const {error, stdout} = await runCommand(Push, ['brk'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('broken link')
  })

  it('fails when validation returns errors', async () => {
    writeFileSync(join(workDir, 'bad.md'), 'title: X\nid: 11\n\nbody\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/11/validate.json')
      .reply(200, {title: ['is invalid']})

    const {error} = await runCommand(Push, ['bad'])
    expect(error?.message).toContain("can't be saved")
  })

  it('fails when update returns an error', async () => {
    writeFileSync(join(workDir, 'up.md'), 'title: U\nid: 12\n\nbody\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/12/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/12.json')
      .reply(422, {error: 'rejected'})

    const {error} = await runCommand(Push, ['up'])
    expect(error?.message).toContain('rejected')
  })

  it('errors when the markdown file is missing', async () => {
    const {error} = await runCommand(Push, ['missing'])
    expect(error?.message).toContain("Can't find")
    expect(error?.message).toContain('missing.md')
  })

  it('errors when Heroku credentials are not available', async () => {
    writeFileSync(join(workDir, 'tok.md'), 'title: T\nid: 1\n\nx\n', 'utf8')
    const homeSnap = snapshotHomeEnv()
    const savedKey = process.env.HEROKU_API_KEY
    delete process.env.HEROKU_API_KEY
    const emptyHome = mkdtempSync(join(tmpdir(), 'devcenter-no-creds-'))
    setHomeDirForTests(emptyHome)
    try {
      const {error} = await runCommand(Push, ['tok'])
      expect(error?.message).toContain('Heroku credentials')
    } finally {
      applyHomeEnv(homeSnap)
      if (savedKey === undefined) {
        delete process.env.HEROKU_API_KEY
      } else {
        process.env.HEROKU_API_KEY = savedKey
      }

      rmSync(emptyHome, {recursive: true})
    }
  })

  it('fails when validation returns a non-empty array body', async () => {
    writeFileSync(join(workDir, 'arr.md'), 'title: A\nid: 20\n\nb\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/20/validate.json')
      .reply(200, [{code: 'invalid'}])

    const {error} = await runCommand(Push, ['arr'])
    expect(error?.message).toContain("can't be saved")
  })

  it('uses HTTP status when update error body has no error field', async () => {
    writeFileSync(join(workDir, 'nostr.md'), 'title: N\nid: 21\n\nb\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/21/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/21.json')
      .reply(418, {})

    const {error} = await runCommand(Push, ['nostr'])
    expect(error?.message).toContain('418')
  })

  it('logs archived status when API returns it', async () => {
    writeFileSync(join(workDir, 'arc.md'), 'title: Arc\nid: 22\n\nb\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/22/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/22.json')
      .reply(200, {
        status: 'archived',
        title: 'Arc',
        url: 'https://devcenter.heroku.com/articles/arc',
      })

    const {error, stdout} = await runCommand(Push, ['arc'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('archived')
  })

  it('logs published_quietly status when API returns it', async () => {
    writeFileSync(join(workDir, 'pq.md'), 'title: Pq\nid: 23\n\nb\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/23/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/23.json')
      .reply(200, {
        status: 'published_quietly',
        title: 'Pq',
        url: 'https://devcenter.heroku.com/articles/pq',
      })

    const {error, stdout} = await runCommand(Push, ['pq'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('published quietly')
  })

  it('logs staging status when API returns it', async () => {
    writeFileSync(join(workDir, 'st.md'), 'title: St\nid: 24\n\nb\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/24/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/24.json')
      .reply(200, {
        status: 'staging',
        title: 'St',
        url: 'https://devcenter.heroku.com/articles/st',
      })

    const {error, stdout} = await runCommand(Push, ['st'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('staging mode')
  })

  it('logs generic completion when update body omits status', async () => {
    writeFileSync(join(workDir, 'min.md'), 'title: M\nid: 13\n\nbody\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/13/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/13.json')
      .reply(200, {})

    const {error, stdout} = await runCommand(Push, ['min'])
    expect(error).toBeUndefined()
    expect(stdout).toContain('Article update completed')
  })
})
