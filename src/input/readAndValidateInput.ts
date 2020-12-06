import prompts from 'prompts'
import validUrl from 'valid-url'

export type InputType = 'number' | 'text' | 'select' | 'confirm'
export type InputValidator = (
  value: any
) => string | boolean | Promise<string | boolean>

export interface Choice {
  title: string
  description?: string
  value?: string | number
}

const isValidInputType = (type: any): boolean =>
  type === 'number' ||
  type === 'text' ||
  type === 'select' ||
  type === 'confirm'

export const getNumber = async (
  fieldName: string,
  message: string,
  validator: InputValidator,
  defaultValue: number
): Promise<{ [key: string]: number }> => {
  return await readAndValidateInput(
    'number',
    fieldName,
    message,
    validator,
    defaultValue
  )
}

export const getString = async (
  fieldName: string,
  message: string,
  validator: InputValidator,
  defaultValue: string = ''
): Promise<{ [key: string]: string }> => {
  return await readAndValidateInput(
    'text',
    fieldName,
    message,
    validator,
    defaultValue
  )
}

export const getConfirmation = async (
  fieldName: string,
  message: string,
  defaultValue: boolean
): Promise<{ [key: string]: boolean }> => {
  return await readAndValidateInput(
    'confirm',
    fieldName,
    message,
    (v) => v === true || v === false,
    defaultValue
  )
}

export const getChoice = async (
  fieldName: string,
  message: string,
  validator: InputValidator,
  defaultValue: string | number,
  choices: Choice[] = []
): Promise<{ [key: string]: number }> => {
  return await readAndValidateInput(
    'select',
    fieldName,
    message,
    validator,
    defaultValue,
    choices
  )
}

export const getUrl = async (
  fieldName: string,
  message: string,
  errorMessage: string
): Promise<{ [key: string]: string }> => {
  return await readAndValidateInput(
    'text',
    fieldName,
    message,
    (v: string) => !!validUrl.isUri(v) || v === '' || errorMessage,
    ''
  )
}

const readAndValidateInput = async (
  type: InputType,
  fieldName: string,
  message: string,
  validator: InputValidator,
  defaultValue: string | number | boolean = '',
  choices: Choice[] = []
) => {
  if (!isValidInputType(type)) {
    throw new Error(
      'Invalid input type. Valid input types are `text`, `number`, `confirm` and `select`'
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
