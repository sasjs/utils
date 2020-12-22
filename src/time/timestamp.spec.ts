import { timestampToYYYYMMDDHHMMSS } from './timestamp'

describe('timestampToYYYYMMDDHHMMSS', () => {
  const regExp = /^\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/

  it('should format provided timestamp', () => {
    let timestamp = 0

    expect(timestampToYYYYMMDDHHMMSS(timestamp)).toEqual('1970/0/4 3:0:0')

    timestamp = 1608617468867

    expect(timestampToYYYYMMDDHHMMSS(timestamp).match(regExp)).toBeTruthy()

    const timestampMatchRegExp = timestampToYYYYMMDDHHMMSS(timestamp).match(
      regExp
    )

    expect(timestampMatchRegExp!.length).toEqual(1)
  })

  it('should return formatted current time if timestamp was not provided', () => {
    expect(timestampToYYYYMMDDHHMMSS().match(regExp)).toBeTruthy()

    const timestampMatchRegExp = timestampToYYYYMMDDHHMMSS().match(regExp)

    expect(timestampMatchRegExp!.length).toEqual(1)
  })
})
