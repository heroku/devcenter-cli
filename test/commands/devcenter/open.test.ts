import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '../../..')

describe('devcenter:open', function () {
  it('warns that the command is not yet implemented', async function () {
    const {error, stderr} = await runCommand(['devcenter:open', 'my-article'], {root})
    expect(error).to.equal(undefined)
    expect(stderr).to.contain('not yet implemented')
    expect(stderr).to.contain('my-article')
  })
})
