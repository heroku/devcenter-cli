import childProcess from 'node:child_process'
import sinon from 'sinon'

/**
 * Stub child_process.spawn to mock `open` package browser launches.
 * The `open` package (v11+) uses subprocess.once('spawn') and subprocess.once('error').
 */
export function stubOpen(): sinon.SinonStub {
  return sinon.stub(childProcess, 'spawn').returns({
    off() {},
    on(event: string, cb: CallableFunction) {
      if (event === 'exit') cb()
    },
    once(event: string, cb: CallableFunction) {
      if (event === 'spawn') setImmediate(() => cb())
    },
    unref() {},
  } as any)
}
