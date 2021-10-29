import { ServerType } from '../types'

export class ServerTypeError extends Error {
  constructor(validOptions: ServerType[] = []) {
    validOptions = [...new Set(validOptions)]

    let options = validOptions.length
      ? validOptions.join(', ').trim()
      : [ServerType.SasViya, ServerType.Sas9, ServerType.Sasjs]
          .join(', ')
          .trim()

    options = options.replace(/,\s([^,]*)$/, ' and $1')

    super(
      `Invalid server type: valid option${
        validOptions.length !== 1 ? 's' : ''
      } ${validOptions.length !== 1 ? 'are' : 'is'} ${options}`
    )

    this.name = 'ServerTypeError'

    Object.setPrototypeOf(this, ServerTypeError.prototype)
  }
}
