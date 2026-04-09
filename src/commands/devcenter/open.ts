import {Command} from '@heroku-cli/command'
import {Args, Flags} from '@oclif/core'
import open from 'open'

import {formatArticleNotFoundMessage} from '../../lib/article-not-found.js'
import {DevcenterClient} from '../../lib/devcenter-client.js'
import {articlePath, getDevcenterBaseUrl} from '../../lib/paths.js'

export default class Open extends Command {
  static args = {
    slug: Args.string({
      description: 'article slug (e.g. ps for https://devcenter.heroku.com/articles/ps)',
      required: true,
    }),
  }
  static description = 'open a published Dev Center article in your browser'
  static flags = {
    debug: Flags.boolean({
      description: 'print internal debug messages',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Open)
    const slug = args.slug.trim()
    if (!slug) {
      this.error('Please provide a slug (e.g: ps is the slug for https://devcenter.heroku.com/articles/ps)', {
        exit: 1,
      })
    }

    const client = new DevcenterClient()
    const path = articlePath(slug)
    const dbg = (message: string) => {
      if (flags.debug) {
        process.stdout.write(`devcenter: ${message}\n`)
      }
    }

    dbg(`Connecting to ${path}`)
    const res = await client.head(path)
    if (res.ok) {
      dbg('Page found, opening')
      if (!process.env.DEVCENTER_CLI_TEST) {
        await open(`${getDevcenterBaseUrl()}${path}`)
      }
    } else if (res.redirect) {
      this.error(`Redirected to ${res.location ?? 'unknown'}`, {exit: 1})
    } else if (res.notFound) {
      const msg = await formatArticleNotFoundMessage(client, slug)
      this.error(msg, {exit: 1})
    } else {
      this.error(`Unexpected response for ${path}`, {exit: 1})
    }
  }
}
