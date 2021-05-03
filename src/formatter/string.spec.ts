import { sanitizeSpecialChars } from '.'
import chalk from 'chalk'

describe('sanitizeSpecialChars', () => {
  it('should sanitize special chars inserted by chalk', () => {
    const str = 'Hello, World!'
    const modifiedStr = chalk.white.bold(str)

    expect(sanitizeSpecialChars(modifiedStr)).toEqual(str)
  })
})
