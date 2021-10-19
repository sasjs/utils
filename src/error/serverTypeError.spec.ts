import { ServerTypeError } from './serverTypeError'
import { ServerType } from '../types'

describe('ServerTypeError', () => {
  it('should include valid server type', () => {
    const validServerType = ServerType.Sas9
    const error = new ServerTypeError([validServerType])

    expect(error).toBeInstanceOf(ServerTypeError)
    expect(error.name).toEqual('ServerTypeError')
    expect(error.message).toEqual(
      `Invalid server type: valid option is ${validServerType}`
    )
  })

  it('should include 2 valid server types', () => {
    const validServerType1 = ServerType.Sas9
    const validServerType2 = ServerType.SasViya
    const error = new ServerTypeError([validServerType1, validServerType2])

    expect(error.message).toEqual(
      `Invalid server type: valid options are ${validServerType1} and ${validServerType2}`
    )
  })

  it('should include 3 valid server types', () => {
    const validServerType1 = ServerType.Sas9
    const validServerType2 = ServerType.SasViya
    const validServerType3 = ServerType.Sasjs
    const error = new ServerTypeError([
      validServerType1,
      validServerType2,
      validServerType3
    ])

    expect(error.message).toEqual(
      `Invalid server type: valid options are ${validServerType1}, ${validServerType2} and ${validServerType3}`
    )
  })

  it('should include unique server types only', () => {
    const validServerType1 = ServerType.Sas9
    const validServerType2 = ServerType.SasViya
    const validServerType3 = ServerType.Sasjs
    const validServerType4 = ServerType.Sasjs
    const error = new ServerTypeError([
      validServerType1,
      validServerType2,
      validServerType3,
      validServerType4
    ])

    expect(error.message).toEqual(
      `Invalid server type: valid options are ${validServerType1}, ${validServerType2} and ${validServerType3}`
    )
  })

  it('should include all supported server types if server type was not provided', () => {
    const error = new ServerTypeError()

    expect(error.message).toEqual(
      `Invalid server type: valid options are ${ServerType.SasViya}, ${ServerType.Sas9} and ${ServerType.Sasjs}`
    )
  })

  // TODO: test if super was called
})
