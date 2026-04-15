import {expect} from 'chai'
import esmock from 'esmock'

import {
  basicAuthHeaders,
  basicAuthHeaderValue,
} from '../../src/lib/heroku-api-auth.js'

describe('heroku-api-auth', function () {
  let originalApiKey: string | undefined

  beforeEach(function () {
    originalApiKey = process.env.HEROKU_API_KEY
  })

  afterEach(function () {
    if (originalApiKey === undefined) {
      delete process.env.HEROKU_API_KEY
    } else {
      process.env.HEROKU_API_KEY = originalApiKey
    }
  })

  describe('getHerokuApiToken', function () {
    it('returns HEROKU_API_KEY when set', async function () {
      const {getHerokuApiToken} = await esmock('../../src/lib/heroku-api-auth.js', {
        '@heroku-cli/command': {
          getAuth: async () => ({account: 'test@example.com', token: 'should-not-be-used'}),
        },
      })

      process.env.HEROKU_API_KEY = 'env-token'
      const token = await getHerokuApiToken()
      expect(token).to.equal('env-token')
    })

    it('retrieves token from credential manager when HEROKU_API_KEY is not set', async function () {
      const {getHerokuApiToken} = await esmock('../../src/lib/heroku-api-auth.js', {
        '@heroku-cli/command': {
          getAuth: async () => ({account: 'user@example.com', token: 'cred-mgr-token'}),
        },
      })

      delete process.env.HEROKU_API_KEY
      const token = await getHerokuApiToken()
      expect(token).to.equal('cred-mgr-token')
    })

    it('throws when credential manager returns no token', async function () {
      const {getHerokuApiToken} = await esmock('../../src/lib/heroku-api-auth.js', {
        '@heroku-cli/command': {
          getAuth: async () => ({account: 'user@example.com', token: undefined}),
        },
      })

      delete process.env.HEROKU_API_KEY
      try {
        await getHerokuApiToken()
        expect.fail('Expected error to be thrown')
      } catch (error) {
        expect((error as Error).message).to.equal('No credentials found. Please log in.')
      }
    })

    it('lets credential manager errors bubble up', async function () {
      const {getHerokuApiToken} = await esmock('../../src/lib/heroku-api-auth.js', {
        '@heroku-cli/command': {
          async getAuth() {
            throw new Error('No credentials found. Please log in.')
          },
        },
      })

      delete process.env.HEROKU_API_KEY
      try {
        await getHerokuApiToken()
        expect.fail('Expected error to be thrown')
      } catch (error) {
        expect((error as Error).message).to.equal('No credentials found. Please log in.')
      }
    })
  })

  it('basicAuthHeaderValue matches legacy encoding', function () {
    expect(basicAuthHeaderValue('tok')).to.equal(`Basic ${Buffer.from('tok').toString('base64')}`)
  })

  it('basicAuthHeaders sets Authorization', function () {
    expect(basicAuthHeaders('x')).to.deep.equal({
      Authorization: basicAuthHeaderValue('x'),
    })
  })
})
