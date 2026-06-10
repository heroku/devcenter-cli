import {describe, expect, it} from 'vitest'

import {ArticleFile} from '../../src/lib/article-file.js'
import {renderNotFoundPage, renderPreviewPage} from '../../src/lib/preview-templates.js'

describe('preview-templates', () => {
  it('renderPreviewPage includes table of contents when h2 anchors exist', () => {
    const article = new ArticleFile({
      content: '## One\n\n## Two\n',
      metadata: {id: 1, title: 'TOC Test'},
    })
    const {html} = renderPreviewPage(article, 'slug')
    expect(html).toContain('table-of-contents')
    expect(html).toContain('TOC Test')
  })

  it('renderPreviewPage shows parsing error when html is empty and parsingError is set', () => {
    const article = new ArticleFile({content: 'x', metadata: {id: 1, title: 'T'}})
    article.html = ''
    article.parsingError = 'bad markdown'
    const {html} = renderPreviewPage(article, 'slug')
    expect(html).toContain('Parsing error')
    expect(html).toContain('bad markdown')
  })

  it('renderPreviewPage shows no content when html and parsingError are empty', () => {
    const article = new ArticleFile({content: '', metadata: {id: 1, title: 'Empty'}})
    article.html = ''
    const {html} = renderPreviewPage(article, 'slug')
    expect(html).toContain('No content.')
  })

  it('renderPreviewPage uses slug as title when metadata title is missing', () => {
    const article = new ArticleFile({content: '# H', metadata: {id: 1, title: ''}})
    const {html, title} = renderPreviewPage(article, 'fallback-slug')
    expect(title).toBe('fallback-slug')
    expect(html).toContain('Preview: fallback-slug')
  })

  it('renderNotFoundPage includes return link when referrer is set', () => {
    const html = renderNotFoundPage('http://127.0.0.1:3000/prev')
    expect(html).toContain('Return to your article')
    expect(html).toContain('http://127.0.0.1:3000/prev')
  })
})
