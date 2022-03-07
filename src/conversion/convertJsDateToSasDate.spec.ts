import { convertJsDateToSasDate } from './convertJsDateToSasDate'

describe('Convert JS date to SAS date', () => {
  it('should accept timestamp', () => {
    const input = 0 // 0 milliseconds in JS is January 1st 1970 01:00:00

    const convertedDateDays = convertJsDateToSasDate(input, 'days')
    const convertedDateSeconds = convertJsDateToSasDate(input, 'seconds')
    const convertedDateMilliseconds = convertJsDateToSasDate(
      input,
      'milliseconds'
    )

    expect(convertedDateDays).toEqual(3653)
    expect(convertedDateSeconds).toEqual(315622800)
    expect(convertedDateMilliseconds).toEqual(315622800000)
  })

  it('should accept Date object', () => {
    const input = new Date(1970, 0, 1, 1) // 0 milliseconds in JS is January 1st 1970 01:00:00

    const convertedDateDays = convertJsDateToSasDate(input, 'days')
    const convertedDateSeconds = convertJsDateToSasDate(input, 'seconds')
    const convertedDateMilliseconds = convertJsDateToSasDate(
      input,
      'milliseconds'
    )

    expect(convertedDateDays).toEqual(3653)
    expect(convertedDateSeconds).toEqual(315622800)
    expect(convertedDateMilliseconds).toEqual(315622800000)
  })
})
