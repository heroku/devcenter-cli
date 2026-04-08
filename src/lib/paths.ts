import {resolve} from 'node:path'

export function getDevcenterBaseUrl(): string {
  return process.env.DEVCENTER_BASE_URL ?? 'https://devcenter.heroku.com'
}

export function articlePath(slug: string): string {
  return `/articles/${slug}`
}

export function articleApiPath(slug: string): string {
  return `${articlePath(slug)}.json`
}

export function searchApiPath(): string {
  return '/api/v1/search.json'
}

export function validateArticlePath(id: number | string): string {
  return `/api/v1/private/articles/${id}/validate.json`
}

export function updateArticlePath(id: number | string): string {
  return `/api/v1/private/articles/${id}.json`
}

export function brokenLinkChecksPath(): string {
  return '/api/v1/private/broken-link-checks.json'
}

export function articleUrlMatches(url: string, baseUrl: string): boolean {
  const escaped = baseUrl.replaceAll('/', String.raw`\/`)
  return new RegExp(`^${escaped}/articles/.+`).test(url)
}

export function slugFromArticleUrl(url: string): string {
  if (!url) return url
  const parts = url.split('/articles/')
  const tail = parts.at(-1) ?? url
  return tail.split('?')[0]!.split('#')[0]!
}

export function mdFilePath(slug: string): string {
  return resolve(process.cwd(), `${slug}.md`)
}
