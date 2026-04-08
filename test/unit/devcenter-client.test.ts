import {expect} from 'chai'
import nock from 'nock'

import {DevcenterClient} from '../../src/lib/devcenter-client.js'

describe('DevcenterClient', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('head returns redirect with location header', async function () {
    nock('https://devcenter.heroku.com')
    .head('/articles/moved')
    .reply(302, undefined, {Location: 'https://devcenter.heroku.com/articles/new-slug'})

    const client = new DevcenterClient()
    const res = await client.head('/articles/moved')
    expect(res.redirect).to.equal(true)
    expect(res.location).to.contain('new-slug')
    expect(res.ok).to.equal(false)
  })

  it('head returns notFound for 404', async function () {
    nock('https://devcenter.heroku.com').head('/articles/nope').reply(404)
    const client = new DevcenterClient()
    const res = await client.head('/articles/nope')
    expect(res.notFound).to.equal(true)
  })

  it('getJson parses query params and tolerates invalid JSON body', async function () {
    nock('https://devcenter.heroku.com')
    .get('/articles/x.json')
    .query({foo: 'bar'})
    .reply(200, 'not-json')

    const client = new DevcenterClient()
    const res = await client.getJson('/articles/x.json', {foo: 'bar'})
    expect(res.ok).to.equal(true)
    expect(res.body).to.deep.equal({})
  })

  it('authForm parses JSON body and falls back to raw string on parse error', async function () {
    nock('https://devcenter.heroku.com')
    .put('/api/v1/private/articles/1.json', () => true)
    .reply(200, 'plain-text-not-json')

    const client = new DevcenterClient()
    const res = await client.updateArticle('tok', 1, {'article[content]': 'c', 'article[title]': 't'})
    expect(res.ok).to.equal(true)
    expect(res.body).to.equal('plain-text-not-json')
  })

  it('validateArticle posts to the validate endpoint', async function () {
    nock('https://devcenter.heroku.com')
    .post('/api/v1/private/articles/9/validate.json')
    .reply(200, {})

    const client = new DevcenterClient()
    const res = await client.validateArticle('tok', 9, {'article[title]': 'Hi'})
    expect(res.ok).to.equal(true)
  })

  it('uses a custom base URL from the constructor', async function () {
    nock('http://localhost:9999').head('/articles/z').reply(200)
    const client = new DevcenterClient('http://localhost:9999')
    const res = await client.head('/articles/z')
    expect(res.ok).to.equal(true)
  })
})
