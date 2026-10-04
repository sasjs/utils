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

// The parser strips ASCII tab, newline and carriage return before parsing, so
// `new URL('http://exa\tmple.com')` yields `http://example.com`. Those are
// illegal in a URL, and `valid-url` rejected them.
const hasControlChars = (str: string) => /[\u0000-\u001F\u007F]/.test(str)

/**
 * The literal prefix is checked as well as the parsed protocol, because the URL
 * parser normalises a backslash to a forward slash for special schemes:
 * `new URL('http:\\server')` yields `http://server`. `valid-url`, which these
 * replaced, required the literal prefix and so rejected such input.
 *
 * The prefix comparison is case-insensitive: the parser lowercases the scheme,
 * so `HTTP://example.com` is a usable URL, and `valid-url` compared the scheme
 * case-insensitively too. A backslash still fails, since it is not a slash in
 * either case.
 */
export const isHttpUri = (str: string) =>
  typeof str === 'string' &&
  !hasControlChars(str) &&
  str.toLowerCase().startsWith('http://') &&
  hasHttpProtocol(str, 'http:')

export const isHttpsUri = (str: string) =>
  typeof str === 'string' &&
  !hasControlChars(str) &&
  str.toLowerCase().startsWith('https://') &&
  hasHttpProtocol(str, 'https:')
