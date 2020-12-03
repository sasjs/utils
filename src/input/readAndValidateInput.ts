import prompts from 'prompts'

export type InputType = 'number' | 'text'
export type InputValidator = (value: any) => string | boolean

const isValidInputType = (type: any): boolean =>
  type === 'number' || type === 'text'

export const readAndValidateInput = async (
  type: InputType,
  fieldName: string,
  message: string,
  validator: InputValidator
) => {
  if (!isValidInputType(type)) {
    throw new Error(
      'Invalid input type. Valid input types are `text` and `number`'
    )
  }
  return await prompts.prompt({
    type,
    name: fieldName,
    message,
    validate: validator
  })
}
