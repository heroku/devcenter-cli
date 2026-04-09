import netrc from 'netrc'
import {existsSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'

/**
 * Heroku API token from `~/.netrc` (`api.heroku.com`), same source as `heroku login`.
 * Encrypted `~/.netrc.gpg` is not supported.
 */
export function getHerokuApiToken(): string {
  const home = homedir()
  const gpgPath = join(home, '.netrc.gpg')
  const plainPath = join(home, '.netrc')
  if (existsSync(gpgPath)) {
    throw new Error('Encrypted ~/.netrc.gpg is not supported by this plugin. Use a plain ~/.netrc (e.g. after `heroku login`) or decrypt netrc separately.')
  }

  if (!existsSync(plainPath)) {
    throw new Error('Heroku credentials not found. Run `heroku login` to create ~/.netrc.')
  }

  const auth = netrc(plainPath)
  const entry = auth['api.heroku.com']
  const token = entry?.password
  if (!token) {
    throw new Error('Heroku credentials not found. Run `heroku login` to create ~/.netrc.')
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
