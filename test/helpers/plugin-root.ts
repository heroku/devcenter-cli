import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

/** Repository root for oclif `Config.load({ root })` in tests. */
export const PLUGIN_ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..')
