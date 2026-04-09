import {expect} from 'chai'
import nock from 'nock'

import Open from '../../../src/commands/devcenter/open.js'
import {runCommand} from '../../helpers/run-command.js'

describe('devcenter:open', function () {
  let previousTest: string | undefined

  beforeEach(function () {
    previousTest = process.env.DEVCENTER_CLI_TEST
    process.env.DEVCENTER_CLI_TEST = '1'
  })

  afterEach(function () {
    nock.cleanAll()
    if (previousTest === undefined) {
      delete process.env.DEVCENTER_CLI_TEST
    } else {
      process.env.DEVCENTER_CLI_TEST = previousTest
    }
  })

  it('succeeds when HEAD succeeds (browser open skipped in tests)', async function () {
    nock('https://devcenter.heroku.com', {reqheaders: {'user-agent': 'DevCenterCLI'}})
    .head('/articles/my-article')
    .reply(200)

    const {error} = await runCommand(Open, ['my-article'])
    expect(error).to.equal(undefined)
  })

  it('prints debug lines when --debug is set', async function () {
    nock('https://devcenter.heroku.com', {reqheaders: {'user-agent': 'DevCenterCLI'}})
    .head('/articles/dbg')
    .reply(200)

    const {error, stdout} = await runCommand(Open, ['dbg', '--debug'])
    expect(error).to.equal(undefined)
    expect(stdout).to.contain('devcenter:')
    expect(stdout).to.contain('Connecting')
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
