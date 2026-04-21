import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {mkdtempSync, readFileSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import Pull from '../../../src/commands/devcenter/pull.js'
import {
  applyHomeEnv, type HomeEnvSnapshot, setHomeDirForTests, snapshotHomeEnv,
} from '../../helpers/test-home-env.js'

describe('devcenter:pull', function () {
  let workDir: string
  let homeEnv: HomeEnvSnapshot
  let isolatedHome: string
  let previousArticleCwd: string | undefined

  beforeEach(function () {
    homeEnv = snapshotHomeEnv()
    isolatedHome = mkdtempSync(join(tmpdir(), 'devcenter-pull-home-'))
    setHomeDirForTests(isolatedHome)
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-pull-'))
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    process.env.DEVCENTER_CLI_CWD = workDir
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
    rmSync(isolatedHome, {recursive: true})
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

  it('retries with Heroku credentials when the public JSON request fails', async function () {
    const token = 'fake-pull-token'
    const savedKey = process.env.HEROKU_API_KEY
    process.env.HEROKU_API_KEY = token
    try {
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
    } finally {
      if (savedKey === undefined) {
        delete process.env.HEROKU_API_KEY
      } else {
        process.env.HEROKU_API_KEY = savedKey
      }
    }
  })

  it('falls back to private API when public JSON stays unavailable', async function () {
    const token = 'fake-pull-token'
    const savedKey = process.env.HEROKU_API_KEY
    process.env.HEROKU_API_KEY = token
    const auth = {authorization: `Basic ${Buffer.from(token).toString('base64')}`}
    try {
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
    } finally {
      if (savedKey === undefined) {
        delete process.env.HEROKU_API_KEY
      } else {
        process.env.HEROKU_API_KEY = savedKey
      }
    }
  })
})
