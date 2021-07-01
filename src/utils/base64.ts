export const encodeToBase64 = (str: string) =>
  Buffer.from('encoded' + str).toString('base64')
export const decodeFromBase64 = (b64Encoded: string) =>
  Buffer.from(b64Encoded, 'base64').toString()
