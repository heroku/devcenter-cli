import {expect} from 'chai'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {basicAuthHeaderValue, getHerokuApiToken} from '../../src/lib/heroku-api-auth.js'

describe('heroku-api-auth', function () {
  let fakeHome: string
  let previousHome: string | undefined

  beforeEach(function () {
    fakeHome = mkdtempSync(join(tmpdir(), 'devcenter-netrc-'))
    previousHome = process.env.HOME
    process.env.HOME = fakeHome
  })

  afterEach(function () {
    if (previousHome === undefined) {
      delete process.env.HOME
    } else {
      process.env.HOME = previousHome
    }

    rmSync(fakeHome, {force: true, recursive: true})
  })

  describe('getHerokuApiToken', function () {
    it('reads api.heroku.com password from plain ~/.netrc', function () {
      writeFileSync(
        join(fakeHome, '.netrc'),
        'machine api.heroku.com\n  login mail@example.com\n  password THE_TOKEN\n',
        'utf8',
      )
      expect(getHerokuApiToken()).to.equal('THE_TOKEN')
    })

    it('throws when api.heroku.com is missing', function () {
      writeFileSync(
        join(fakeHome, '.netrc'),
        'machine other.example\n  login x\n  password y\n',
        'utf8',
      )
      expect(() => getHerokuApiToken()).to.throw(/Heroku credentials not found/)
    })
  })

  describe('basicAuthHeaderValue', function () {
    it('encodes token as Basic with empty user', function () {
      expect(basicAuthHeaderValue('abc')).to.equal(`Basic ${Buffer.from('abc').toString('base64')}`)
    })
  })
})
