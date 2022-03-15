import { isWindows } from '../'

export const newLine = () => (isWindows() ? '\\r\\n' : '\\n')
