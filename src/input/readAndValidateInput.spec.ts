import { InputType, readAndValidateInput } from './readAndValidateInput'
import prompts from 'prompts'
jest.mock('prompts')

describe('readAndValidateInput', () => {
  it('should call prompts with the provided parameters', async (done) => {
    const type = 'text'
    const fieldName = 'name'
    const message = 'Enter your name: '
    const validator = (value: string) => !!value
    spyOn(prompts, 'prompt')

    await readAndValidateInput(type, fieldName, message, validator)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    done()
  })

  it('should throw an error when the type is invalid', async (done) => {
    const type = 'url'
    const fieldName = 'name'
    const message = 'Enter your name: '
    const validator = (value: string) => !!value

    await expect(
      readAndValidateInput(type as InputType, fieldName, message, validator)
    ).rejects.toThrow(
      'Invalid input type. Valid input types are `text` and `number`'
    )
    done()
  })
})
