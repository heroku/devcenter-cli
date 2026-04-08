import {expect} from 'chai'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {getHerokuNetrcToken} from '../../src/lib/netrc-token.js'
import {
  applyHomeEnv, type HomeEnvSnapshot, setHomeDirForTests, snapshotHomeEnv,
} from '../helpers/test-home-env.js'

describe('getHerokuNetrcToken', function () {
  let homeEnv: HomeEnvSnapshot
  let fakeHome: string

  beforeEach(function () {
    homeEnv = snapshotHomeEnv()
    fakeHome = mkdtempSync(join(tmpdir(), 'netrc-test-'))
    setHomeDirForTests(fakeHome)
  })

  afterEach(function () {
    applyHomeEnv(homeEnv)
    rmSync(fakeHome, {recursive: true})
  })

  it('returns the password for api.heroku.com', function () {
    writeFileSync(
      join(fakeHome, '.netrc'),
      `machine api.heroku.com
login x@y.com
password my-secret-token
`,
      'utf8',
    )
    expect(getHerokuNetrcToken()).to.equal('my-secret-token')
  })

  it('throws when .netrc is missing', function () {
    expect(() => getHerokuNetrcToken()).to.throw(/credentials not found/)
  })

  it('throws when machine exists but password is missing', function () {
    writeFileSync(join(fakeHome, '.netrc'), 'machine api.heroku.com\nlogin only\n', 'utf8')
    expect(() => getHerokuNetrcToken()).to.throw(/credentials not found/)
  })

  it('throws when .netrc.gpg exists', function () {
    writeFileSync(join(fakeHome, '.netrc.gpg'), 'binary', 'utf8')
    expect(() => getHerokuNetrcToken()).to.throw(/not supported/)
  })
})
