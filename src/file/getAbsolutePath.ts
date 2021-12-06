import path from 'path'
import os from 'os'

export const getAbsolutePath = (providedPath: string, relativePath: string) =>
  path.isAbsolute(providedPath) || /^~/.exec(providedPath)
    ? path.normalize(providedPath.replace(/^~/, os.homedir()))
    : path.join(relativePath, providedPath)
