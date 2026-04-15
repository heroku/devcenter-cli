import {Command} from '@heroku-cli/command'
import {confirm} from '@inquirer/prompts'
import {Args, Flags} from '@oclif/core'
import createDebug from 'debug'
import {existsSync, writeFileSync} from 'node:fs'
import {stringify as stringifyYaml} from 'yaml'

import {formatArticleNotFoundMessage} from '../../lib/article-not-found.js'
import {DevcenterClient} from '../../lib/devcenter-client.js'
import {getHerokuApiToken} from '../../lib/heroku-api-auth.js'
import {
  articleApiPath,
  getDevcenterBaseUrl,
  mdFilePath,
  privateArticleShowPath,
  slugFromArticleUrl,
} from '../../lib/paths.js'

type ArticleJson = {
  content: string
  id: number | string
  slug: string
  title: string
}

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
    if (!slug) {
      this.error(
        'Please provide an article slug or full URL (e.g. ps or https://devcenter.heroku.com/articles/ps)',
        {exit: 1},
      )
    }

    const client = new DevcenterClient()
    const path = articleApiPath(slug)
    dbg(`baseUrl=${getDevcenterBaseUrl()} path=${path} expectedSlug=${slug}`)

    let {body, ok, status} = await client.getJson<ArticleJson>(path)
    let articleOk = ok && body?.slug === slug
    logArticleJsonFetch(dbg, {
      expectedSlug: slug, label: 'no auth', path, res: {body, ok, status},
    })

    let token: string | undefined
    try {
      token = getHerokuApiToken()
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      dbg(`Heroku ~/.netrc token unavailable: ${msg}`)
    }

    if (!articleOk && token) {
      dbg('retrying GET with Heroku ~/.netrc token (public JSON)')
      const authed = await client.getJson<ArticleJson>(path, undefined, {token})
      body = authed.body
      ok = authed.ok
      status = authed.status
      articleOk = ok && body?.slug === slug
      logArticleJsonFetch(dbg, {
        expectedSlug: slug, label: 'authenticated public', path, res: authed,
      })
    }

    if (!articleOk && token) {
      const privatePath = privateArticleShowPath(slug)
      dbg(`retrying GET private API ${privatePath}`)
      const priv = await client.getJson<ArticleJson>(privatePath, undefined, {token})
      body = priv.body
      ok = priv.ok
      status = priv.status
      articleOk = ok && body?.slug === slug
      logArticleJsonFetch(dbg, {
        expectedSlug: slug, label: 'private API', path: privatePath, res: priv,
      })
    }

    if (!articleOk) {
      const msg = await formatArticleNotFoundMessage(client, slug)
      this.error(msg, {exit: 1})
    }

    const article = body
    const metadata = {id: article.id, title: article.title}
    const filePath = mdFilePath(slug)

    if (!flags.force && existsSync(filePath)) {
      const shouldOverwrite = await confirm({message: `The file ${filePath} already exists - overwrite?`})
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

function logArticleJsonFetch(
  dbg: (m: string) => void,
  opts: {
    expectedSlug: string
    label: string
    path: string
    res: {body: ArticleJson; ok: boolean; status: number}
  },
): void {
  const {expectedSlug, label, path, res} = opts
  const {body, ok, status} = res
  const slugPart = body?.slug === undefined ? '(missing)' : JSON.stringify(body.slug)
  const titlePart
    = body?.title === undefined ? '(missing)' : JSON.stringify(String(body.title).slice(0, 80))
  dbg(`GET ${path} (${label}): status=${status} ok=${ok} body.slug=${slugPart} title=${titlePart}`)
  dbg(`slugMatch=${String(body?.slug === expectedSlug)} (want ${JSON.stringify(expectedSlug)})`)
  if (body && typeof body === 'object') {
    dbg(`response keys: ${Object.keys(body as object).sort().join(', ')}`)
    dbg('response body (full JSON):')
    try {
      for (const line of JSON.stringify(body, undefined, 2).split('\n')) {
        dbg(`  ${line}`)
      }
    } catch {
      dbg(`  (could not stringify body: ${String(body)})`)
    }
  }
}
