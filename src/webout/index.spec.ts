import { createHash } from 'crypto'
import { appendFileSync, mkdtempSync, readFileSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import path from 'path'
import { getWeboutPrelude, weboutFinaliseStatement } from '.'

/**
 * The block is emitted INTO the generated program, so the only honest test is to
 * run the emitted text: every case below builds the program the way a host does
 * (paths, literals), executes it, and asserts on the files the response is built
 * from.
 *
 * `new Function` is given a `globalThis` of its own, because the block publishes
 * `webout` there and a real one would leak between cases.
 */
const runBlock = (options: {
  body: string
  browser?: boolean
  rawWebout?: string
  seedHeader?: string
}) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'sasjs-webout-'))
  const weboutPath = path.join(dir, 'webout.txt')
  const headersPath = path.join(dir, 'stpsrv_header.txt')

  writeFileSync(weboutPath, '')
  writeFileSync(
    headersPath,
    options.seedHeader ?? 'content-type: text/html; charset=utf-8'
  )

  const block = getWeboutPrelude({
    weboutPath,
    headersPath,
    program: '/Public/app/myprogram',
    debug: '',
    username: 'testuser',
    userId: '507f1f77bcf86cd799439011',
    apiServerUrl: 'http://127.0.0.1:5000'
  })

  const printed: string[] = []
  const consoleShim = {
    log: (message: string) => printed.push(String(message)),
    error: (...args: any[]) => printed.push('error: ' + args.join(' ')),
    warn: (...args: any[]) => printed.push('warn: ' + args.join(' '))
  }

  // In the browser the host owns both: `fs` is backed by its virtual drive and
  // `require` answers only what it was taught, which is not `os`.
  const fileShim = options.browser
    ? {
        writeFileSync: (file: string, data: string) =>
          writeFileSync(file, data),
        appendFileSync: (file: string, data: string) =>
          appendFileSync(file, data)
      }
    : require('fs')

  const requireShim = options.browser
    ? (name: string) => {
        throw new Error(
          `Cannot find module '${name}' in the browser runtime host`
        )
      }
    : require

  const fn = new Function(
    'require',
    'console',
    'process',
    'fs',
    'location',
    'navigator',
    `let _webout = '';
${block}
${options.body}
${options.rawWebout === undefined ? '' : `_webout = ${JSON.stringify(options.rawWebout)};`}
${weboutFinaliseStatement}`
  )

  let failure: any = null
  try {
    fn(
      requireShim,
      consoleShim,
      { pid: 4242, version: 'v99.0.0', platform: 'linux' },
      fileShim,
      options.browser ? { hostname: 'app.example.com' } : undefined,
      options.browser
        ? { userAgent: 'MockBrowser/1.0', deviceMemory: 8 }
        : undefined
    )
  } catch (err: any) {
    failure = err
  }

  return {
    failure,
    printed,
    weboutApi: (global as any).webout,
    body: readFileSync(weboutPath, 'utf-8'),
    headers: readFileSync(headersPath, 'utf-8')
  }
}

