import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, expect, it} from 'vitest'

import {ArticleFile} from '../../src/lib/article-file.js'

describe('ArticleFile', () => {
  it('reads YAML front matter and markdown body', () => {
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
      expect(article.metadata.title).toBe('Hello')
      expect(article.metadata.id).toBe(42)
      expect(article.content.trim()).toBe('# Body here')
      expect(article.html).toContain('Body here')
    } finally {
      rmSync(dir, {recursive: true})
    }
  })

  it('renders inline markdown to HTML', () => {
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
      expect(a.html).toContain('strong')
    } finally {
      rmSync(dir, {recursive: true})
    }
  })

  it('read throws when the file has no YAML/content separator', () => {
    const dir = mkdtempSync(join(tmpdir(), 'devcenter-article-'))
    try {
      const p = join(dir, 'bad.md')
      writeFileSync(p, 'not valid article format', 'utf8')
      expect(() => ArticleFile.read(p)).toThrow(/Invalid article file/)
    } finally {
      rmSync(dir, {recursive: true})
    }
  })
})
