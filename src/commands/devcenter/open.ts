import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import createDebug from 'debug'
import open from 'open'

import {formatArticleNotFoundMessage} from '../../lib/article-not-found.js'
import {fetchArticleJsonForSlug} from '../../lib/article-resolve.js'
import {DevcenterClient} from '../../lib/devcenter-client.js'
import {articlePath, getDevcenterBaseUrl} from '../../lib/paths.js'

const dbg = createDebug('devcenter:open')

export default class Open extends Command {
  static args = {
    slug: Args.string({
      description: 'article slug (e.g. ps for https://devcenter.heroku.com/articles/ps)',
      required: true,
    }),
  }
  static description
    = 'open a Dev Center article in the browser (uses Heroku credentials for private or draft content when available)'

  async run(): Promise<void> {
    const {args} = await this.parse(Open)
    const slug = args.slug.trim()
    const client = new DevcenterClient()

    dbg(`baseUrl=${getDevcenterBaseUrl()} path=${articlePath(slug)} expectedSlug=${slug}`)

    const token = await this.heroku.getAuth()
    const article = await fetchArticleJsonForSlug(client, slug, token, dbg)
    if (!article) {
      const msg = await formatArticleNotFoundMessage(client, slug)
      this.error(msg, {exit: 1})
    }

    dbg('Article found, opening')
    await open(`${getDevcenterBaseUrl()}${articlePath(slug)}`)
  }
}
