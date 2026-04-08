import {expect} from 'chai'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {ArticleFile} from '../../dist/lib/article-file.js'

describe('ArticleFile', function () {
  it('reads YAML front matter and markdown body', function () {
    const dir = mkdtempSync(join(tmpdir(), 'devcenter-article-'))
    try {
      const p = join(dir, 'sample.md')
      writeFileSync(
        p,
        `title: Hello
id: 42

# Body here
`,
        'utf8',
      )
      const article = ArticleFile.read(p)
      expect(article.metadata.title).to.equal('Hello')
      expect(article.metadata.id).to.equal(42)
      expect(article.content.trim()).to.equal('# Body here')
      expect(article.html).to.contain('Body here')
    } finally {
      rmSync(dir, {recursive: true})
    }
  })

  it('renders inline markdown to HTML', function () {
    const dir = mkdtempSync(join(tmpdir(), 'devcenter-article-'))
    try {
      const p = join(dir, 'bold.md')
      writeFileSync(
        p,
        `title: T
id: 1

Hello **world**
`,
        'utf8',
      )
      const a = ArticleFile.read(p)
      expect(a.html).to.contain('strong')
    } finally {
      rmSync(dir, {recursive: true})
    }
  })
})
