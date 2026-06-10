import {
  afterEach, describe, expect, it,
} from 'vitest'

import {
  articleApiPath,
  articlePath,
  articleUrlMatches,
  getArticleWorkingDirectory,
  getDevcenterBaseUrl,
  slugFromArticleUrl,
} from '../../src/lib/paths.js'

describe('paths', () => {
  afterEach(() => {
    delete process.env.DEVCENTER_CLI_CWD
    delete process.env.DEVCENTER_BASE_URL
  })

  it('getDevcenterBaseUrl respects DEVCENTER_BASE_URL', () => {
    process.env.DEVCENTER_BASE_URL = 'https://example.test'
    expect(getDevcenterBaseUrl()).toBe('https://example.test')
  })

  it('getArticleWorkingDirectory uses DEVCENTER_CLI_CWD when set', () => {
    process.env.DEVCENTER_CLI_CWD = '/tmp/example-articles'
    expect(getArticleWorkingDirectory()).toBe('/tmp/example-articles')
  })

  it('articlePath builds /articles/:slug', () => {
    expect(articlePath('ps')).toBe('/articles/ps')
  })

  it('articleApiPath appends .json', () => {
    expect(articleApiPath('ps')).toBe('/articles/ps.json')
  })

  it('slugFromArticleUrl extracts slug from URL or returns input', () => {
    expect(slugFromArticleUrl('https://devcenter.heroku.com/articles/foo-bar')).toBe('foo-bar')
    expect(slugFromArticleUrl('plain-slug')).toBe('plain-slug')
  })

  it('articleUrlMatches restricts to dev center article URLs', () => {
    expect(articleUrlMatches('https://devcenter.heroku.com/articles/x', 'https://devcenter.heroku.com')).toBe(true)
    expect(articleUrlMatches('https://example.com/articles/x', 'https://devcenter.heroku.com')).toBe(false)
  })
})
