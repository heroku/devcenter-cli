import {Netrc} from 'netrc-parser'

/**
 * Heroku API token for `api.heroku.com` from netrc, same resolution as the Heroku CLI
 * (`netrc-parser`: plain `~/.netrc` or `~/.netrc.gpg` when present, decrypted via `gpg`).
 */
export function getHerokuApiToken(): string {
  const netrc = new Netrc()
  try {
    netrc.loadSync()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Heroku credentials could not be loaded: ${message}`)
  }

  const token = netrc.machines['api.heroku.com']?.password
  if (!token) {
    throw new Error('Heroku credentials not found. Run `heroku login`.')
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
