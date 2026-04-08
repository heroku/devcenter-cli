import {Command} from '@heroku-cli/command'
import {Args, Flags, ux} from '@oclif/core'

export default class Preview extends Command {
  static args = {
    slug: Args.string({
      description: 'article slug (local <slug>.md file)',
      required: true,
    }),
  }
  static description = 'preview a local Dev Center article in the browser with live reload'
  static flags = {
    host: Flags.string({description: 'bind host for the preview server'}),
    port: Flags.integer({description: 'port for the preview server'}),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Preview)
    const host = flags.host ?? '(default)'
    const port = flags.port ?? '(default)'
    ux.warn(`devcenter:preview is not yet implemented (slug: ${args.slug}, host: ${host}, port: ${port})`)
  }
}
