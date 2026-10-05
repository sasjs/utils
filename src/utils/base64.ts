const PREFIX = '{sasjs_encoded}'
const PREFIX_HEX_LENGTH = 200

// The prefix is obfuscation, not encryption: decodeFromBase64 strips it by fixed
// offset (substring(200)), so its only jobs are to make an encoded value unique
// and to stop it reading as base64 of a password. The Web Crypto global is used
// directly rather than Node's `crypto` module, so webpack has nothing to alias
// to crypto-browserify and the browser bundle carries no crypto shim.
const randomHexPrefix = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(PREFIX_HEX_LENGTH / 2)))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')

export const encodeToBase64 = (str: string) => {
  const encodedPassword = Buffer.from(randomHexPrefix() + str).toString(
    'base64'
  )
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
