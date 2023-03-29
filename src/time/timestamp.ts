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

export const generateTimestamp = (sep = '', sepIndex?: number): string => {
  const date = new Date()

  let timestamp: string | (number | string)[] = [
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  ]

  timestamp = timestamp.map((item) => padWithNumber(item as number))

  if (sepIndex && sep && sepIndex < timestamp.length && sepIndex >= 0) {
    timestamp.splice(sepIndex, 0, sep)
  }

  timestamp = timestamp.join(sepIndex ? '' : sep)

  return timestamp
}

export const convertSecondsToHms = (totalSeconds: number) => {
  if (!totalSeconds) return '0 second'

  const totalMinutes = Math.floor(totalSeconds / 60)

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const seconds = totalSeconds % 60

  let result = ''

  if (hours > 0) {
    result = hours + ` hour${hours > 1 ? 's' : ''}`
  }

  if (minutes > 0) {
    result += `${result ? ', ' : ''}${minutes} minute${minutes > 1 ? 's' : ''}`
  }

  if (seconds > 0) {
    result += `${result ? ', ' : ''}${seconds} second${seconds > 1 ? 's' : ''}`
  }

  return result
}
