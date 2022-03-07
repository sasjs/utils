/**
 * Converts JavaScript date to the SAS Date
 * JS Date starts at 1970
 * SAS Date starts at 1960
 * So that difference must be calculated
 * @param jsDate JS Date to be converted. Type could be `Date` or `string. If it's string, available formats are all that Date() can parse.
 * @param unit Unit in which to return SAS Date. `days | seconds | milliseconds`
 * @returns SAS Date value based on `unit` param
 */
export const convertJsDateToSasDate = (
  jsDate: number | Date,
  unit: 'days' | 'seconds' | 'milliseconds' = 'milliseconds'
): number => {
  let jsDateObject: Date
  let valueInMilliseconds: number = 0

  if (!(jsDate instanceof Date)) {
    jsDateObject = new Date(jsDate)
  } else {
    jsDateObject = jsDate
  }

  valueInMilliseconds = new Date(
    Date.UTC(
      jsDateObject.getFullYear(),
      jsDateObject.getMonth(),
      jsDateObject.getDate(),
      jsDateObject.getHours(),
      jsDateObject.getMinutes(),
      jsDateObject.getSeconds()
    )
  ).valueOf()

  const msInDay = 24 * 60 * 60 * 1000
  const msInTenYears = 315619200000 //since calculating it is not practical/guarantee to get correct value, this is parsed with: new Date(Date.UTC(1960, 0, 1)).getTime()

  const sasMilliseconds = valueInMilliseconds + msInTenYears

  switch (unit) {
    case 'days': {
      let valueInDays = sasMilliseconds / msInDay

      valueInDays = Math.abs(valueInDays)
      valueInDays = Math.floor(valueInDays)

      return valueInDays
    }
    case 'seconds': {
      return sasMilliseconds / 1000
    }
    case 'milliseconds': {
      return sasMilliseconds
    }
    default: {
      return -1
    }
  }
}
