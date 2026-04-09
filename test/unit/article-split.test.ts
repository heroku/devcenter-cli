import {expect} from 'chai'

import {splitMetadataBody} from '../../src/lib/article-split.js'

describe('splitMetadataBody', function () {
  it('splits YAML front matter from markdown body', function () {
    const {body, yamlText} = splitMetadataBody(`title: A
id: 1

Hello
`)
    expect(yamlText).to.contain('title: A')
    expect(body.trim()).to.equal('Hello')
  })

  it('throws when there is no blank line separator', function () {
    expect(() => splitMetadataBody('only: yaml\nno body separator')).to.throw(/Invalid article file/)
  })
})
