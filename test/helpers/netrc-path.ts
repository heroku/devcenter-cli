import {join} from 'node:path'

/** Basename `netrc-parser` uses for `Netrc.defaultFile` (Windows `_netrc`, POSIX `.netrc`). */
export function netrcFilePath(home: string): string {
  return join(home, process.platform === 'win32' ? '_netrc' : '.netrc')
}
