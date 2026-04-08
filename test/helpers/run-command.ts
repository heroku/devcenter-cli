import type {BufferEncoding} from 'node:buffer'

import {Config, type Interfaces} from '@oclif/core'
import ansis from 'ansis'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const defaultRoot = join(dirname(fileURLToPath(import.meta.url)), '../..')

let cachedConfig: Config | undefined

export async function getConfig(loadOpts?: Interfaces.LoadOptions): Promise<Config> {
  if (loadOpts) {
    return Config.load(loadOpts)
  }

  if (!cachedConfig) {
    cachedConfig = await Config.load({root: defaultRoot})
  }

  return cachedConfig
}

interface CommandInstance {
  run(): Promise<unknown>
}

type GenericCmd
  = | {new (argv: string[], config: Interfaces.Config): CommandInstance} | {prototype: CommandInstance}

type CaptureOptions = {
  print?: boolean
  stripAnsi?: boolean
}

type CaptureResult<T> = {
  error?: Error
  result?: T
  stderr: string
  stdout: string
}

function withCapturedOutput<T>(
  fn: () => Promise<T>,
  options: {print?: boolean; stripAnsi?: boolean} = {},
): Promise<{error?: Error; result?: T; stderr: string; stdout: string}> {
  const {print = false, stripAnsi: shouldStripAnsi = true} = options
  const originals = {
    stderr: process.stderr.write,
    stdout: process.stdout.write,
  }
  const output = {stderr: [] as Array<string | Uint8Array>, stdout: [] as Array<string | Uint8Array>}
  const toString = (str: string | Uint8Array) => (shouldStripAnsi ? ansis.strip(str.toString()) : str.toString())
  const getStdout = () => output.stdout.map(b => toString(b)).join('')
  const getStderr = () => output.stderr.map(b => toString(b)).join('')
  const mock
    = (std: 'stderr' | 'stdout') =>
      (str: string | Uint8Array, encoding?: ((err?: Error | null) => void) | BufferEncoding, cb?: (err?: Error | null) => void) => {
        output[std].push(str)
        if (print) {
          originals[std].call(process[std], str, encoding as BufferEncoding, cb)
        }

        if (typeof encoding === 'function') {
          encoding()
        } else if (cb) {
          cb()
        }

        return true
      }

  process.stdout.write = mock('stdout') as typeof process.stdout.write
  process.stderr.write = mock('stderr') as typeof process.stderr.write

  return fn()
  .then(result => ({
    error: undefined,
    result,
    stderr: getStderr(),
    stdout: getStdout(),
  }))
  .catch(error => {
    const err
      = error instanceof Error ? Object.assign(error, {message: toString(error.message)}) : error
    return {
      error: err as Error,
      result: undefined as T,
      stderr: getStderr(),
      stdout: getStdout(),
    }
  })
  .finally(() => {
    process.stdout.write = originals.stdout
    process.stderr.write = originals.stderr
  })
}

/**
 * Run an oclif command class from `src/` (via tsx) so c8 attributes coverage to TypeScript sources.
 */
export async function runCommand<T = unknown>(
  CommandClass: GenericCmd,
  args: string | string[] = [],
  loadOpts?: Interfaces.LoadOptions,
  captureOpts?: CaptureOptions,
): Promise<CaptureResult<T>> {
  const argsArray = typeof args === 'string' ? args.split(/ +/) : args
  const conf = await getConfig(loadOpts)
  const Ctor = CommandClass as {new (argv: string[], config: Interfaces.Config): CommandInstance}
  const instance = new Ctor(argsArray, conf)
  const {error, result, stderr, stdout} = await withCapturedOutput(() => instance.run() as Promise<T>, captureOpts)
  if (error) {
    return {error, stderr, stdout}
  }

  return {result, stderr, stdout}
}
