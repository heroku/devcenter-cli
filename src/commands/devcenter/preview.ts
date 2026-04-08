import {Command} from '@heroku-cli/command'
import {Args, Flags} from '@oclif/core'
import {existsSync} from 'node:fs'

import {mdFilePath} from '../../lib/paths.js'
import {runPreview} from '../../lib/preview-server.js'

function writePreviewLog(message: string): void {
  process.stdout.write(`${message}\n`)
}

export default class Preview extends Command {
  static args = {
    slug: Args.string({
      description: 'article slug (local <slug>.md file)',
      required: true,
    }),
  }
  static description = 'preview a local Dev Center article in the browser with live reload'
  static flags = {
    host: Flags.string({
      default: '127.0.0.1',
      description: 'bind host for the preview server',
    }),
    port: Flags.integer({
      default: 3000,
      description: 'port for the preview server',
    }),
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Preview)
    const slug = args.slug.replace(/\.md$/i, '').trim()
    if (!slug) {
      this.error('Please provide an article slug', {exit: 1})
    }

    const mdPath = mdFilePath(slug)
    if (!existsSync(mdPath)) {
      this.error(`Can't find ${mdPath} file - you may want to \`heroku devcenter:pull ${slug}\``, {exit: 1})
    }

    const host = flags.host ?? '127.0.0.1'
    const port = flags.port ?? 3000

    await runPreview({
      host,
      log: writePreviewLog,
      mdPath,
      port,
      slug,
    })
  }
}
