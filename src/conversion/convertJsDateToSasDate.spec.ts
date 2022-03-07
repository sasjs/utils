import { convertJsDateToSasDate } from './convertJsDateToSasDate'

describe('Convert JS date to SAS date', () => {
  it('should accept timestamp', () => {
    const input = 0 // 0 milliseconds in JS is January 1st 1970 01:00:00

    const convertedDateDays = convertJsDateToSasDate(input, 'sasdate')
    const convertedDateSeconds = convertJsDateToSasDate(input, 'sasdatetime')

    expect(convertedDateDays).toEqual(3653)
    expect(convertedDateSeconds).toEqual(315622800)
  })

  it('should accept Date object', () => {
    const input = new Date(1970, 0, 1, 1) // 0 milliseconds in JS is January 1st 1970 01:00:00

    const convertedDateDays = convertJsDateToSasDate(input, 'sasdate')
    const convertedDateSeconds = convertJsDateToSasDate(input, 'sasdatetime')

    expect(convertedDateDays).toEqual(3653)
    expect(convertedDateSeconds).toEqual(315622800)
  })
})
