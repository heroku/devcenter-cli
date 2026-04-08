import {expect} from 'chai'

import {
  articleApiPath,
  articlePath,
  articleUrlMatches,
  slugFromArticleUrl,
} from '../../dist/lib/paths.js'

describe('paths', function () {
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
