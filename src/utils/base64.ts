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

// Buffer does not exist in a browser, and this module is reachable from the
// package root, so the encoding uses the platform globals instead. TextEncoder
// and TextDecoder carry the UTF-8 step: btoa is latin1, so encoding a password
// through it directly corrupts anything non-ASCII. The binary string is built
// in chunks because spreading a whole byte array into String.fromCharCode
// overflows the call stack on long input.
const CHUNK_SIZE = 0x8000

const toBase64 = (bytes: Uint8Array): string => {
  let binary = ''

  for (let offset = 0; offset < bytes.length; offset += CHUNK_SIZE) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + CHUNK_SIZE)
    )
  }

  return btoa(binary)
}

const fromBase64 = (str: string): string => {
  // Buffer ignores whitespace when decoding base64 and atob does not, so a
  // wrapped or padded stored value still decodes.
  const binary = atob(str.replace(/\s/g, ''))

  return new TextDecoder().decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0))
  )
}

export const encodeToBase64 = (str: string) => {
  const encodedPassword = toBase64(
    new TextEncoder().encode(randomHexPrefix() + str)
  )
  return PREFIX + encodedPassword
}

export const decodeFromBase64 = (str: string) => {
  if (str.startsWith(PREFIX)) {
    str = str.replace(/^{sasjs_encoded}/, '')
    const decodedPassword = fromBase64(str)
    return decodedPassword.substring(200)
  }
  return str
}
