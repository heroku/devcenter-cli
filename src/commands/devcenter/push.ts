import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

export default class Push extends Command {
  static args = {
    slug: Args.string({
      description: 'article slug',
      required: true,
    }),
  }
  static description = 'update a Dev Center article from a local markdown file'

  async run(): Promise<void> {
    const {args} = await this.parse(Push)
    ux.warn(`devcenter:push is not yet implemented (slug: ${args.slug})`)
  }
}
