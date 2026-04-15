import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import debug from 'debug'
import nock from 'nock'
import childProcess from 'node:child_process'
import sinon from 'sinon'

import Open from '../../../src/commands/devcenter/open.js'
import {stubOpen} from '../../helpers/stub-open.js'

describe('devcenter:open', function () {
  beforeEach(function () {
    stubOpen()
  })

  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
  })

  it('succeeds when HEAD succeeds and opens browser', async function () {
    nock('https://devcenter.heroku.com', {reqheaders: {'user-agent': 'DevCenterCLI'}})
      .head('/articles/my-article')
      .reply(200)

    const {error} = await runCommand(Open, ['my-article'])
    expect(error).to.equal(undefined)
    expect((childProcess.spawn as sinon.SinonStub).called).to.equal(true)
  })

  it('logs debug lines to stderr when DEBUG enables devcenter:open', async function () {
    const previousDebug = process.env.DEBUG
    process.env.DEBUG = 'devcenter:open'
    debug.enable('devcenter:open')

    nock('https://devcenter.heroku.com', {reqheaders: {'user-agent': 'DevCenterCLI'}})
      .head('/articles/dbg')
      .reply(200)

    const {error, stderr} = await runCommand(Open, ['dbg'])

    if (previousDebug === undefined) {
      debug.disable()
      delete process.env.DEBUG
    } else {
      process.env.DEBUG = previousDebug
      debug.enable(previousDebug)
    }

    expect(error).to.equal(undefined)
    expect(stderr).to.match(/Connecting/)
    expect(stderr).to.match(/Page found/)
  })

  it('fails with redirect message when HEAD returns 302', async function () {
    nock('https://devcenter.heroku.com').head('/articles/old').reply(302, undefined, {
      Location: 'https://devcenter.heroku.com/articles/new',
    })

    const {error} = await runCommand(Open, ['old'])
    expect(error?.message).to.contain('Redirected')
  })

  it('fails with not-found hints when HEAD returns 404', async function () {
    nock('https://devcenter.heroku.com').head('/articles/missing').reply(404)
    nock('https://devcenter.heroku.com')
      .get('/api/v1/search.json')
      .query({query: 'missing'})
      .reply(200, {results: []})

    const {error} = await runCommand(Open, ['missing'])
    expect(error?.message).to.contain('No missing article found')
  })

  it('errors when slug is empty', async function () {
    const {error} = await runCommand(Open, ['  '])
    expect(error?.message).to.contain('Please provide a slug')
  })

  it('fails on unexpected HEAD status', async function () {
    nock('https://devcenter.heroku.com').head('/articles/boom').reply(500)
    const {error} = await runCommand(Open, ['boom'])
    expect(error?.message).to.contain('Unexpected response')
  })
})
