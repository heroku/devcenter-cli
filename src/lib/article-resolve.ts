import type {DevcenterClient} from './devcenter-client.js'

import {articleApiPath, privateArticleShowPath} from './paths.js'

export type ArticleJson = {
  content: string
  id: number | string
  slug: string
  title: string
}

/**
 * Resolves article JSON using the same sequence as legacy Dev Center tooling: public JSON,
 * then authenticated public JSON, then private API — matching `devcenter:pull`.
 */
export async function fetchArticleJsonForSlug(
  client: DevcenterClient,
  slug: string,
  token: string | undefined,
  dbg?: (msg: string) => void,
): Promise<ArticleJson | null> {
  const path = articleApiPath(slug)

  let {body, ok, status} = await client.getJson<ArticleJson>(path)
  let articleOk = ok && body?.slug === slug
  logArticleJsonFetch(dbg, {
    expectedSlug: slug, label: 'no auth', path, res: {body, ok, status},
  })

  if (!token) {
    dbg?.('Heroku credentials not available; skipping authenticated Dev Center requests')
  }

  if (!articleOk && token) {
    dbg?.('retrying GET with Heroku CLI credentials (public JSON)')
    const authed = await client.getJson<ArticleJson>(path, undefined, {token})
    body = authed.body
    ok = authed.ok
    status = authed.status
    articleOk = ok && body?.slug === slug
    logArticleJsonFetch(dbg, {
      expectedSlug: slug, label: 'authenticated public', path, res: authed,
    })

    if (!articleOk) {
      const privatePath = privateArticleShowPath(slug)
      dbg?.(`retrying GET private API ${privatePath}`)
      const priv = await client.getJson<ArticleJson>(privatePath, undefined, {token})
      body = priv.body
      ok = priv.ok
      status = priv.status
      articleOk = ok && body?.slug === slug
      logArticleJsonFetch(dbg, {
        expectedSlug: slug, label: 'private API', path: privatePath, res: priv,
      })
    }
  }

  if (!articleOk) {
    return null
  }

  return body as ArticleJson
}

export function logArticleJsonFetch(
  dbg: ((msg: string) => void) | undefined,
  opts: {
    expectedSlug: string
    label: string
    path: string
    res: {body: ArticleJson; ok: boolean; status: number}
  },
): void {
  if (!dbg) return
  const {expectedSlug, label, path, res} = opts
  const {body, ok, status} = res
  const slugPart = body?.slug === undefined ? '(missing)' : JSON.stringify(body.slug)
  const titlePart
    = body?.title === undefined ? '(missing)' : JSON.stringify(String(body.title).slice(0, 80))
  dbg(`GET ${path} (${label}): status=${status} ok=${ok} body.slug=${slugPart} title=${titlePart}`)
  dbg(`slugMatch=${String(body?.slug === expectedSlug)} (want ${JSON.stringify(expectedSlug)})`)
  if (body && typeof body === 'object') {
    dbg(`response keys: ${Object.keys(body as object).sort().join(', ')}`)
    if ('content' in body) {
      const c = (body as ArticleJson).content
      dbg(`content: ${typeof c === 'string' ? `${c.length} chars` : String(c)}`)
    }
  }
}
