import {describe, expect, it} from 'vitest'

import {splitMetadataBody} from '../../src/lib/article-split.js'

describe('splitMetadataBody', () => {
  it('splits YAML front matter from markdown body', () => {
    const {body, yamlText} = splitMetadataBody(`title: A
id: 1

Hello
`)
    expect(yamlText).toContain('title: A')
    expect(body.trim()).toBe('Hello')
  })

  it('throws when there is no blank line separator', () => {
    expect(() => splitMetadataBody('only: yaml\nno body separator')).toThrow(/Invalid article file/)
  })
})
