import {expect} from 'chai'
import nock from 'nock'
import {
  mkdtempSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import Pull from '../../src/commands/devcenter/pull.js'
import {netrcFilePath} from '../helpers/netrc-path.js'
import {runCommand} from '../helpers/run-command.js'
import {
  applyHomeEnv, type HomeEnvSnapshot, setHomeDirForTests, snapshotHomeEnv,
} from '../helpers/test-home-env.js'

describe('devcenter:pull', function () {
  let workDir: string
  let homeEnv: HomeEnvSnapshot
  let noNetrcHome: string
  let previousArticleCwd: string | undefined
  let previousTestConfirm: string | undefined

  beforeEach(function () {
    homeEnv = snapshotHomeEnv()
    noNetrcHome = mkdtempSync(join(tmpdir(), 'devcenter-pull-home-'))
    setHomeDirForTests(noNetrcHome)
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-pull-'))
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    previousTestConfirm = process.env.DEVCENTER_CLI_TEST_CONFIRM
    process.env.DEVCENTER_CLI_CWD = workDir
    delete process.env.DEVCENTER_CLI_TEST_CONFIRM
  })

  afterEach(function () {
    if (previousTestConfirm === undefined) {
      delete process.env.DEVCENTER_CLI_TEST_CONFIRM
    } else {
      process.env.DEVCENTER_CLI_TEST_CONFIRM = previousTestConfirm
    }

    nock.cleanAll()
    applyHomeEnv(homeEnv)
    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    rmSync(workDir, {recursive: true})
    rmSync(noNetrcHome, {recursive: true})
  })

  it('writes a local markdown file from the Dev Center API', async function () {
    nock('https://devcenter.heroku.com')
    .get('/articles/acme.json')
    .reply(200, {
      content: 'Article **body**.',
      id: 7,
      slug: 'acme',
      title: 'Acme Co',
    })

    const {error} = await runCommand(Pull, ['acme', '--force'])
    expect(error).to.equal(undefined)

    const written = readFileSync(join(workDir, 'acme.md'), 'utf8')
    expect(written).to.contain('Acme Co')
    expect(written).to.contain('Article **body**.')
  })

  it('errors when the article cannot be loaded', async function () {
    nock('https://devcenter.heroku.com').get('/articles/nope.json').reply(404, {})
    nock('https://devcenter.heroku.com')
    .get('/api/v1/search.json')
    .query({query: 'nope'})
    .reply(200, {results: []})

    const {error} = await runCommand(Pull, ['nope', '--force'])
    expect(error?.message).to.contain('No nope article found')
  })

  it('errors when slug is empty after parsing', async function () {
    const {error} = await runCommand(Pull, ['  '])
    expect(error?.message).to.contain('Please provide an article slug')
  })

  it('retries with netrc auth when the public JSON request fails', async function () {
    const token = 'fake-pull-token'
    writeFileSync(
      netrcFilePath(noNetrcHome),
      `machine api.heroku.com
  login t@t.com
  password ${token}
`,
      'utf8',
    )

    nock('https://devcenter.heroku.com').get('/articles/draftish.json').reply(404, {})
    nock('https://devcenter.heroku.com', {
      reqheaders: {authorization: `Basic ${Buffer.from(token).toString('base64')}`},
    })
    .get('/articles/draftish.json')
    .reply(200, {
      content: 'Draft **body**.',
      id: 99,
      slug: 'draftish',
      title: 'Draft Title',
    })

    const {error} = await runCommand(Pull, ['draftish', '--force'])
    expect(error).to.equal(undefined)
    expect(readFileSync(join(workDir, 'draftish.md'), 'utf8')).to.contain('Draft **body**.')
  })

  it('falls back to private API when public JSON stays unavailable', async function () {
    const token = 'fake-pull-token'
    const auth = {authorization: `Basic ${Buffer.from(token).toString('base64')}`}
    writeFileSync(
      netrcFilePath(noNetrcHome),
      `machine api.heroku.com
  login t@t.com
  password ${token}
`,
      'utf8',
    )

    nock('https://devcenter.heroku.com').get('/articles/private-only.json').reply(401, {error: 'Authentication required'})
    nock('https://devcenter.heroku.com', {reqheaders: auth})
    .get('/articles/private-only.json')
    .reply(401, {error: 'Authentication required'})
    nock('https://devcenter.heroku.com', {reqheaders: auth})
    .get('/api/v1/private/articles/private-only.json')
    .reply(200, {
      content: 'From **private** API.',
      id: 42,
      slug: 'private-only',
      title: 'Private Only Title',
    })

    const {error} = await runCommand(Pull, ['private-only', '--force'])
    expect(error).to.equal(undefined)
    expect(readFileSync(join(workDir, 'private-only.md'), 'utf8')).to.contain('From **private** API.')
  })

  it('does not overwrite when user declines the prompt', async function () {
    writeFileSync(join(workDir, 'keep.md'), 'title: Old\nid: 1\n\nold', 'utf8')
    nock('https://devcenter.heroku.com')
    .get('/articles/keep.json')
    .reply(200, {
      content: 'new body',
      id: 1,
      slug: 'keep',
      title: 'New',
    })

    process.env.DEVCENTER_CLI_TEST_CONFIRM = 'false'
    const {error} = await runCommand(Pull, ['keep'])
    expect(error).to.equal(undefined)
    expect(readFileSync(join(workDir, 'keep.md'), 'utf8')).to.contain('old')
  })
})
