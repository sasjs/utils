export const urlOrigin = (str: string) => {
  if (str === '') return str

  let origin

  try {
    origin = new URL(str).origin
  } catch (_) {
    throw new Error('Invalid URL.')
  }

  return origin
}

const hasHttpProtocol = (str: string, protocol: string) => {
  try {
    const url = new URL(str)

    return url.protocol === protocol && !!url.hostname
  } catch (_) {
    return false
  }
}

/**
 * The literal prefix is checked as well as the parsed protocol, because the URL
 * parser normalises a backslash to a forward slash for special schemes:
 * `new URL('http:\\server')` yields `http://server`. `valid-url`, which these
 * replaced, required the literal prefix and so rejected such input.
 */
export const isHttpUri = (str: string) =>
  typeof str === 'string' &&
  str.startsWith('http://') &&
  hasHttpProtocol(str, 'http:')

export const isHttpsUri = (str: string) =>
  typeof str === 'string' &&
  str.startsWith('https://') &&
  hasHttpProtocol(str, 'https:')
