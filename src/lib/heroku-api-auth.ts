import {getAuth} from '@heroku-cli/command'

const API_HOST = 'api.heroku.com'

/**
 * Retrieves Heroku API token via the credential manager.
 * Precedence: HEROKU_API_KEY env var → native keychain → netrc fallback.
 */
export async function getHerokuApiToken(): Promise<string> {
  if (process.env.HEROKU_API_KEY) {
    return process.env.HEROKU_API_KEY
  }

  const {token} = await getAuth(undefined, API_HOST)
  if (!token) {
    throw new Error('No credentials found. Please log in.')
  }

  return token
}

/** `Authorization` header value Dev Center private APIs expect (matches legacy CLI behavior). */
export function basicAuthHeaderValue(token: string): string {
  const encoded = Buffer.from(token).toString('base64')
  return `Basic ${encoded}`
}

export function basicAuthHeaders(token: string): Record<string, string> {
  return {Authorization: basicAuthHeaderValue(token)}
}
