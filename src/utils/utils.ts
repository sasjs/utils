import path from 'path'

export async function asyncForEach(
  array: any[],
  callback: (item: any, index: number, originalArray: any[]) => any
) {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

export const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8

    return v.toString(16)
  })

export const uniqArray = (data: any[]) => Array.from(new Set(data))

/**
 * Whether the host is Windows. process may not exist - these helpers are
 * exported from the package root and called from browser code - so the
 * platform is read defensively and a browser answers false.
 */
export const isWindows = () =>
  typeof process !== 'undefined' && process.platform === 'win32'

export const isLinux = () =>
  typeof process !== 'undefined' && process.platform === 'linux'

/**
 * replace single backslash with double backslash
 */
export const escapeWinSlashes = (path: string) =>
  isWindows() ? path.replace(/\\/g, '\\\\') : path

export const getMacrosPath = () => path.join(__dirname, '..', 'macros')

/**
 * sas code requires forward slashes as path separator in file or folder paths.
 * So, this method replaces OS specific path separator with forward slash
 */
export const generatePathForSas = (resourcePath: string) =>
  resourcePath.replace(/\\/g, '/')
