import {describe, expect, it} from 'vitest'

import {
  basicAuthHeaders,
  basicAuthHeaderValue,
} from '../../src/lib/heroku-api-auth.js'

describe('heroku-api-auth', () => {
  it('basicAuthHeaderValue matches legacy encoding', () => {
    expect(basicAuthHeaderValue('tok')).toBe(`Basic ${Buffer.from('tok').toString('base64')}`)
  })

  it('basicAuthHeaders sets Authorization', () => {
    expect(basicAuthHeaders('x')).toEqual({
      Authorization: basicAuthHeaderValue('x'),
    })
  })
})
