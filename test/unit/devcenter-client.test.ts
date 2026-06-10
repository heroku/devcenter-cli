import nock from 'nock'
import {
  afterEach, describe, expect, it,
} from 'vitest'

import {DevcenterClient} from '../../src/lib/devcenter-client.js'

describe('DevcenterClient', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('head returns redirect with location header', async () => {
    nock('https://devcenter.heroku.com')
      .head('/articles/moved')
      .reply(302, undefined, {Location: 'https://devcenter.heroku.com/articles/new-slug'})

    const client = new DevcenterClient()
    const res = await client.head('/articles/moved')
    expect(res.redirect).toBe(true)
    expect(res.location).toContain('new-slug')
    expect(res.ok).toBe(false)
  })

  it('head returns notFound for 404', async () => {
    nock('https://devcenter.heroku.com').head('/articles/nope').reply(404)
    const client = new DevcenterClient()
    const res = await client.head('/articles/nope')
    expect(res.notFound).toBe(true)
  })

  it('getJson sends Authorization when token is passed', async () => {
    nock('https://devcenter.heroku.com', {
      reqheaders: {authorization: `Basic ${Buffer.from('secret').toString('base64')}`},
    })
      .get('/articles/z.json')
      .reply(200, {
        content: 'x', id: 1, slug: 'z', title: 'Z',
      })

    const client = new DevcenterClient()
    const res = await client.getJson('/articles/z.json', undefined, {token: 'secret'})
    expect(res.ok).toBe(true)
    expect((res.body as {slug?: string}).slug).toBe('z')
  })

  it('getJson parses query params and rejects non-empty non-JSON body', async () => {
    nock('https://devcenter.heroku.com')
      .get('/articles/x.json')
      .query({foo: 'bar'})
      .reply(200, 'not-json')

    const client = new DevcenterClient()
    const res = await client.getJson('/articles/x.json', {foo: 'bar'})
    expect(res.ok).toBe(false)
    expect(res.status).toBe(200)
    expect(res.body).toEqual({})
  })

  it('getJson treats whitespace-only body as empty object', async () => {
    nock('https://devcenter.heroku.com').get('/articles/empty.json').query({}).reply(200, '  \n  ')

    const client = new DevcenterClient()
    const res = await client.getJson('/articles/empty.json')
    expect(res.ok).toBe(true)
    expect(res.body).toEqual({})
  })

  it('authForm parses JSON body and falls back to raw string on parse error', async () => {
    nock('https://devcenter.heroku.com')
      .put('/api/v1/private/articles/1.json', () => true)
      .reply(200, 'plain-text-not-json')

    const client = new DevcenterClient()
    const res = await client.updateArticle('tok', 1, {'article[content]': 'c', 'article[title]': 't'})
    expect(res.ok).toBe(true)
    expect(res.body).toBe('plain-text-not-json')
  })

  it('validateArticle posts to the validate endpoint', async () => {
    nock('https://devcenter.heroku.com')
      .post('/api/v1/private/articles/9/validate.json')
      .reply(200, {})

    const client = new DevcenterClient()
    const res = await client.validateArticle('tok', 9, {'article[title]': 'Hi'})
    expect(res.ok).toBe(true)
  })

  it('uses a custom base URL from the constructor', async () => {
    nock('http://localhost:9999').head('/articles/z').reply(200)
    const client = new DevcenterClient('http://localhost:9999')
    const res = await client.head('/articles/z')
    expect(res.ok).toBe(true)
  })
})
