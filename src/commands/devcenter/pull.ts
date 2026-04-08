import {Command} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'

export default class Pull extends Command {
  static args = {
    slugOrUrl: Args.string({
      description: 'article slug or full Dev Center article URL',
      required: true,
    }),
  }
  static description = 'save a local copy of a Dev Center article'

  async run(): Promise<void> {
    const {args} = await this.parse(Pull)
    ux.warn(`devcenter:pull is not yet implemented (${args.slugOrUrl})`)
  }
}
