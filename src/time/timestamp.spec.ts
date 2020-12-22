import { timestampToYYYYMMDDHHMMSS } from './timestamp'

describe('timestampToYYYYMMDDHHMMSS', () => {
  const regExp = /^\d{4}\/\d{1,2}\/\d{1,2} \d{1,2}:\d{1,2}:\d{1,2}/

  it('should format provided timestamp', () => {
    const timestamp = 1608617468867

    expect(timestampToYYYYMMDDHHMMSS(timestamp).match(regExp)).toBeTruthy()
    expect(timestampToYYYYMMDDHHMMSS(timestamp).match(regExp)!.length).toEqual(
      1
    )
  })

  it('should return formatted current time if timestamp was not provided', () => {
    expect(timestampToYYYYMMDDHHMMSS().match(regExp)).toBeTruthy()
    expect(timestampToYYYYMMDDHHMMSS().match(regExp)!.length).toEqual(1)
  })
})
