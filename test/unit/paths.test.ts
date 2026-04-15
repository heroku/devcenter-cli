import {expect} from 'chai'
import {resolve} from 'node:path'

import {
  articleApiPath,
  articlePath,
  articleUrlMatches,
  brokenLinkChecksPath,
  getArticleWorkingDirectory,
  getDevcenterBaseUrl,
  mdFilePath,
  privateArticleShowPath,
  searchApiPath,
  slugFromArticleUrl,
  updateArticlePath,
  validateArticlePath,
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

  it('getDevcenterBaseUrl defaults to devcenter.heroku.com', function () {
    delete process.env.DEVCENTER_BASE_URL
    expect(getDevcenterBaseUrl()).to.equal('https://devcenter.heroku.com')
  })

  it('getArticleWorkingDirectory uses DEVCENTER_CLI_CWD when set', function () {
    process.env.DEVCENTER_CLI_CWD = '/tmp/example-articles'
    expect(getArticleWorkingDirectory()).to.equal('/tmp/example-articles')
  })

  it('getArticleWorkingDirectory defaults to cwd', function () {
    delete process.env.DEVCENTER_CLI_CWD
    expect(getArticleWorkingDirectory()).to.equal(process.cwd())
  })

  it('articlePath builds /articles/:slug', function () {
    expect(articlePath('ps')).to.equal('/articles/ps')
  })

  it('articleApiPath appends .json', function () {
    expect(articleApiPath('ps')).to.equal('/articles/ps.json')
  })

  it('searchApiPath returns the search endpoint', function () {
    expect(searchApiPath()).to.equal('/api/v1/search.json')
  })

  it('validateArticlePath builds the validate endpoint', function () {
    expect(validateArticlePath(123)).to.equal('/api/v1/private/articles/123/validate.json')
    expect(validateArticlePath('abc')).to.equal('/api/v1/private/articles/abc/validate.json')
  })

  it('updateArticlePath builds the update endpoint', function () {
    expect(updateArticlePath(456)).to.equal('/api/v1/private/articles/456.json')
  })

  it('privateArticleShowPath encodes the slug', function () {
    expect(privateArticleShowPath('my-article')).to.equal('/api/v1/private/articles/my-article.json')
    expect(privateArticleShowPath('slug/with/slash')).to.equal('/api/v1/private/articles/slug%2Fwith%2Fslash.json')
  })

  it('brokenLinkChecksPath returns the broken link checks endpoint', function () {
    expect(brokenLinkChecksPath()).to.equal('/api/v1/private/broken-link-checks.json')
  })

  it('slugFromArticleUrl extracts slug from URL or returns input', function () {
    expect(slugFromArticleUrl('https://devcenter.heroku.com/articles/foo-bar')).to.equal('foo-bar')
    expect(slugFromArticleUrl('plain-slug')).to.equal('plain-slug')
    expect(slugFromArticleUrl('')).to.equal('')
    expect(slugFromArticleUrl('https://devcenter.heroku.com/articles/slug?query=1')).to.equal('slug')
    expect(slugFromArticleUrl('https://devcenter.heroku.com/articles/slug#anchor')).to.equal('slug')
  })

  it('articleUrlMatches restricts to dev center article URLs', function () {
    expect(articleUrlMatches('https://devcenter.heroku.com/articles/x', 'https://devcenter.heroku.com')).to.equal(true)
    expect(articleUrlMatches('https://example.com/articles/x', 'https://devcenter.heroku.com')).to.equal(false)
  })

  it('mdFilePath resolves to the article working directory', function () {
    process.env.DEVCENTER_CLI_CWD = '/tmp/articles'
    const expected = resolve('/tmp/articles', 'my-article.md')
    expect(mdFilePath('my-article')).to.equal(expected)
  })
})
