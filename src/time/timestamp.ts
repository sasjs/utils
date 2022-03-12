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

export function generateTimestamp(sep = '', sepIndex?: number): string {
  const date = new Date()

  let timestamp: string | (number | string)[] = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ]

  timestamp = timestamp.map(item => padWithNumber(item as number))

  if (sepIndex && sep && sepIndex < timestamp.length && sepIndex >= 0) {
    timestamp.splice(sepIndex, 0, sep)
  }

  timestamp = timestamp.join(sepIndex ? '' : sep)

  return timestamp
}
