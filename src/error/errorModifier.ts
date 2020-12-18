import { Error } from '../types/index'

export const prefixMessage = (err: Error | string, messagePrefix: string) => {
  if (typeof err === 'object') {
    if (err.hasOwnProperty('message')) {
      err.message = messagePrefix + err.message
    } else {
      if (err.hasOwnProperty('body')) {
        if (typeof err.body === 'object') {
          err.message = err.body.message
            ? messagePrefix + err.body.message
            : messagePrefix
        }

        if (typeof err.body === 'string') {
          let body

          try {
            body = JSON.parse(err.body)
          } catch (error) {
            err.message = messagePrefix

            return err
          }

          body.message = body.message
            ? messagePrefix + body.message
            : messagePrefix

          err.body = body

          return err
        }
      } else return { ...err, message: messagePrefix }
    }
  }

  if (typeof err === 'string') err = messagePrefix + err

  return err
}
