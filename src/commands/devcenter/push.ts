import {Command} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import createDebug from 'debug'
import {existsSync} from 'node:fs'
import {stringify as stringifyYaml} from 'yaml'

import {ArticleFile} from '../../lib/article-file.js'

const dbg = createDebug('devcenter:push')
import {DevcenterClient} from '../../lib/devcenter-client.js'
import {getHerokuApiToken} from '../../lib/heroku-api-auth.js'
import {mdFilePath} from '../../lib/paths.js'

function hasValidationErrors(body: unknown): boolean {
  if (body === undefined || body === null) {
    return false
  }

  if (Array.isArray(body)) {
    return body.length > 0
  }

  if (typeof body === 'object') {
    return Object.keys(body).length > 0
  }

  return false
}

type UpdateBody = {
  error?: string
  status?: string
  title?: string
  url?: string
}

export default class Push extends Command {
  static args = {
    slug: Args.string({
      description: 'article slug (optional .md suffix is ignored)',
      required: true,
    }),
  }
  static description = 'update a Dev Center article from a local markdown file'

  async run(): Promise<void> {
    const {args} = await this.parse(Push)
    const slug = args.slug.replace(/\.md$/i, '').trim()
    const mdPath = mdFilePath(slug)
    if (!existsSync(mdPath)) {
      this.error(`Can't find ${mdPath} file - you may want to \`heroku devcenter:pull ${slug}\``, {exit: 1})
    }

    const article = ArticleFile.read(mdPath)
    if (article.parsingError) {
      this.error(`The content of ${mdPath} can't be parsed properly, fix it and try again.`, {exit: 1})
    }

    let token: string
    try {
      token = getHerokuApiToken()
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.error(message, {exit: 1})
    }

    const client = new DevcenterClient()
    const formParams = {
      'article[content]': article.content,
      'article[title]': String(article.metadata.title),
    }

    dbg(`Pushing article id=${article.metadata.id} title="${article.metadata.title}"`)

    const broken = await client.checkBrokenLinks(token, article.content)
    dbg(`Broken link check: ${Array.isArray(broken.body) ? broken.body.length : 0} issues`)
    const links = broken.body
    if (Array.isArray(links) && links.length > 0) {
      this.log(`The article "${slug}" contains broken link/s:`)
      for (const link of links as Array<{text: string; url: string}>) {
        this.log(`- [${link.text}](${link.url})`)
      }

      this.log('')
    }

    const validated = await client.validateArticle(token, article.metadata.id, formParams)
    dbg(`Validation response: status=${validated.status} ok=${validated.ok}`)
    if (hasValidationErrors(validated.body)) {
      const dumped = stringifyYaml(validated.body)
      this.error(`The article "${slug}" can't be saved:\n${dumped}`, {exit: 1})
    }

    const updated = await client.updateArticle(token, article.metadata.id, formParams)
    dbg(`Update response: status=${updated.status} ok=${updated.ok}`)
    if (!updated.ok) {
      const errBody = updated.body as {error?: string}
      this.error(`Error pushing "${slug}": ${errBody.error ?? updated.status}`, {exit: 1})
    }

    const result = updated.body as UpdateBody
    const verb = statusVerb(result.status)
    if (verb && result.title && result.url) {
      this.log(`Article "${result.title}" ${verb} to ${result.url}`)
    } else {
      this.log('Article update completed.')
    }
  }
}

function statusVerb(status: string | undefined): string | undefined {
  switch (status) {
    case 'archived': {
      return 'archived'
    }

    case 'draft': {
      return 'pushed in draft mode'
    }

    case 'published': {
      return 'published'
    }

    case 'published_quietly': {
      return 'published quietly'
    }

    case 'staging': {
      return 'pushed as staging mode'
    }

    default: {
      return undefined
    }
  }
}
