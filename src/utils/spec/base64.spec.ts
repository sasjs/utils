import { readFileSync } from 'fs'
import { join } from 'path'
import { encodeToBase64, decodeFromBase64 } from '../base64'

describe('base64', () => {
  const originalPassword = 'hello-world'
  const realBuffer = global.Buffer

  afterEach(() => {
    global.Buffer = realBuffer
  })

  it('should return a base64 encoded string with prefix', () => {
    expect(encodeToBase64(originalPassword)).toMatch(/^{sasjs_encoded}/)
  })

  it('should return original string without any prefix', () => {
    const encodedPassword = encodeToBase64(originalPassword)
    expect(decodeFromBase64(encodedPassword)).toEqual(originalPassword)
  })

  it('should prefix the payload with 200 hex characters', () => {
    // decodeFromBase64 strips the prefix by fixed offset (substring(200)), so
    // the prefix length and alphabet are part of the stored-credential format.
    const encoded = encodeToBase64(originalPassword)
    const decoded = Buffer.from(
      encoded.replace('{sasjs_encoded}', ''),
      'base64'
    ).toString()
    expect(decoded.slice(0, 200)).toMatch(/^[0-9a-f]{200}$/)
    expect(decoded.slice(200)).toEqual(originalPassword)
  })

  it('should produce a different encoding on each call', () => {
    expect(encodeToBase64(originalPassword)).not.toEqual(
      encodeToBase64(originalPassword)
    )
  })

  it('should return a raw password as it is because decoded string does not start with prefix', () => {
    const rawPassword =
      'SabirByd3VQOWJSRzZkRUpqSnBuMnprcU5ONzlHcUNYMXpVQUtWYzFKRWF0MVlSWFBzRzdHRjJUM1I1VW8yRWRpUW05dVh2MHp5MGJ5WWVqeEQwbVJtQjZzWGZTY3dQSlJBMkJWQ3NhWndReFdGTlNIZVVNVmtha1NuQVpoUHgyWTczMEJiNFRINVNhQ0dXczI0ODNHM1VQdFZMWDJDb1VaTDRkYm1BMVVmU21VYVgzc3VHR2VaejE4UUZCNjZrZTIxUG9OSTBDd2FoZWxsby13b3JsZA=='
    expect(decodeFromBase64(rawPassword)).toEqual(rawPassword)
  })

  it('should round-trip a non-ASCII password', () => {
    // btoa is latin1, so a naive swap to the platform APIs corrupts this. The
    // password is stored, so a round trip has to survive the UTF-8 step.
    const password = 'passwoerd-日本語-ünïcode'

    expect(decodeFromBase64(encodeToBase64(password))).toEqual(password)
  })

  it('should round-trip without a Buffer global', () => {
    // The browser case: Buffer does not exist, and this module is reachable
    // from the package root, so no polyfill can be assumed.
    // @ts-expect-error - simulating a browser, which has no Buffer global
    delete global.Buffer

    const password = 'passwoerd-日本語'

    expect(decodeFromBase64(encodeToBase64(password))).toEqual(password)
  })

  it('should reference no Buffer in the module code', () => {
    const source = readFileSync(join(__dirname, '..', 'base64.ts'), 'utf8')
    const code = source
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')

    expect(code).not.toMatch(/\bBuffer\b/)
  })
})
