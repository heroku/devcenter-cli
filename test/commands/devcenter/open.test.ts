import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

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

    const {error} = await runCommand(['devcenter:open', 'my-article'], {root})
    expect(error).to.equal(undefined)
  })
})
