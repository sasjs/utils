import { isHttpUri, isHttpsUri, urlOrigin } from '../url'

describe('isHttpUri', () => {
  it('accepts http urls', () => {
    expect(isHttpUri('http://example.com')).toBe(true)
    expect(isHttpUri('http://localhost')).toBe(true)
    expect(isHttpUri('http://host:8080')).toBe(true)
    expect(isHttpUri('http://host:8080/path?q=1')).toBe(true)
  })

  it('rejects other protocols', () => {
    expect(isHttpUri('https://example.com')).toBe(false)
    expect(isHttpUri('ftp://example.com')).toBe(false)
  })

  it('rejects a bare host, a missing host and non-urls', () => {
    expect(isHttpUri('example.com')).toBe(false)
    expect(isHttpUri('http://')).toBe(false)
    expect(isHttpUri('')).toBe(false)
    expect(isHttpUri('not a url')).toBe(false)
  })

  it('rejects a backslash in place of the scheme slashes', () => {
    // The parser normalises a backslash to a slash for special schemes, so
    // `new URL('http:\\server')` parses to http://server. valid-url required
    // the literal prefix and rejected it, and so do we.
    expect(isHttpUri('http:\\server')).toBe(false)
    expect(isHttpUri('http:\\ww.example.com')).toBe(false)
    expect(isHttpsUri('https:\\server')).toBe(false)
  })

  it('accepts an uppercase scheme', () => {
    // The parser lowercases the scheme, and valid-url compared it
    // case-insensitively, so these are usable urls.
    expect(isHttpUri('HTTP://example.com')).toBe(true)
    expect(isHttpUri('Http://example.com')).toBe(true)
    expect(isHttpsUri('HTTPS://example.com')).toBe(true)
  })

  it('rejects control characters the parser would strip', () => {
    // The parser strips tab, newline and carriage return before parsing, so
    // these would otherwise resolve to a valid host.
    expect(isHttpUri('http://exa\tmple.com')).toBe(false)
    expect(isHttpUri('http://example.com\n')).toBe(false)
    expect(isHttpUri('http://example.com\r')).toBe(false)
  })
})

describe('isHttpsUri', () => {
  it('accepts https urls', () => {
    expect(isHttpsUri('https://example.com')).toBe(true)
    expect(isHttpsUri('https://host:8080/path')).toBe(true)
  })

  it('rejects http and everything else', () => {
    expect(isHttpsUri('http://example.com')).toBe(false)
    expect(isHttpsUri('example.com')).toBe(false)
    expect(isHttpsUri('https://')).toBe(false)
  })
})

describe('the two helpers together cover what urlOrigin guards', () => {
  it('agrees with urlOrigin on what is a usable url', () => {
    for (const url of ['http://example.com', 'https://host:8080']) {
      expect(isHttpUri(url) || isHttpsUri(url)).toBe(true)
      expect(() => urlOrigin(url)).not.toThrow()
    }
  })
})
