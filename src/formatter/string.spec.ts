import { sanitizeSpecialChars, capitalizeFirstChar } from '.'
import chalk from 'chalk'

describe('sanitizeSpecialChars', () => {
  it('should sanitize special chars inserted by chalk', () => {
    const str = 'Hello, World!'
    const modifiedStr = chalk.white.bold(str)

    expect(sanitizeSpecialChars(modifiedStr)).toEqual(str)
  })
})

describe('capitalizeFirstChar', () => {
  it('should capitalize first char', () => {
    const str = 'hello, World!'
    const expectedStr = 'Hello, World!'

    expect(capitalizeFirstChar(str)).toEqual(expectedStr)
  })

  it('should return empty string if empty string supplied', () => {
    const str = ''
    const expectedStr = ''

    expect(capitalizeFirstChar(str)).toEqual(expectedStr)
  })

  it('should return empty unchanged string if first char is already capitalized', () => {
    const str = 'Hello, World!'
    const expectedStr = 'Hello, World!'

    expect(capitalizeFirstChar(str)).toEqual(expectedStr)
  })
})
