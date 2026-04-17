/**
 * `os.homedir()` uses `HOME` on POSIX and `USERPROFILE` on Windows.
 * Tests that fake a home directory must set both so behavior is consistent in CI.
 */
export type HomeEnvSnapshot = {
  HOME: string | undefined
  USERPROFILE: string | undefined
}

export function snapshotHomeEnv(): HomeEnvSnapshot {
  return {
    HOME: process.env.HOME,
    USERPROFILE: process.env.USERPROFILE,
  }
}

export function applyHomeEnv(snapshot: HomeEnvSnapshot): void {
  if (snapshot.HOME === undefined) {
    delete process.env.HOME
  } else {
    process.env.HOME = snapshot.HOME
  }

  if (snapshot.USERPROFILE === undefined) {
    delete process.env.USERPROFILE
  } else {
    process.env.USERPROFILE = snapshot.USERPROFILE
  }
}

export function setHomeDirForTests(dir: string): void {
  process.env.HOME = dir
  process.env.USERPROFILE = dir
}
