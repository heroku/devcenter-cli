import netrc from 'netrc'
import {existsSync} from 'node:fs'
import {homedir} from 'node:os'
import {join} from 'node:path'

/**
 * Returns the Heroku API token from ~/.netrc (same source as the legacy Ruby CLI).
 * Encrypted ~/.netrc.gpg is not supported; use a plain netrc or `heroku login`.
 */
export function getHerokuNetrcToken(): string {
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
