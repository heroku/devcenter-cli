import {expect} from 'chai'

import {ArticleFile} from '../../src/lib/article-file.js'
import {renderNotFoundPage, renderPreviewPage} from '../../src/lib/preview-templates.js'

describe('preview-templates', function () {
  it('renderPreviewPage includes table of contents when h2 anchors exist', function () {
    const article = new ArticleFile({
      content: '## One\n\n## Two\n',
      metadata: {id: 1, title: 'TOC Test'},
    })
    const {html} = renderPreviewPage(article, 'slug')
    expect(html).to.contain('table-of-contents')
    expect(html).to.contain('TOC Test')
  })

  it('renderPreviewPage shows parsing error when html is empty and parsingError is set', function () {
    const article = new ArticleFile({content: 'x', metadata: {id: 1, title: 'T'}})
    article.html = ''
    article.parsingError = 'bad markdown'
    const {html} = renderPreviewPage(article, 'slug')
    expect(html).to.contain('Parsing error')
    expect(html).to.contain('bad markdown')
  })

  it('renderPreviewPage shows no content when html and parsingError are empty', function () {
    const article = new ArticleFile({content: '', metadata: {id: 1, title: 'Empty'}})
    article.html = ''
    const {html} = renderPreviewPage(article, 'slug')
    expect(html).to.contain('No content.')
  })

  it('renderPreviewPage uses slug as title when metadata title is missing', function () {
    const article = new ArticleFile({content: '# H', metadata: {id: 1, title: ''}})
    const {html, title} = renderPreviewPage(article, 'fallback-slug')
    expect(title).to.equal('fallback-slug')
    expect(html).to.contain('Preview: fallback-slug')
  })

  it('renderNotFoundPage includes return link when referrer is set', function () {
    const html = renderNotFoundPage('http://127.0.0.1:3000/prev')
    expect(html).to.contain('Return to your article')
    expect(html).to.contain('http://127.0.0.1:3000/prev')
  })
})
