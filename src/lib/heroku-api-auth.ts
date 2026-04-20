/**
 * Dev Center private endpoints expect HTTP Basic auth: base64(raw API token), not Bearer.
 * The token itself is resolved by `@heroku-cli/command` (`APIClient.getAuth()` / credential manager).
 */
export function basicAuthHeaderValue(token: string): string {
  const encoded = Buffer.from(token).toString('base64')
  return `Basic ${encoded}`
}

export function basicAuthHeaders(token: string): Record<string, string> {
  return {Authorization: basicAuthHeaderValue(token)}
}
