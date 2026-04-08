import * as cheerio from 'cheerio'
import MarkdownIt from 'markdown-it'
import anchor from 'markdown-it-anchor'
import {readFileSync} from 'node:fs'
import {parse as parseYaml} from 'yaml'

import {splitMetadataBody} from './article-split.js'

export type ArticleMetadata = {
  id: number | string
  title: string
}

const md = new MarkdownIt({html: false, linkify: true, typographer: true})
md.use(anchor, {permalink: false})

export type TocEntry = {id: string; text: string}

export class ArticleFile {
  content: string
  html: string
  metadata: ArticleMetadata
  parsingError?: string
  toc: TocEntry[]

  constructor(opts: {content?: string; metadata?: Partial<ArticleMetadata>;}) {
    this.metadata = opts.metadata as ArticleMetadata
    this.content = opts.content ?? ''
    try {
      this.html = md.render(this.content)
    } catch (error) {
      this.parsingError = error instanceof Error ? error.message : String(error)
      this.html = ''
    }

    if (this.html) {
      const $ = cheerio.load(this.html)
      this.toc = $('h2')
      .toArray()
      .map(el => {
        const $el = $(el)
        return {
          id: $el.attr('id') ?? '',
          text: $el.text(),
        }
      })
    } else {
      this.toc = []
    }
  }

  static read(srcPath: string): ArticleFile {
    const src = readFileSync(srcPath, 'utf8')
    const {body, yamlText} = splitMetadataBody(src)
    const metadata = parseYaml(yamlText) as ArticleMetadata
    return new ArticleFile({content: body, metadata})
  }
}
