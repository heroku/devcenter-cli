import type {DevcenterClient} from './devcenter-client.js'

import {articleUrlMatches, getDevcenterBaseUrl, searchApiPath} from './paths.js'

type SearchResult = {full_url: string; slug: string; title: string}

export async function formatArticleNotFoundMessage(
  client: DevcenterClient,
  slug: string,
): Promise<string> {
  const baseUrl = getDevcenterBaseUrl()
  const {body} = await client.getJson<{results: SearchResult[]}>(searchApiPath(), {query: slug})
  const results = (body?.results ?? []).filter(r => articleUrlMatches(r.full_url, baseUrl))
  const lines = [`No ${slug} article found.`]
  if (results.length > 0) {
    lines.push('Perhaps you meant one of these:')
    const longest = Math.max(...results.map(r => r.slug.length))
    for (const s of results) {
      lines.push(`${s.slug.padEnd(longest)} # ${s.title}`)
    }
  }

  return lines.join('\n')
}
