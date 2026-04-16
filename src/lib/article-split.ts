/**
 * Split Dev Center article file into YAML front matter and markdown body
 * (same rule as the Ruby gem: first blank line separates YAML from content).
 */
export function splitMetadataBody(src: string): {body: string; yamlText: string;} {
  const re = /\r*\n\r*\n/
  const match = re.exec(src)
  if (!match || match.index === undefined) {
    throw new Error('Invalid article file: expected YAML front matter, a blank line, then markdown content.')
  }

  const yamlText = src.slice(0, match.index).trimEnd()
  const body = src.slice(match.index + match[0].length)
  return {body, yamlText}
}
