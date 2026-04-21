import {expect} from 'chai'

import {
  basicAuthHeaders,
  basicAuthHeaderValue,
} from '../../src/lib/heroku-api-auth.js'

describe('heroku-api-auth', function () {
  it('basicAuthHeaderValue matches legacy encoding', function () {
    expect(basicAuthHeaderValue('tok')).to.equal(`Basic ${Buffer.from('tok').toString('base64')}`)
  })

  it('basicAuthHeaders sets Authorization', function () {
    expect(basicAuthHeaders('x')).to.deep.equal({
      Authorization: basicAuthHeaderValue('x'),
    })
  })
})
