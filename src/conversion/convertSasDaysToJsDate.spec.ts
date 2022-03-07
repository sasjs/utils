import { convertSasDaysToJsDate } from './convertSasDaysToJsDate'

describe('Convert SAS days to JS date', () => {
  it('should accept string', () => {
    const inputDays = '3653' //3653 days is 10 years - that is start of JS time so function should return `0` milliseconds
    const inputSeconds = '315619200' //315619200 seconds is 10 years - that is start of JS time so function should return `0` milliseconds

    const convertedDateDays = convertSasDaysToJsDate(inputDays, 'days')
    const convertedDateSeconds = convertSasDaysToJsDate(inputSeconds, 'seconds')

    expect(convertedDateDays.valueOf()).toEqual(0)
    expect(convertedDateSeconds.valueOf()).toEqual(-3600000) //Conversion function take timezone in count, so in browser this would be 0. But Node is converting it back to UTC so we hardcode that difference only for test
  })

  it('should accept number', () => {
    const inputDays = 3653 //3653 days is 10 years - that is start of JS time so function should return `0` milliseconds
    const inputSeconds = 315619200 //315619200 seconds is 10 years - that is start of JS time so function should return `0` milliseconds

    const convertedDateDays = convertSasDaysToJsDate(inputDays, 'days')
    const convertedDateSeconds = convertSasDaysToJsDate(inputSeconds, 'seconds')

    expect(convertedDateDays.valueOf()).toEqual(0)
    expect(convertedDateSeconds.valueOf()).toEqual(-3600000) //Conversion function take timezone in count, so in browser this would be 0. But Node is converting it back to UTC so we hardcode that difference only for test
  })
})
