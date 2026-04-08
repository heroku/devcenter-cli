declare module 'netrc' {
  type NetrcEntry = {login: string; password: string}
  type NetrcMap = Record<string, NetrcEntry | undefined>
  function netrc(file?: string): NetrcMap
  export = netrc
}
