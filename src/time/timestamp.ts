import { padWithNumber } from '../formatter'

export const timestampToYYYYMMDDHHMMSS = (timestamp: number = Date.now()) => {
  const date = new Date(timestamp)

  return (
    [
      date.getFullYear(),
      padWithNumber(date.getMonth() + 1),
      padWithNumber(date.getDate())
    ].join('/') +
    ' ' +
    [
      padWithNumber(date.getHours()),
      padWithNumber(date.getMinutes()),
      padWithNumber(date.getSeconds())
    ].join(':')
  )
}
