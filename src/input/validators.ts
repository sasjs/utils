import validUrl from 'valid-url'

export const urlValidator = (value: string, errorMessage: string) =>
  !!validUrl.isHttpUri(value) ||
  !!validUrl.isHttpsUri(value) ||
  value === '' ||
  errorMessage

export const confirmationValidator = (value: any) =>
  value === true || value === false

export const choiceValidator = (
  value: number,
  numberOfChoices: number,
  errorMessage: string
) => (value > 0 && value <= numberOfChoices) || errorMessage

// This regex will match special missing
// `a-z` or `_` or `.` or '.a'
export const isSpecialMissing = (value: any) => {
  // This regex can't cover the case with `..` two dots, so if we receive it that is false special missing
  if (typeof value === 'string' && value.includes('..')) return false

  const regex = new RegExp('^(\\.)?[a-z_.]{1}$', 'i')
  return regex.test(value)
}
