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
