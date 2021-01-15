export const padWithNumber = (number: number, padWith = 0) => {
  if (number > 9) return number

  return `${padWith}${number}`
}
