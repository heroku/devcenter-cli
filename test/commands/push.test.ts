import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import Push from '../../src/commands/devcenter/push.js'
import {netrcFilePath} from '../helpers/netrc-path.js'
import {PLUGIN_ROOT} from '../helpers/plugin-root.js'
import {
  applyHomeEnv, type HomeEnvSnapshot, setHomeDirForTests, snapshotHomeEnv,
} from '../helpers/test-home-env.js'

describe('devcenter:push', function () {
  let workDir: string
  let homeEnv: HomeEnvSnapshot
  let previousArticleCwd: string | undefined
  let netrcHome: string

  beforeEach(function () {
    homeEnv = snapshotHomeEnv()
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-push-'))
    netrcHome = mkdtempSync(join(tmpdir(), 'devcenter-netrc-'))
    setHomeDirForTests(netrcHome)
    process.env.DEVCENTER_CLI_CWD = workDir
    writeFileSync(
      netrcFilePath(netrcHome),
      `machine api.heroku.com
  login test@heroku.com
  password fake-api-token-for-tests
`,
      'utf8',
    )
  })

  afterEach(function () {
    nock.cleanAll()
    applyHomeEnv(homeEnv)

    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    rmSync(workDir, {recursive: true})
    rmSync(netrcHome, {recursive: true})
  })

  it('pushes article content through validate and update APIs', async function () {
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

    const {error} = await runCommand(Push, ['acme'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
  })

  it('logs broken links when the API returns some', async function () {
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

    const {error, stdout} = await runCommand(Push, ['brk'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('broken link')
  })

  it('fails when validation returns errors', async function () {
    writeFileSync(join(workDir, 'bad.md'), 'title: X\nid: 11\n\nbody\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/11/validate.json')
      .reply(200, {title: ['is invalid']})

    const {error} = await runCommand(Push, ['bad'], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain("can't be saved")
  })

  it('fails when update returns an error', async function () {
    writeFileSync(join(workDir, 'up.md'), 'title: U\nid: 12\n\nbody\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/12/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/12.json')
      .reply(422, {error: 'rejected'})

    const {error} = await runCommand(Push, ['up'], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain('rejected')
  })

  it('errors when slug is empty after trimming', async function () {
    const {error} = await runCommand(Push, ['   '], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain('Please provide an article slug')
  })

  it('errors when the markdown file is missing', async function () {
    const {error} = await runCommand(Push, ['missing'], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain("Can't find")
    expect(error?.message).to.contain('missing.md')
  })

  it('errors when netrc token cannot be read', async function () {
    writeFileSync(join(workDir, 'tok.md'), 'title: T\nid: 1\n\nx\n', 'utf8')
    const noNetrcHome = snapshotHomeEnv()
    const emptyHome = mkdtempSync(join(tmpdir(), 'devcenter-no-netrc-'))
    setHomeDirForTests(emptyHome)
    try {
      const {error} = await runCommand(Push, ['tok'], {root: PLUGIN_ROOT})
      expect(error?.message).to.contain('Heroku credentials')
    } finally {
      applyHomeEnv(noNetrcHome)
      rmSync(emptyHome, {recursive: true})
    }
  })

  it('fails when validation returns a non-empty array body', async function () {
    writeFileSync(join(workDir, 'arr.md'), 'title: A\nid: 20\n\nb\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/20/validate.json')
      .reply(200, [{code: 'invalid'}])

    const {error} = await runCommand(Push, ['arr'], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain("can't be saved")
  })

  it('uses HTTP status when update error body has no error field', async function () {
    writeFileSync(join(workDir, 'nostr.md'), 'title: N\nid: 21\n\nb\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/21/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/21.json')
      .reply(418, {})

    const {error} = await runCommand(Push, ['nostr'], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain('418')
  })

  it('logs archived status when API returns it', async function () {
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

    const {error, stdout} = await runCommand(Push, ['arc'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('archived')
  })

  it('logs published_quietly status when API returns it', async function () {
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

    const {error, stdout} = await runCommand(Push, ['pq'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('published quietly')
  })

  it('logs staging status when API returns it', async function () {
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

    const {error, stdout} = await runCommand(Push, ['st'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('staging mode')
  })

  it('logs generic completion when update body omits status', async function () {
    writeFileSync(join(workDir, 'min.md'), 'title: M\nid: 13\n\nbody\n', 'utf8')
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/broken-link-checks.json')
      .reply(200, [])
      .post('/api/v1/private/articles/13/validate.json')
      .reply(200, {})
      .put('/api/v1/private/articles/13.json')
      .reply(200, {})

    const {error, stdout} = await runCommand(Push, ['min'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('Article update completed')
  })
})
