import {
  getChoice,
  getConfirmation,
  getNumber,
  getString,
  getUrl
} from './readAndValidateInput'
import prompts from 'prompts'
jest.mock('prompts')

describe('readAndValidateInput', () => {
  it('should call prompts to get string values', async (done) => {
    const fieldName = 'name'
    const message = 'Enter your name: '
    const validator = (value: string) => !!value
    spyOn(prompts, 'prompt')

    await getString(fieldName, message, validator)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    done()
  })

  it('should call prompts to get number values', async (done) => {
    const fieldName = 'number'
    const message = 'Enter a number: '
    const validator = (value: number) => !!value
    spyOn(prompts, 'prompt')

    await getNumber(fieldName, message, validator, 0)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    done()
  })

  it('should call prompts to get URL values', async (done) => {
    const fieldName = 'url'
    const message = 'Enter a URL: '
    const errorMessage = 'URL is invalid.'
    spyOn(prompts, 'prompt')

    await getUrl(fieldName, message, errorMessage)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    done()
  })

  it('should call prompts to get a confirmation', async (done) => {
    const fieldName = 'confirm'
    const message = 'Are you sure? '
    spyOn(prompts, 'prompt')

    await getConfirmation(fieldName, message, false)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    done()
  })

  it('should call prompts to get a selection', async (done) => {
    const fieldName = 'select'
    const message = 'Choose: '
    spyOn(prompts, 'prompt')

    await getChoice(fieldName, message, (v) => !!v, 0, [
      { title: 'Option 1' },
      { title: 'Option 2' }
    ])

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    done()
  })
})
