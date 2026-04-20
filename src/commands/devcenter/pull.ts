import {Command} from '@heroku-cli/command'
import {confirm} from '@heroku/heroku-cli-util/hux'
import {Args, Flags} from '@oclif/core'
import createDebug from 'debug'
import {existsSync, writeFileSync} from 'node:fs'
import {stringify as stringifyYaml} from 'yaml'

import {formatArticleNotFoundMessage} from '../../lib/article-not-found.js'
import {fetchArticleJsonForSlug} from '../../lib/article-resolve.js'
import {DevcenterClient} from '../../lib/devcenter-client.js'
import {
  articleApiPath,
  getDevcenterBaseUrl,
  mdFilePath,
  slugFromArticleUrl,
} from '../../lib/paths.js'

const dbg = createDebug('devcenter:pull')

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
    const client = new DevcenterClient()
    dbg(`baseUrl=${getDevcenterBaseUrl()} path=${articleApiPath(slug)} expectedSlug=${slug}`)

    const token = await this.heroku.getAuth()
    const article = await fetchArticleJsonForSlug(client, slug, token, dbg)
    if (!article) {
      const msg = await formatArticleNotFoundMessage(client, slug)
      this.error(msg, {exit: 1})
    }

    const metadata = {id: article.id, title: article.title}
    const filePath = mdFilePath(slug)

    if (!flags.force && existsSync(filePath)) {
      const shouldOverwrite = await confirm(`The file ${filePath} already exists - overwrite?`)
      if (!shouldOverwrite) {
        return
      }
    }

    const yamlBlock = stringifyYaml(metadata).trimEnd()
    const fileContent = `${yamlBlock}\n\n${article.content}`
    writeFileSync(filePath, fileContent, 'utf8')
    this.log(`"${metadata.title}" article saved as ${filePath}`)
  }
}
