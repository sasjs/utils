import {
  getChoice,
  getConfirmation,
  getNumber,
  getString,
  getUrl,
  InputType,
  onCancel,
  readAndValidateInput
} from './readAndValidateInput'
import prompts from 'prompts'
import { confirmationValidator } from './validators'
jest.mock('prompts')

const defaultErrorMessage = 'Invalid input.'

describe('getString', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call prompts to get string values', async (done) => {
    const message = 'Enter your name: '
    const validator = (value: string) => !!value
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ text: 'abc' }))

    await getString(message, validator)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    expect(prompts.prompt).toHaveBeenCalledWith(
      {
        type: 'text',
        name: 'text',
        initial: '',
        message,
        validate: validator
      },
      { onCancel }
    )
    done()
  })

  it('should throw an error when a string value is null', async (done) => {
    const message = 'Enter your name: '
    const validator = (value: string) => !!value
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ text: null }))

    await expect(getString(message, validator)).rejects.toThrowError(
      defaultErrorMessage
    )
    done()
  })

  it('should throw an error when a string value is undefined', async (done) => {
    const message = 'Enter your name: '
    const validator = (value: string) => !!value
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ text: undefined }))

    await expect(getString(message, validator)).rejects.toThrowError(
      defaultErrorMessage
    )
    done()
  })
})

describe('getNumber', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call prompts to get number values', async (done) => {
    const message = 'Enter a number: '
    const defaultValue = 0
    const validator = (value: number) => !!value
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ number: 123 }))

    await getNumber(message, validator, defaultValue)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    expect(prompts.prompt).toHaveBeenCalledWith(
      {
        type: 'number',
        name: 'number',
        initial: defaultValue,
        message,
        validate: validator
      },
      { onCancel }
    )
    done()
  })

  it('should throw an error when a number value is a string', async (done) => {
    const message = 'Enter a number: '
    const defaultValue = 0
    const validator = (value: number) => !!value
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ number: 'test' }))

    await expect(
      getNumber(message, validator, defaultValue)
    ).rejects.toThrowError(defaultErrorMessage)
    done()
  })

  it('should throw an error when a number value is null', async (done) => {
    const message = 'Enter a number: '
    const defaultValue = 0
    const validator = (value: number) => !!value
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ number: null }))

    await expect(
      getNumber(message, validator, defaultValue)
    ).rejects.toThrowError(defaultErrorMessage)
    done()
  })

  it('should throw an error when a number value is undefined', async (done) => {
    const message = 'Enter a number: '
    const defaultValue = 0
    const validator = (value: number) => !!value
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ number: undefined }))

    await expect(
      getNumber(message, validator, defaultValue)
    ).rejects.toThrowError(defaultErrorMessage)
    done()
  })
})

describe('getUrl', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call prompts to get URL values', async (done) => {
    const message = 'Enter a URL: '
    const errorMessage = 'URL is invalid.'
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ url: '' }))

    await getUrl(message, errorMessage)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    expect(prompts.prompt).toHaveBeenCalledWith(
      {
        type: 'text',
        name: 'url',
        initial: '',
        message,
        validate: expect.anything()
      },
      { onCancel }
    )
    done()
  })

  it('should throw an error when the value is null', async (done) => {
    const message = 'Enter a URL: '
    const errorMessage = 'URL is invalid.'
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ url: null }))

    await expect(getUrl(message, errorMessage)).rejects.toThrowError(
      errorMessage
    )
    done()
  })

  it('should throw an error when the value is undefined', async (done) => {
    const message = 'Enter a URL: '
    const errorMessage = 'URL is invalid.'
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ url: undefined }))

    await expect(getUrl(message, errorMessage)).rejects.toThrowError(
      errorMessage
    )
    done()
  })
})

describe('getConfirmation', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call prompts to get a confirmation', async (done) => {
    const message = 'Are you sure? '
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ confirm: true }))

    await getConfirmation(message, false)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    expect(prompts.prompt).toHaveBeenCalledWith(
      {
        type: 'confirm',
        name: 'confirm',
        initial: false,
        message,
        validate: confirmationValidator
      },
      { onCancel }
    )
    done()
  })

  it('should throw an error when the value is non-boolean', async (done) => {
    const message = 'Are you sure? '
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ confirm: 'test' }))

    await expect(getConfirmation(message, false)).rejects.toThrowError(
      defaultErrorMessage
    )
    done()
  })
})

describe('getChoice', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should call prompts to get a selection', async (done) => {
    const message = 'Choose: '
    const errorMessage = 'Invalid choice.'
    const choices = [
      { title: 'Option 1', value: 1 },
      { title: 'Option 2', value: 2 }
    ]
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ choice: 1 }))

    await getChoice(message, errorMessage, choices)

    expect(prompts.prompt).toHaveBeenCalledTimes(1)
    expect(prompts.prompt).toHaveBeenCalledWith(
      {
        type: 'select',
        name: 'choice',
        initial: 0,
        message,
        validate: expect.anything(),
        choices
      },
      { onCancel }
    )
    done()
  })

  it('should throw an error with a non-number choice', async (done) => {
    const message = 'Choose: '
    const errorMessage = 'Invalid choice.'
    const choices = [
      { title: 'Option 1', value: 1 },
      { title: 'Option 2', value: 2 }
    ]
    jest
      .spyOn(prompts, 'prompt')
      .mockImplementation(() => Promise.resolve({ choice: 'abc' }))

    await expect(
      getChoice(message, errorMessage, choices)
    ).rejects.toThrowError(errorMessage)
    done()
  })
})

describe('readAndValidateInput', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should throw an error when the input type is invalid', async () => {
    jest.spyOn(prompts, 'prompt')

    await expect(
      readAndValidateInput(
        'garbage' as InputType,
        'choice',
        'Choose',
        (v) => !!v
      )
    ).rejects.toThrowError(
      'Invalid input type. Valid input types are `text`, `number`, `url`, `confirm` and `select`'
    )
  })

  it('should throw an error when the input type is select and there are no choices provided', async () => {
    jest.spyOn(prompts, 'prompt')

    await expect(
      readAndValidateInput('select', 'choice', 'Choose', (v) => !!v)
    ).rejects.toThrowError(
      'A set of choices is required to be supplied with the `select` input type.'
    )
  })

  it('should throw an error when the input type is not select and there are choices provided', async () => {
    jest.spyOn(prompts, 'prompt')

    await expect(
      readAndValidateInput('number', 'choice', 'Choose', (v) => !!v, 1, [
        { title: 'Test', value: 1 }
      ])
    ).rejects.toThrowError(
      'Choices are only supported with the `select` input type.'
    )
  })
})
