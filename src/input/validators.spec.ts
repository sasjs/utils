import {
  choiceValidator,
  confirmationValidator,
  urlValidator
} from './validators'

const errorMessage = 'Invalid input.'

describe('urlValidator', () => {
  it('should return true with an HTTP URL', () => {
    const url = 'http://google.com'

    expect(urlValidator(url, errorMessage)).toEqual(true)
  })

  it('should return true with an HTTPS URL', () => {
    const url = 'https://google.com'

    expect(urlValidator(url, errorMessage)).toEqual(true)
  })

  it('should return true when the URL is blank', () => {
    const url = ''

    expect(urlValidator(url, errorMessage)).toEqual(true)
  })

  it('should return an error message when the URL isinvalid', () => {
    const url = 'htpps://google.com'

    expect(urlValidator(url, errorMessage)).toEqual(errorMessage)
  })

  it('should return an error message when the URL is null', () => {
    const url = null

    expect(urlValidator((url as unknown) as string, errorMessage)).toEqual(
      errorMessage
    )
  })

  it('should return an error message when the URL is undefined', () => {
    const url = undefined

    expect(urlValidator((url as unknown) as string, errorMessage)).toEqual(
      errorMessage
    )
  })
})

describe('confirmationValidator', () => {
  it('should return true when the value is true', () => {
    expect(confirmationValidator(true)).toEqual(true)
  })

  it('should return true when the value is false', () => {
    expect(confirmationValidator(false)).toEqual(true)
  })

  it('should return false when the value is null', () => {
    expect(confirmationValidator(null)).toEqual(false)
  })

  it('should return false when the value is undefined', () => {
    expect(confirmationValidator(undefined)).toEqual(false)
  })

  it('should return false when the value is a string', () => {
    expect(confirmationValidator('test')).toEqual(false)
  })

  it('should return false when the value is a number', () => {
    expect(confirmationValidator(123)).toEqual(false)
  })
})

describe('choiceValidator', () => {
  it('should return true when the choice is valid', () => {
    const choice = 1
    const numberOfChoices = 10

    expect(choiceValidator(choice, numberOfChoices, errorMessage)).toEqual(true)
  })

  it('should return the error message when the choice is less than 1', () => {
    const choice = 0
    const numberOfChoices = 10

    expect(choiceValidator(choice, numberOfChoices, errorMessage)).toEqual(
      errorMessage
    )
  })

  it('should return the error message when the choice is greater than the number of choices', () => {
    const choice = 2
    const numberOfChoices = 1

    expect(choiceValidator(choice, numberOfChoices, errorMessage)).toEqual(
      errorMessage
    )
  })
})
