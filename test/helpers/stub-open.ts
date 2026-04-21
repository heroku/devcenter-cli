import type {ChildProcess} from 'node:child_process'

import childProcess from 'node:child_process'
import {type SinonStub, stub} from 'sinon'

/**
 * Stub child_process.spawn to mock `open` package browser launches.
 * The `open` package (v11+) uses subprocess.once('spawn') and subprocess.once('error').
 */
export function stubOpen(): SinonStub {
  return stub(childProcess, 'spawn').returns({
    off() {},
    on(event: string, cb: CallableFunction) {
      if (event === 'exit') cb()
    },
    once(event: string, cb: CallableFunction) {
      if (event === 'spawn') setImmediate(() => cb())
    },
    unref() {},
  } as unknown as ChildProcess)
}
