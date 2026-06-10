import {runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'
import childProcess from 'node:child_process'
import {mkdtempSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {restore, type SinonStub} from 'sinon'
import {
  afterEach, beforeEach, describe, expect, it,
} from 'vitest'

import Open from '../../../src/commands/devcenter/open.js'
import {stubOpen} from '../../helpers/stub-open.js'
import {
  applyHomeEnv, type HomeEnvSnapshot, setHomeDirForTests, snapshotHomeEnv,
} from '../../helpers/test-home-env.js'

describe('devcenter:open', () => {
  let homeEnv: HomeEnvSnapshot
  let isolatedHome: string

  beforeEach(() => {
    stubOpen()
    homeEnv = snapshotHomeEnv()
    isolatedHome = mkdtempSync(join(tmpdir(), 'devcenter-open-home-'))
    setHomeDirForTests(isolatedHome)
  })

  afterEach(() => {
    nock.cleanAll()
    restore()
    applyHomeEnv(homeEnv)
    rmSync(isolatedHome, {recursive: true})
  })

  it('succeeds when public article JSON matches and opens browser', async () => {
    nock('https://devcenter.heroku.com')
      .get('/articles/my-article.json')
      .reply(200, {
        content: 'body',
        id: 1,
        slug: 'my-article',
        title: 'T',
      })

    const {error} = await runCommand(Open, ['my-article'])
    expect(error).toBeUndefined()
    expect((childProcess.spawn as SinonStub).called).toBe(true)
  })

  it('opens when authenticated public JSON succeeds after anonymous miss', async () => {
    const token = 'fake-open-token'
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

      const {error} = await runCommand(Open, ['draftish'])
      expect(error).toBeUndefined()
      expect((childProcess.spawn as SinonStub).called).toBe(true)
    } finally {
      if (savedKey === undefined) {
        delete process.env.HEROKU_API_KEY
      } else {
        process.env.HEROKU_API_KEY = savedKey
      }
    }
  })

  it('opens when private API resolves the article after public failures', async () => {
    const token = 'fake-open-token'
    const savedKey = process.env.HEROKU_API_KEY
    process.env.HEROKU_API_KEY = token
    const auth = {authorization: `Basic ${Buffer.from(token).toString('base64')}`}
    try {
      nock('https://devcenter.heroku.com').get('/articles/private-only.json').reply(401)
      nock('https://devcenter.heroku.com', {reqheaders: auth})
        .get('/articles/private-only.json')
        .reply(401)
      nock('https://devcenter.heroku.com', {reqheaders: auth})
        .get('/api/v1/private/articles/private-only.json')
        .reply(200, {
          content: 'Private.',
          id: 42,
          slug: 'private-only',
          title: 'Private Only Title',
        })

      const {error} = await runCommand(Open, ['private-only'])
      expect(error).toBeUndefined()
      expect((childProcess.spawn as SinonStub).called).toBe(true)
    } finally {
      if (savedKey === undefined) {
        delete process.env.HEROKU_API_KEY
      } else {
        process.env.HEROKU_API_KEY = savedKey
      }
    }
  })

  it('fails with not-found hints when article cannot be resolved', async () => {
    const savedKey = process.env.HEROKU_API_KEY
    delete process.env.HEROKU_API_KEY
    try {
      nock('https://devcenter.heroku.com').get('/articles/missing.json').reply(404)
      nock('https://devcenter.heroku.com')
        .get('/api/v1/search.json')
        .query({query: 'missing'})
        .reply(200, {results: []})

      const {error} = await runCommand(Open, ['missing'])
      expect(error?.message).toContain('No missing article found')
    } finally {
      if (savedKey === undefined) {
        delete process.env.HEROKU_API_KEY
      } else {
        process.env.HEROKU_API_KEY = savedKey
      }
    }
  })
})
