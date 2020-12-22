export const timestampToYYYYMMDDHHMMSS = (timestamp: number = Date.now()) => {
  const date = new Date(timestamp)

  return (
    [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('/') +
    ' ' +
    [date.getHours(), date.getMinutes(), date.getSeconds()].join(':')
  )
}