describe('the webout() prelude', () => {
  it('writes one JSON object, with the content type set', () => {
    const { body, headers, failure } = runBlock({
      body: `
webout('OPEN')
webout('OBJ', 'users', [{ name: 'ann' }, { name: 'bob' }])
webout('ARR', 'pairs', [[1, 2], [3, 4]])
webout('CLOSE')`
    })

    expect(failure).toBeNull()

    // The seed line must stay readable on its own: OPEN appends, and the seed
    // carries no trailing newline.
    expect(headers.split('\n')[0]).toEqual(
      'content-type: text/html; charset=utf-8'
    )
    expect(headers).toContain('content-type: application/json')

    const parsed = JSON.parse(body)

    expect(parsed.users).toEqual([{ name: 'ann' }, { name: 'bob' }])
    expect(parsed.pairs).toEqual([
      [1, 2],
      [3, 4]
    ])
    expect(parsed.SYSDATE).toMatch(/^\d{2}[A-Z]{3}\d{4}$/)
    expect(parsed.SYSTIME).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    expect(parsed.MF_GETUSER).toEqual('testuser')
    expect(parsed.SYSUSERID).toEqual('507f1f77bcf86cd799439011')
    expect(parsed._PROGRAM).toEqual('/Public/app/myprogram')
    expect(parsed.SYSTCPIPHOSTNAME).toEqual('http://127.0.0.1:5000')
    expect(parsed.SYSCC).toEqual(0)
    expect(parsed.SYSPROCESSNAME).toEqual('NodeJS')
    expect(parsed.SYSVLONG).toEqual('v99.0.0')
    expect(parsed.END_DTTM).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })

  it('carries the last console error and warning, as SAS carries the last one', () => {
    const { body } = runBlock({
      body: `
console.warn('first warning')
console.warn('second warning')
console.error('the failure that matters')
webout('OPEN')
webout('CLOSE')`
    })

    const parsed = JSON.parse(body)

    // SAS keeps the LAST message the engine recorded.
    expect(parsed.SYSWARNINGTEXT).toEqual('second warning')
    expect(parsed.SYSERRORTEXT).toEqual('the failure that matters')
    // An error logged before CLOSE raises SYSCC the way the SAS engine does;
    // a warning alone does not.
    expect(parsed.SYSCC).toEqual(8)
  })

  it('leaves SYSCC at 0 when only warnings were logged, and still forwards them', () => {
    const { body, printed } = runBlock({
      body: `
console.warn('just a warning')
webout('OPEN')
webout('CLOSE')`
    })

    const parsed = JSON.parse(body)

    expect(parsed.SYSWARNINGTEXT).toEqual('just a warning')
    expect(parsed.SYSERRORTEXT).toEqual('')
    expect(parsed.SYSCC).toEqual(0)
    // The console tap must not swallow the program's own output.
    expect(printed).toContain('warn: just a warning')
  })

  it('keeps the tail of a long message rather than all of it', () => {
    const longMessage = 'x'.repeat(5000) + 'THE-CAUSE'

    const { body } = runBlock({
      body: `
console.error(${JSON.stringify(longMessage)})
webout('OPEN')
webout('CLOSE')`
    })

    const parsed = JSON.parse(body)

    expect(parsed.SYSERRORTEXT.length).toEqual(2000)
    expect(parsed.SYSERRORTEXT.endsWith('THE-CAUSE')).toEqual(true)
  })

  it('escapes the values it inlines, so a hostile name cannot run as code', () => {
    const marker = createHash('sha256').update('webout-hostile').digest('hex')
    const hostile = `'; require('child_process').execSync('echo ${marker}'); //`

    const dir = mkdtempSync(path.join(tmpdir(), 'sasjs-webout-escape-'))
    const weboutPath = path.join(dir, 'webout.txt')
    const headersPath = path.join(dir, 'stpsrv_header.txt')
    writeFileSync(weboutPath, '')
    writeFileSync(headersPath, 'content-type: text/html')

    const block = getWeboutPrelude({
      weboutPath,
      headersPath,
      program: '/Public/app/myprogram',
      debug: '',
      username: hostile,
      userId: '1',
      apiServerUrl: 'http://127.0.0.1:5000'
    })

    const fn = new Function(
      'require',
      'console',
      'process',
      'fs',
      `let _webout = '';
${block}
webout('OPEN')
webout('CLOSE')
${weboutFinaliseStatement}`
    )

    expect(() =>
      fn(
        require,
        { log: () => undefined, error: () => undefined, warn: () => undefined },
        process,
        require('fs')
      )
    ).not.toThrow()

    // The value arrives as a string, not as code that ran.
    expect(JSON.parse(readFileSync(weboutPath, 'utf-8')).MF_GETUSER).toEqual(
      hostile
    )
  })

  it('falls back to the browser for the host facts', () => {
    const { body, failure } = runBlock({
      browser: true,
      body: `
console.error('browser error')
webout('OPEN')
webout('CLOSE')`
    })

    expect(failure).toBeNull()

    const parsed = JSON.parse(body)

    expect(parsed.SYSHOSTNAME).toEqual('app.example.com')
    expect(parsed.SYSHOSTINFOLONG).toEqual('MockBrowser/1.0')
    expect(parsed.SYSSCPL).toEqual('browser')
    expect(parsed.SYSVLONG).toEqual('browser')
    expect(parsed.SYSPROCESSNAME).toEqual('Browser')
    expect(parsed.MEMSIZE).toEqual('8.0G')
    // Nothing in a browser host to report for these.
    expect(parsed.SYSENCODING).toEqual('utf-8')
    expect(parsed.SYSERRORTEXT).toEqual('browser error')
    expect(parsed.SYSCC).toEqual(8)
  })

  it('writes a program that only assigns _webout, and reports mixing the two', () => {
    const plain = runBlock({ body: '', rawWebout: '<h1>raw</h1>' })

    expect(plain.failure).toBeNull()
    expect(plain.body).toEqual('<h1>raw</h1>')
    expect(plain.headers).toEqual('content-type: text/html; charset=utf-8')

    const mixed = runBlock({
      body: `
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }])
webout('CLOSE')`,
      rawWebout: 'assigned as well'
    })

    expect(JSON.parse(mixed.body).rows).toEqual([{ a: 1 }])
    expect(mixed.printed.join(' ')).toContain('the assignment is ignored')
  })

  it('reports an unfinished envelope without closing it', () => {
    const { body, printed } = runBlock({
      body: `
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }])`
    })

    expect(printed.join(' ')).toContain("webout('CLOSE') was not")
    expect(() => JSON.parse(body)).toThrow()
  })

  it('names a duplicate CLOSE, and refuses OPEN after CLOSE', () => {
    const duplicate = runBlock({
      body: `
webout('OPEN')
webout('CLOSE')
webout('CLOSE')`
    })

    expect(String(duplicate.failure)).toContain('has already been called')

    const reopen = runBlock({
      body: `
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }])
webout('CLOSE')
webout('OPEN')`
    })

    expect(String(reopen.failure)).toContain("cannot follow webout('CLOSE')")
    expect(JSON.parse(reopen.body).rows).toEqual([{ a: 1 }])
  })

  it('refuses a table outside OPEN/CLOSE, and rows of the wrong shape', () => {
    expect(
      String(runBlock({ body: `webout('OBJ', 'rows', [])` }).failure)
    ).toContain("requires webout('OPEN') first")

    expect(
      String(
        runBlock({
          body: `
webout('OPEN')
webout('ARR', 'rows', [{ a: 1 }])`
        }).failure
      )
    ).toContain("webout('ARR') takes positional rows")

    expect(
      String(
        runBlock({
          body: `
webout('OPEN')
webout('OBJ', 'rows', [[1, 2]])`
        }).failure
      )
    ).toContain("webout('OBJ') takes rows keyed by column name")

    expect(String(runBlock({ body: `webout('SEND')` }).failure)).toContain(
      'use OPEN, ARR, OBJ or CLOSE'
    )
  })
})
