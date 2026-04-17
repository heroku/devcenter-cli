import {expect} from 'chai'

import {
  articleApiPath,
  articlePath,
  articleUrlMatches,
  getArticleWorkingDirectory,
  getDevcenterBaseUrl,
  slugFromArticleUrl,
} from '../../src/lib/paths.js'

describe('paths', function () {
  afterEach(function () {
    delete process.env.DEVCENTER_CLI_CWD
    delete process.env.DEVCENTER_BASE_URL
  })

  it('getDevcenterBaseUrl respects DEVCENTER_BASE_URL', function () {
    process.env.DEVCENTER_BASE_URL = 'https://example.test'
    expect(getDevcenterBaseUrl()).to.equal('https://example.test')
  })

  it('getArticleWorkingDirectory uses DEVCENTER_CLI_CWD when set', function () {
    process.env.DEVCENTER_CLI_CWD = '/tmp/example-articles'
    expect(getArticleWorkingDirectory()).to.equal('/tmp/example-articles')
  })

  it('articlePath builds /articles/:slug', function () {
    expect(articlePath('ps')).to.equal('/articles/ps')
  })

  it('articleApiPath appends .json', function () {
    expect(articleApiPath('ps')).to.equal('/articles/ps.json')
  })

  it('slugFromArticleUrl extracts slug from URL or returns input', function () {
    expect(slugFromArticleUrl('https://devcenter.heroku.com/articles/foo-bar')).to.equal('foo-bar')
    expect(slugFromArticleUrl('plain-slug')).to.equal('plain-slug')
  })

  it('articleUrlMatches restricts to dev center article URLs', function () {
    expect(articleUrlMatches('https://devcenter.heroku.com/articles/x', 'https://devcenter.heroku.com')).to.equal(true)
    expect(articleUrlMatches('https://example.com/articles/x', 'https://devcenter.heroku.com')).to.equal(false)
  })
})
