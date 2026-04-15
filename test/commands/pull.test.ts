import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'
import {
  mkdtempSync, readFileSync, rmSync,
} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import Pull from '../../src/commands/devcenter/pull.js'
import {PLUGIN_ROOT} from '../helpers/plugin-root.js'

const TEST_TOKEN = 'fake-pull-token'

describe('devcenter:pull', function () {
  let workDir: string
  let previousArticleCwd: string | undefined
  let previousApiKey: string | undefined

  beforeEach(function () {
    previousArticleCwd = process.env.DEVCENTER_CLI_CWD
    previousApiKey = process.env.HEROKU_API_KEY
    workDir = mkdtempSync(join(tmpdir(), 'devcenter-pull-'))
    process.env.DEVCENTER_CLI_CWD = workDir
    delete process.env.HEROKU_API_KEY
  })

  afterEach(function () {
    nock.cleanAll()
    if (previousArticleCwd === undefined) {
      delete process.env.DEVCENTER_CLI_CWD
    } else {
      process.env.DEVCENTER_CLI_CWD = previousArticleCwd
    }

    if (previousApiKey === undefined) {
      delete process.env.HEROKU_API_KEY
    } else {
      process.env.HEROKU_API_KEY = previousApiKey
    }

    rmSync(workDir, {recursive: true})
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

    const {error} = await runCommand(Pull, ['acme', '--force'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)

    const written = readFileSync(join(workDir, 'acme.md'), 'utf8')
    expect(written).to.contain('Acme Co')
    expect(written).to.contain('Article **body**.')
  })

  it('errors when the article cannot be loaded', async function () {
    process.env.HEROKU_API_KEY = TEST_TOKEN
    const auth = {authorization: `Basic ${Buffer.from(TEST_TOKEN).toString('base64')}`}

    nock('https://devcenter.heroku.com').get('/articles/nope.json').reply(404, {})
    nock('https://devcenter.heroku.com', {reqheaders: auth})
      .get('/articles/nope.json')
      .reply(404, {})
    nock('https://devcenter.heroku.com', {reqheaders: auth})
      .get('/api/v1/private/articles/nope.json')
      .reply(404, {})
    nock('https://devcenter.heroku.com')
      .get('/api/v1/search.json')
      .query({query: 'nope'})
      .reply(200, {results: []})

    const {error} = await runCommand(Pull, ['nope', '--force'], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain('No nope article found')
  })

  it('errors when slug is empty after parsing', async function () {
    const {error} = await runCommand(Pull, ['  '], {root: PLUGIN_ROOT})
    expect(error?.message).to.contain('Please provide an article slug')
  })

  it('retries with auth when the public JSON request fails', async function () {
    process.env.HEROKU_API_KEY = TEST_TOKEN

    nock('https://devcenter.heroku.com').get('/articles/draftish.json').reply(404, {})
    nock('https://devcenter.heroku.com', {
      reqheaders: {authorization: `Basic ${Buffer.from(TEST_TOKEN).toString('base64')}`},
    })
      .get('/articles/draftish.json')
      .reply(200, {
        content: 'Draft **body**.',
        id: 99,
        slug: 'draftish',
        title: 'Draft Title',
      })

    const {error} = await runCommand(Pull, ['draftish', '--force'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
    expect(readFileSync(join(workDir, 'draftish.md'), 'utf8')).to.contain('Draft **body**.')
  })

  it('falls back to private API when public JSON stays unavailable', async function () {
    process.env.HEROKU_API_KEY = TEST_TOKEN
    const auth = {authorization: `Basic ${Buffer.from(TEST_TOKEN).toString('base64')}`}

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

    const {error} = await runCommand(Pull, ['private-only', '--force'], {root: PLUGIN_ROOT})
    expect(error).to.equal(undefined)
    expect(readFileSync(join(workDir, 'private-only.md'), 'utf8')).to.contain('From **private** API.')
  })
})
