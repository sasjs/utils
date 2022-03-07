/**
 * Converts a JavaScript date object to a SAS Date or Datetime, given the logic below:
 * 
 * A JS Date contains the number of _milliseconds_ since 01/01/1970
 * A SAS Date contains the number of _days_ since 01/01/1960
 * A SAS Datetime contains the number of _seconds_ since 01/01/1960 
 * 
 * @param jsDate JS Date to be converted. The type could be `Date` or `string. If it's a string, the available formats are all those that Date() can parse.
 * @param unit Unit in which to return the SAS Date / datetime, eg `sasdate | sasdatetime`
 * @returns SAS Date value based on `unit` param
 */
export const convertJsDateToSasDate = (
  jsDate: number | Date,
  unit: 'sasdate' | 'sasdatetime'
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
  const msInTenYears = 315619200000 //calculating is not guaranteed to give the correct value, as this is parsed with: new Date(Date.UTC(1960, 0, 1)).getTime()

  const ms1960 = valueInMilliseconds + msInTenYears

  switch (unit) {
    case 'sasdate': {
      // always in days from 1960
      let valueInDays = ms1960 / msInDay

      valueInDays = Math.abs(valueInDays)
      valueInDays = Math.floor(valueInDays)

      return valueInDays
    }
    case 'sasdatetime': {
      // always in seconds from 1960
      return ms1960 / 1000
    }
    default: {
      return -1
    }
  }
}
