const PREFIX =
  '2prwuP9bRG6dEJjJpn2zkqNN79GqCX1zUAKVc1JEat1YRXPsG7GF2T3R5Uo2EdiQm9uXv0zy0byYejxD0mRmB6sXfScwPJRA2BVCsaZwQxWFNSHeUMVkakSnAZhPx2Y730Bb4TH5SaCGWs2483G3UPtVLX2CoUZL4dbmA1UfSmUaX3suGGeZz18QFB66ke21PoNI0Cwa'
export const encodeToBase64 = (str: string) =>
  Buffer.from(PREFIX + str).toString('base64')
export const decodeFromBase64 = (str: string) => {
  const decodedPassword = Buffer.from(str, 'base64').toString()
  if (decodedPassword.startsWith(PREFIX)) {
    return decodedPassword.split(PREFIX).pop()
  }
  return str
}
