import { urlOrigin } from './url'

describe('urlOrigin', () => {
  it('should return an empty string if empty string was provided', () => {
    expect(urlOrigin('')).toEqual('')
  })

  it('should return url origin', () => {
    let url = 'https://analytium.co.uk'

    expect(urlOrigin(url)).toEqual(url)

    url += ':8080'

    expect(urlOrigin(url)).toEqual(url)
    expect(urlOrigin(url + '/test')).toEqual(url)
  })

  it('should throw an error if provided string is not a valid url', () => {
    expect(() => urlOrigin('not valid')).toThrow('Invalid URL.')
  })
})
