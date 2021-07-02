import crypto from 'crypto'
const PREFIX = '{sasjs_encoded}'
export const encodeToBase64 = (str: string) => {
  const randomString = crypto.randomBytes(100).toString('hex')
  const encodedPassword = Buffer.from(randomString + str).toString('base64')
  return PREFIX + encodedPassword
}
export const decodeFromBase64 = (str: string) => {
  if (str.startsWith(PREFIX)) {
    str = str.replace(/^{sasjs_encoded}/, '')
    const decodedPassword = Buffer.from(str, 'base64').toString()
    return decodedPassword.substring(200)
  }
  return str
}
