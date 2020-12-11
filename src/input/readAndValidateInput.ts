import prompts from 'prompts'
import {
  choiceValidator,
  confirmationValidator,
  urlValidator
} from './validators'
export type InputType = 'number' | 'text' | 'select' | 'confirm'
export type InputValidator = (
  value: any
) => string | boolean | Promise<string | boolean>

export interface Choice {
  title: string
  description?: string
  value?: string | number
}

const defaultErrorMessage = 'Invalid input.'

const isValidInputType = (type: any): boolean =>
  type === 'number' ||
  type === 'text' ||
  type === 'select' ||
  type === 'confirm' ||
  type === 'url'

export const getNumber = async (
  message: string,
  validator: InputValidator,
  defaultValue: number
): Promise<number> => {
  const { number } = await readAndValidateInput(
    'number',
    'number',
    message,
    validator,
    defaultValue
  )

  if (
    !Number.isNaN(number) &&
    !(typeof number === 'string') &&
    number !== null &&
    number !== undefined
  ) {
    return number
  }

  throw new Error(defaultErrorMessage)
}

export const getString = async (
  message: string,
  validator: InputValidator,
  defaultValue: string = ''
): Promise<string> => {
  const { text } = await readAndValidateInput(
    'text',
    'text',
    message,
    validator,
    defaultValue
  )

  if (text !== null && text !== undefined) {
    return text
  }

  throw new Error(defaultErrorMessage)
}

export const getConfirmation = async (
  message: string,
  defaultValue: boolean
): Promise<boolean> => {
  const { confirm } = await readAndValidateInput(
    'confirm',
    'confirm',
    message,
    confirmationValidator,
    defaultValue
  )

  if (confirm === true || confirm === false) {
    return confirm
  }

  throw new Error(defaultErrorMessage)
}

export const getChoice = async (
  message: string,
  errorMessage: string,
  choices: Choice[] = []
): Promise<number> => {
  const { choice } = await readAndValidateInput(
    'select',
    'choice',
    message,
    (value) => choiceValidator(value, choices.length, errorMessage),
    0,
    choices
  )

  if (
    !Number.isNaN(choice) &&
    !(typeof choice === 'string') &&
    choice !== null &&
    choice !== undefined
  ) {
    return choice + 1
  }

  throw new Error(errorMessage)
}

export const getUrl = async (
  message: string,
  errorMessage: string
): Promise<{ [key: string]: string }> => {
  const { url } = await readAndValidateInput(
    'text',
    'url',
    message,
    (value: string) => urlValidator(value, errorMessage),
    ''
  )

  if (!!url || url === '') {
    return url
  }

  throw new Error(errorMessage)
}

export const readAndValidateInput = async (
  type: InputType,
  fieldName: string,
  message: string,
  validator: InputValidator,
  defaultValue: string | number | boolean = '',
  choices: Choice[] = []
) => {
  if (!isValidInputType(type)) {
    throw new Error(
      'Invalid input type. Valid input types are `text`, `number`, `url`, `confirm` and `select`'
    )
  }

  if (type !== 'select' && choices.length) {
    throw new Error('Choices are only supported with the `select` input type.')
  }

  if (type === 'select' && !choices.length) {
    throw new Error(
      'A set of choices is required to be supplied with the `select` input type.'
    )
  }

  return await prompts.prompt({
    type,
    name: fieldName,
    initial: defaultValue,
    message,
    choices,
    validate: validator
  })
}
