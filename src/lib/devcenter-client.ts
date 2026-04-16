import * as http from 'node:http'
import * as https from 'node:https'
import {URL} from 'node:url'

import {basicAuthHeaders} from './heroku-api-auth.js'
import {
  brokenLinkChecksPath,
  getDevcenterBaseUrl,
  updateArticlePath,
  validateArticlePath,
} from './paths.js'

const DEFAULT_HEADERS = {'User-agent': 'DevCenterCLI'}

type RawResponse = {
  body: string
  headers: http.IncomingHttpHeaders
  statusCode: number
}

function nodeRequest(
  method: string,
  urlString: string,
  options: {body?: string | undefined; headers?: Record<string, string>;} = {},
): Promise<RawResponse> {
  return new Promise((resolve, reject) => {
    const u = new URL(urlString)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.request(
      {
        headers: options.headers,
        hostname: u.hostname,
        method,
        path: `${u.pathname}${u.search}`,
        port: u.port || (u.protocol === 'https:' ? 443 : 80),
      },
      res => {
        const chunks: Buffer[] = []
        res.on('data', c => {
          chunks.push(c)
        })
        res.on('end', () => {
          resolve({
            body: Buffer.concat(chunks).toString('utf8'),
            headers: res.headers,
            statusCode: res.statusCode ?? 0,
          })
        })
      },
    )
    req.on('error', reject)
    if (options.body) {
      req.write(options.body)
    }

    req.end()
  })
}

export class DevcenterClient {
  constructor(private readonly baseUrl: string = getDevcenterBaseUrl()) {}

  async authForm(
    method: 'POST' | 'PUT',
    path: string,
    token: string,
    params: Record<string, string>,
  ): Promise<{body: unknown; ok: boolean; status: number;}> {
    const body = new URLSearchParams(params).toString()
    const res = await nodeRequest(method, this.url(path), {
      body,
      headers: {
        ...DEFAULT_HEADERS,
        ...basicAuthHeaders(token),
        'Content-Length': String(Buffer.byteLength(body)),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })
    let json: unknown = {}
    if (res.body) {
      try {
        json = JSON.parse(res.body)
      } catch {
        json = res.body
      }
    }

    return {body: json, ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode}
  }

  async checkBrokenLinks(token: string, content: string) {
    return this.authForm('POST', brokenLinkChecksPath(), token, {content})
  }

  async getJson<T>(
    path: string,
    query?: Record<string, string>,
    options?: {token?: string},
  ): Promise<{body: T; ok: boolean; status: number;}> {
    const u = new URL(this.url(path))
    if (query) {
      for (const [k, v] of Object.entries(query)) {
        u.searchParams.set(k, v)
      }
    }

    const headers: Record<string, string> = {...DEFAULT_HEADERS}
    if (options?.token) {
      Object.assign(headers, basicAuthHeaders(options.token))
    }

    const res = await nodeRequest('GET', u.toString(), {headers})
    let parsed: T
    try {
      parsed = JSON.parse(res.body || '{}') as T
    } catch {
      parsed = {} as T
    }

    return {body: parsed, ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode}
  }

  async head(path: string): Promise<{location?: string; notFound: boolean; ok: boolean; redirect: boolean;}> {
    const res = await nodeRequest('HEAD', this.url(path), {headers: {...DEFAULT_HEADERS}})
    const status = res.statusCode
    const {location} = res.headers
    const loc = Array.isArray(location) ? location[0] : location
    return {
      location: loc,
      notFound: status === 404,
      ok: [200, 201].includes(status),
      redirect: [301, 302].includes(status),
    }
  }

  async updateArticle(token: string, articleId: number | string, params: Record<string, string>) {
    return this.authForm('PUT', updateArticlePath(articleId), token, params)
  }

  async validateArticle(token: string, articleId: number | string, params: Record<string, string>) {
    return this.authForm('POST', validateArticlePath(articleId), token, params)
  }

  private url(path: string): string {
    const base = this.baseUrl.replace(/\/$/, '')
    const p = path.startsWith('/') ? path : `/${path}`
    return `${base}${p}`
  }
}
