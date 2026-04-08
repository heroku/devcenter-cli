import {expect} from 'chai'
import {mkdtempSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

import {getHerokuNetrcToken} from '../../src/lib/netrc-token.js'

describe('getHerokuNetrcToken', function () {
  let previousHome: string | undefined
  let fakeHome: string

  beforeEach(function () {
    previousHome = process.env.HOME
    fakeHome = mkdtempSync(join(tmpdir(), 'netrc-test-'))
    process.env.HOME = fakeHome
  })

  afterEach(function () {
    if (previousHome === undefined) {
      delete process.env.HOME
    } else {
      process.env.HOME = previousHome
    }

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
