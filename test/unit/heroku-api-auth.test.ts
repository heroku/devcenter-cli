import {expect} from 'chai'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {
  basicAuthHeaders,
  basicAuthHeaderValue,
  getHerokuApiToken,
} from '../../src/lib/heroku-api-auth.js'
import {
  applyHomeEnv, type HomeEnvSnapshot, setHomeDirForTests, snapshotHomeEnv,
} from '../helpers/test-home-env.js'

describe('heroku-api-auth', function () {
  let homeEnv: HomeEnvSnapshot
  let fakeHome: string

  beforeEach(function () {
    homeEnv = snapshotHomeEnv()
    fakeHome = mkdtempSync(join(tmpdir(), 'heroku-auth-test-'))
    setHomeDirForTests(fakeHome)
  })

  afterEach(function () {
    applyHomeEnv(homeEnv)
    rmSync(fakeHome, {force: true, recursive: true})
  })

  it('getHerokuApiToken returns the password for api.heroku.com', function () {
    writeFileSync(
      join(fakeHome, '.netrc'),
      `machine api.heroku.com
  login x@y.com
  password my-secret-token
`,
      'utf8',
    )
    expect(getHerokuApiToken()).to.equal('my-secret-token')
  })

  it('getHerokuApiToken throws when .netrc is missing', function () {
    expect(() => getHerokuApiToken()).to.throw(/credentials not found|could not be loaded/i)
  })

  it('getHerokuApiToken throws when machine exists but password is missing', function () {
    writeFileSync(join(fakeHome, '.netrc'), 'machine api.heroku.com\n  login only\n', 'utf8')
    expect(() => getHerokuApiToken()).to.throw(/credentials not found/i)
  })

  it('getHerokuApiToken throws when api.heroku.com is missing', function () {
    writeFileSync(
      join(fakeHome, '.netrc'),
      'machine other.example\n  login x\n  password y\n',
      'utf8',
    )
    expect(() => getHerokuApiToken()).to.throw(/Heroku credentials not found/)
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
