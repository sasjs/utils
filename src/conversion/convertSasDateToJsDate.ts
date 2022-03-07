/**
 * Converts a SAS Date or Datetime to a JavaScript date object, given the logic below:
 *
 * A JS Date contains the number of _milliseconds_ since 01/01/1970
 * A SAS Date contains the number of _days_ since 01/01/1960
 * A SAS Datetime contains the number of _seconds_ since 01/01/1960
 *
 * @param sasValue SAS Date or Datetime to be converted. The type could be `number` or `string.
 * @param unit Unit from which to convert the SAS Date / Datetime, eg `sasdate | sasdatetime`
 * @returns JavaScript Date object
 */
export const convertSasDateToJsDate = (
  sasValue: number | string,
  unit: 'sasdate' | 'sasdatetime'
) => {
  const msInDay = 24 * 60 * 60 * 1000
  const msNegativeTenYears = -315619200000 //since calculating it is not practical/guarantee to get correct value, this is parsed with: new Date(Date.UTC(1960, 0, 1)).getTime()

  if (typeof sasValue !== 'number') sasValue = parseFloat(sasValue)

  if (unit === 'sasdatetime') {
    let ms1960 = sasValue * 1000

    let jsMs = msNegativeTenYears + ms1960
    let jsDate = new Date(jsMs)

    let timezoneOffsetMs = jsDate.getTimezoneOffset() * 60 * 1000
    jsMs += timezoneOffsetMs

    jsDate = new Date(jsMs) // We create new Date object after the timezone correction

    let jsDateUtcMs = Date.UTC(
      jsDate.getFullYear(),
      jsDate.getMonth(),
      jsDate.getDate(),
      jsDate.getHours(),
      jsDate.getMinutes(),
      jsDate.getSeconds()
    )

    return new Date(jsDateUtcMs)
  }

  return new Date(msNegativeTenYears + sasValue * msInDay)
}
