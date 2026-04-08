import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

export default class Open extends Command {
  static args = {
    slug: Args.string({
      description: 'article slug (e.g. ps for https://devcenter.heroku.com/articles/ps)',
      required: true,
    }),
  }
  static description = 'open a published Dev Center article in your browser'

  async run(): Promise<void> {
    const {args} = await this.parse(Open)
    ux.warn(`devcenter:open is not yet implemented (slug: ${args.slug})`)
  }
}
