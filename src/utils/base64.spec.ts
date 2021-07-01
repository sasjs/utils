import { encodeToBase64, decodeFromBase64 } from './base64'

describe('base64', () => {
  it('should return a base64 encoded string with encoded as prefix', () => {
    expect(encodeToBase64('hello-world')).toEqual('ZW5jb2RlZGhlbGxvLXdvcmxk')
  })

  it('should return a decoded string with encoded as a prefix', () => {
    expect(decodeFromBase64('ZW5jb2RlZGhlbGxvLXdvcmxk')).toEqual(
      'encodedhello-world'
    )
  })
})
