import { prefixMessage } from './errorModifier'

const messagePrefix = 'Test Prefix. '

describe('errorModifier', () => {
  it('should add prefix to error of type string', () => {
    const error = 'Some Error'

    expect(prefixMessage(error, messagePrefix)).toEqual(
      `${messagePrefix}${error}`
    )
  })

  it('should add prefix to error of object with message property', () => {
    const errorMessage = 'Some Message'
    const error = {
      message: errorMessage
    }

    expect(prefixMessage(error, messagePrefix)).toEqual({
      message: `${messagePrefix}${errorMessage}`
    })
  })

  it('should add prefix to error of object', () => {
    const error = {}

    expect(prefixMessage(error, messagePrefix)).toEqual({
      message: messagePrefix
    })
  })

  it('should add prefix to error of object with body property', () => {
    const error = { body: {} }

    expect(prefixMessage(error, messagePrefix)).toEqual({
      ...error,
      message: messagePrefix
    })
  })

  it('should add prefix to error of object with body and message properties', () => {
    const errorMessage = 'Some Message'
    const error = { body: { message: errorMessage } }

    expect(prefixMessage(error, messagePrefix)).toEqual({
      ...error,
      message: messagePrefix + errorMessage
    })
  })

  it('should add prefix to error of object with body property of type string parsable to object', () => {
    const errorMessage = 'Some Message'
    const error = { body: `{ "description": "${errorMessage}" }` }

    expect(prefixMessage(error, messagePrefix)).toEqual({
      body: { description: errorMessage, message: messagePrefix }
    })
  })

  it('should add prefix to error of object with body property of type string parsable to object with message property', () => {
    const errorMessage = 'Some Message'
    const error = { body: `{ "message": "${errorMessage}" }` }

    expect(prefixMessage(error, messagePrefix)).toEqual({
      body: { message: messagePrefix + errorMessage }
    })
  })

  it('should add prefix to error of object with body property of type string not parsable to object', () => {
    const errorMessage = 'Some Message'
    const error = { body: `{ "message: "${errorMessage}" }` }

    expect(prefixMessage(error, messagePrefix)).toEqual({
      ...error,
      message: messagePrefix
    })
  })
})
