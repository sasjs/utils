import { encodeToBase64, decodeFromBase64 } from './base64'

describe('base64', () => {
  it('should return a base64 encoded string with encoded as prefix', () => {
    const rawPassword = 'hello-world'
    const encodedPassword =
      'MnByd3VQOWJSRzZkRUpqSnBuMnprcU5ONzlHcUNYMXpVQUtWYzFKRWF0MVlSWFBzRzdHRjJUM1I1VW8yRWRpUW05dVh2MHp5MGJ5WWVqeEQwbVJtQjZzWGZTY3dQSlJBMkJWQ3NhWndReFdGTlNIZVVNVmtha1NuQVpoUHgyWTczMEJiNFRINVNhQ0dXczI0ODNHM1VQdFZMWDJDb1VaTDRkYm1BMVVmU21VYVgzc3VHR2VaejE4UUZCNjZrZTIxUG9OSTBDd2FoZWxsby13b3JsZA=='
    expect(encodeToBase64('hello-world')).toEqual(encodedPassword)
  })

  it('should return a decoded string with encoded as a prefix', () => {
    const encodedPassword =
      'MnByd3VQOWJSRzZkRUpqSnBuMnprcU5ONzlHcUNYMXpVQUtWYzFKRWF0MVlSWFBzRzdHRjJUM1I1VW8yRWRpUW05dVh2MHp5MGJ5WWVqeEQwbVJtQjZzWGZTY3dQSlJBMkJWQ3NhWndReFdGTlNIZVVNVmtha1NuQVpoUHgyWTczMEJiNFRINVNhQ0dXczI0ODNHM1VQdFZMWDJDb1VaTDRkYm1BMVVmU21VYVgzc3VHR2VaejE4UUZCNjZrZTIxUG9OSTBDd2FoZWxsby13b3JsZA=='
    const passwordWithPrefix =
      '2prwuP9bRG6dEJjJpn2zkqNN79GqCX1zUAKVc1JEat1YRXPsG7GF2T3R5Uo2EdiQm9uXv0zy0byYejxD0mRmB6sXfScwPJRA2BVCsaZwQxWFNSHeUMVkakSnAZhPx2Y730Bb4TH5SaCGWs2483G3UPtVLX2CoUZL4dbmA1UfSmUaX3suGGeZz18QFB66ke21PoNI0Cwahello-world'
    expect(decodeFromBase64(encodedPassword)).toEqual(passwordWithPrefix)
  })
})
