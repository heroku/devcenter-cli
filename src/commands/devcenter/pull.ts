import {Command} from '@heroku-cli/command'
import {confirm} from '@inquirer/prompts'
import {Args, Flags} from '@oclif/core'
import {existsSync, writeFileSync} from 'node:fs'
import {stringify as stringifyYaml} from 'yaml'

import {formatArticleNotFoundMessage} from '../../lib/article-not-found.js'
import {DevcenterClient} from '../../lib/devcenter-client.js'
import {articleApiPath, mdFilePath, slugFromArticleUrl} from '../../lib/paths.js'

type ArticleJson = {
  content: string
  id: number | string
  slug: string
  title: string
}

export default class Pull extends Command {
  static args = {
    slugOrUrl: Args.string({
      description: 'article slug or full Dev Center article URL',
      required: true,
    }),
  }
  static description = 'save a local copy of a Dev Center article'
  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'overwrite an existing local file without prompting',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Pull)
    const raw = args.slugOrUrl.trim()
    const slug = slugFromArticleUrl(raw).trim()
    if (!slug) {
      this.error(
        'Please provide an article slug or full URL (e.g. ps or https://devcenter.heroku.com/articles/ps)',
        {exit: 1},
      )
    }

    const client = new DevcenterClient()
    const {body, ok} = await client.getJson<ArticleJson>(articleApiPath(slug))
    const articleOk = ok && body?.slug === slug
    if (!articleOk) {
      const msg = await formatArticleNotFoundMessage(client, slug)
      this.error(msg, {exit: 1})
    }

    const article = body
    const metadata = {id: article.id, title: article.title}
    const filePath = mdFilePath(slug)

    if (!flags.force && existsSync(filePath)) {
      const ok = await confirm({message: `The file ${filePath} already exists - overwrite?`})
      if (!ok) {
        return
      }
    }

    const yamlBlock = stringifyYaml(metadata).trimEnd()
    const fileContent = `${yamlBlock}\n\n${article.content}`
    writeFileSync(filePath, fileContent, 'utf8')
    this.log(`"${metadata.title}" article saved as ${filePath}`)
  }
}
