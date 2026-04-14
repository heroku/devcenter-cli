import {expect} from 'chai'
import nock from 'nock'

import {formatArticleNotFoundMessage} from '../../src/lib/article-not-found.js'
import {DevcenterClient} from '../../src/lib/devcenter-client.js'

describe('formatArticleNotFoundMessage', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('includes search suggestions for devcenter article URLs', async function () {
    nock('https://devcenter.heroku.com')
      .get('/api/v1/search.json')
      .query({query: 'foo'})
      .reply(200, {
        results: [
          {
            // eslint-disable-next-line camelcase
            full_url: 'https://devcenter.heroku.com/articles/foo-bar',
            slug: 'foo-bar',
            title: 'Foo Bar Title',
          },
        ],
      })

    const client = new DevcenterClient()
    const msg = await formatArticleNotFoundMessage(client, 'foo')
    expect(msg).to.contain('No foo article found.')
    expect(msg).to.contain('Perhaps you meant one of these:')
    expect(msg).to.contain('foo-bar')
    expect(msg).to.contain('Foo Bar Title')
  })

  it('ignores search hits that are not devcenter article URLs', async function () {
    nock('https://devcenter.heroku.com')
      .get('/api/v1/search.json')
      .query({query: 'x'})
      .reply(200, {
        results: [
          {
            // eslint-disable-next-line camelcase
            full_url: 'https://example.com/articles/x',
            slug: 'x',
            title: 'External',
          },
        ],
      })

    const client = new DevcenterClient()
    const msg = await formatArticleNotFoundMessage(client, 'x')
    expect(msg).to.contain('No x article found.')
    expect(msg).not.to.contain('Perhaps you meant')
  })
})
