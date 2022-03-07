export const convertSasDateToJsDate = (
  sasValue: number | string,
  unit: 'sasdate' | 'sasdatetime'
) => {
  const msInDay = 24 * 60 * 60 * 1000
  const msNegativeTenYears = -315619200000 //since calculating it is not practical/guarantee to get correct value, this is parsed with: new Date(Date.UTC(1960, 0, 1)).getTime()

  if (typeof sasValue !== 'number') sasValue = parseFloat(sasValue)

  if (unit === 'seconds') {
    let sasMs = sasValue * 1000

    let jsMs = msNegativeTenYears + sasMs

    let timezoneOffsetMs = new Date(jsMs).getTimezoneOffset() * 60 * 1000

    jsMs += timezoneOffsetMs

    return new Date(jsMs)
  }

  return new Date(msNegativeTenYears + sasValue * msInDay)
}
