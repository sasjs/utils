import {
  convertSecondsToHms,
  timestampToYYYYMMDDHHMMSS,
  generateTimestamp
} from './timestamp'

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

describe('generateTimestamp', () => {
  let realDate: DateConstructor
  beforeAll(() => {
    const currentDate = new Date('2020-10-02T10:10:10.10Z')
    realDate = Date
    global.Date = class extends Date {
      constructor(date: string) {
        if (date) {
          return super(date) as any
        }

        return currentDate
      }
    } as DateConstructor
  })

  test('should generate a timestamp in the correct format', () => {
    const expectedTimestamp = '20201002101010'

    const timestamp = generateTimestamp()

    expect(timestamp).toEqual(expectedTimestamp)
  })

  test('should generate a timestamp separated by _', () => {
    const expectedTimestamp = '2020_10_02_10_10_10'

    const timestamp = generateTimestamp('_')

    expect(timestamp).toEqual(expectedTimestamp)
  })

  test('should generate a timestamp with separator after day only', () => {
    const expectedTimestamp = '20201002_101010'

    const timestamp = generateTimestamp('_', 3)

    expect(timestamp).toEqual(expectedTimestamp)
  })

  test('should generate a timestamp not without separator', () => {
    const expectedTimestamp = '20201002101010'

    let timestamp = generateTimestamp('_', -1)

    expect(timestamp).toEqual(expectedTimestamp)

    timestamp = generateTimestamp('_', 8)

    expect(timestamp).toEqual(expectedTimestamp)
  })

  afterAll(() => {
    global.Date = realDate
  })
})

describe('convertSecondsToHms', () => {
  const hour = 3600 // 3600 secs = 1 hour
  const minute = 60 // 60 secs = 1 min

  test('should convert seconds to Hms', () => {
    expect(convertSecondsToHms(1 * hour)).toEqual('1 hour')
    expect(convertSecondsToHms(2 * hour)).toEqual('2 hours')
    expect(convertSecondsToHms(1 * hour + 1 * minute)).toEqual(
      '1 hour, 1 minute'
    )
    expect(convertSecondsToHms(1 * hour + 2 * minute)).toEqual(
      '1 hour, 2 minutes'
    )
    expect(convertSecondsToHms(2 * hour + 1 * minute)).toEqual(
      '2 hours, 1 minute'
    )
    expect(convertSecondsToHms(2 * hour + 2 * minute)).toEqual(
      '2 hours, 2 minutes'
    )
    expect(convertSecondsToHms(2 * hour + 2 * minute + 30)).toEqual(
      '2 hours, 2 minutes, 30 seconds'
    )
    expect(convertSecondsToHms(2 * hour + 30)).toEqual('2 hours, 30 seconds')
    expect(convertSecondsToHms(2 * minute + 30)).toEqual(
      '2 minutes, 30 seconds'
    )
    expect(convertSecondsToHms(0)).toEqual('0 second')
  })
})
