import {expect} from 'chai'

import {name} from '../../src/index.js'

describe('package entry', function () {
  it('exports the npm package name', function () {
    expect(name).to.equal('@heroku-cli/heroku-cli-plugin-devcenter')
  })
})
