/**
 * Converts a JavaScript date object to a SAS Date or Datetime, given the logic below:
 *
 * A JS Date contains the number of _milliseconds_ since 01/01/1970
 * A SAS Date contains the number of _days_ since 01/01/1960
 * A SAS Datetime contains the number of _seconds_ since 01/01/1960
 *
 * @param jsDate JS Date to be converted. The type is instance of `Date`
 * @param unit Unit in which to return the SAS Date / datetime, eg `sasdate | sasdatetime`
 * @returns SAS Date value based on `unit` param
 */
export const convertJsDateToSasDate = (
  jsDate: Date,
  unit: 'sasdate' | 'sasdatetime'
): number => {
  const valueInMilliseconds = new Date(
    Date.UTC(
      jsDate.getFullYear(),
      jsDate.getMonth(),
      jsDate.getDate(),
      jsDate.getHours(),
      jsDate.getMinutes(),
      jsDate.getSeconds()
    )
  ).valueOf()

  const msInDay = 24 * 60 * 60 * 1000
  const msInTenYears = 315619200000 //calculating is not guaranteed to give the correct value, as this is parsed with: new Date(Date.UTC(1960, 0, 1)).getTime()

  const ms1960 = valueInMilliseconds + msInTenYears

  switch (unit) {
    case 'sasdate': {
      // always in days from 1960
      let valueInDays = ms1960 / msInDay

      valueInDays = Math.floor(valueInDays)

      return valueInDays
    }
    case 'sasdatetime': {
      // always in seconds from 1960
      return ms1960 / 1000
    }
  }
}
