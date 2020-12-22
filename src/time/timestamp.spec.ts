import { timestampToYYYYMMDDHHMMSS } from './timestamp'

describe('timestampToYYYYMMDDHHMMSS', () => {
  it('should format provided timestamp', () => {
    const timestamp = 1608617468867

    expect(timestampToYYYYMMDDHHMMSS(timestamp)).toEqual('2020/11/2 9:11:8')
  })

  it('should return formatted current time if timestamp was not provided', () => {
    const regExp = /^\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/

    expect(timestampToYYYYMMDDHHMMSS().match(regExp)).toBeTruthy()

    const timestampMatchRegExp = timestampToYYYYMMDDHHMMSS().match(regExp)

    expect(timestampMatchRegExp!.length).toEqual(1)
  })
})
