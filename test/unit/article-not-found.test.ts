import nock from 'nock'
import {
  afterEach, describe, expect, it,
} from 'vitest'

import {formatArticleNotFoundMessage} from '../../src/lib/article-not-found.js'
import {DevcenterClient} from '../../src/lib/devcenter-client.js'

describe('formatArticleNotFoundMessage', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('includes search suggestions for devcenter article URLs', async () => {
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
    expect(msg).toContain('No foo article found.')
    expect(msg).toContain('Perhaps you meant one of these:')
    expect(msg).toContain('foo-bar')
    expect(msg).toContain('Foo Bar Title')
  })

  it('ignores search hits that are not devcenter article URLs', async () => {
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
    expect(msg).toContain('No x article found.')
    expect(msg).not.toContain('Perhaps you meant')
  })
})
