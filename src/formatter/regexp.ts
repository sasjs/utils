// Kept self-contained rather than importing isWindows from '../': that module
// imports path and is loaded from the package root, which pulls Logger into
// this module and breaks cli.spec.ts with an undefined Logger.

/**
 * The line ending to join formatted rows with.
 *
 * process may not exist - the formatter runs in browsers, to build request
 * bodies - so the platform is read defensively and a browser gets the unix
 * ending.
 */
export const newLine = () =>
  typeof process !== 'undefined' && process.platform === 'win32'
    ? '\\r\\n'
    : '\\n'
