// FIXME: if isWindows is used, it breaks cli.spec.ts because Logger is undefined
// import { isWindows } from '../'
// export const newLine = () => (isWindows() ? '\\r\\n' : '\\n')

export const newLine = () => (process.platform === 'win32' ? '\\r\\n' : '\\n')
