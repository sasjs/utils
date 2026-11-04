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
  siteId?: string
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
    apiServerUrl: 'http://127.0.0.1:5000',
    ...(options.siteId === undefined ? {} : { siteId: options.siteId })
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
    expect(parsed.SYSDATE).toMatch(/^\d{2}[A-Z]{3}\d{2}$/)
    expect(parsed.SYSTIME).toMatch(/^\d{2}:\d{2}$/)
    expect(parsed.MF_GETUSER).toEqual('testuser')
    expect(parsed.SYSUSERID).toEqual('507f1f77bcf86cd799439011')
    expect(parsed._PROGRAM).toEqual('/Public/app/myprogram')
    expect(parsed.SYSTCPIPHOSTNAME).toEqual('http://127.0.0.1:5000')
    // SAS has SYSSITE as a global macro variable; a JS program has no such
    // variable, so the host's site is what it reports, and 123 is the default.
    expect(parsed.SYSSITE).toEqual('123')
    expect(parsed.SYSCC).toEqual('0')
    expect(parsed.SYSPROCESSNAME).toEqual('NodeJS')
    expect(parsed.SYSVLONG).toEqual('v99.0.0')
    expect(parsed.END_DTTM).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/
    )
  })

  it('writes the dates in the SAS formats %mm_webout uses', () => {
    const { body, failure } = runBlock({
      body: `
webout('OPEN')
webout('CLOSE')`
    })

    expect(failure).toBeNull()

    const parsed = JSON.parse(body)

    // &SYSDATE is DATE7, &SYSTIME is TIME5: seven and five characters, not the
    // ten-character DATE9 and eight-character TIME8 a four-digit year and
    // seconds would produce.
    expect(parsed.SYSDATE).toMatch(/^\d{2}[A-Z]{3}\d{2}$/)
    expect(parsed.SYSTIME).toMatch(/^\d{2}:\d{2}$/)

    // END_DTTM is %sysfunc(datetime(),E8601DT26.6): local time, six fraction
    // digits, and no zone suffix - toISOString() wrote UTC with a trailing Z.
    expect(parsed.END_DTTM).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}$/
    )
    expect(parsed.END_DTTM.endsWith('Z')).toBe(false)

    // SYSCC is text: %mm_webout writes "&syscc", and a consumer comparing it to
    // '0' must not meet a number.
    expect(typeof parsed.SYSCC).toBe('string')
    expect(parsed.SYSCC).toEqual('0')
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
    expect(parsed.SYSCC).toEqual('8')
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
    expect(parsed.SYSCC).toEqual('0')
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

  it('reports the configured site as SYSSITE, and an empty one as empty', () => {
    const configured = runBlock({
      body: `
webout('OPEN')
webout('CLOSE')`,
      siteId: 'SITE1'
    })
    expect(configured.failure).toBeNull()
    expect(JSON.parse(configured.body).SYSSITE).toEqual('SITE1')

    // An explicit empty string is honoured: a host that has no site must not be
    // given the default.
    const none = runBlock({
      body: `
webout('OPEN')
webout('CLOSE')`,
      siteId: ''
    })
    expect(none.failure).toBeNull()
    expect(JSON.parse(none.body).SYSSITE).toEqual('')
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
    expect(parsed.SYSCC).toEqual('8')
  })

  it('resolves fs itself, so a host need not bind it, and says so when neither exists', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'sasjs-webout-fs-'))
    const weboutPath = path.join(dir, 'webout.txt')
    const headersPath = path.join(dir, 'stpsrv_header.txt')
    writeFileSync(weboutPath, '')
    writeFileSync(headersPath, 'content-type: text/html')

    const block = getWeboutPrelude({
      weboutPath,
      headersPath,
      program: '/Public/app/myprogram',
      debug: '',
      username: 'testuser',
      userId: '1',
      apiServerUrl: 'http://127.0.0.1:5000'
    })
    const source = `let _webout = '';
${block}
webout('OPEN')
webout('CLOSE')
${weboutFinaliseStatement}`
    const quietConsole = {
      log: () => undefined,
      error: () => undefined,
      warn: () => undefined
    }

    // A host that supplies require() but binds no fs: the block resolves it.
    const withRequire = new Function('require', 'console', 'process', source)
    expect(() => withRequire(require, quietConsole, process)).not.toThrow()
    expect(JSON.parse(readFileSync(weboutPath, 'utf-8')).MF_GETUSER).toEqual(
      'testuser'
    )

    // A host whose require('fs') is a stub makes the block fall through to a
    // usable binding rather than returning the stub.
    const viaFallback = new Function(
      'require',
      'console',
      'process',
      'fs',
      source
    )
    expect(() =>
      viaFallback(() => ({}), quietConsole, process, require('fs'))
    ).not.toThrow()
    expect(JSON.parse(readFileSync(weboutPath, 'utf-8')).MF_GETUSER).toEqual(
      'testuser'
    )
    // That host's require('os') is a stub too, so the host facts come from the
    // browser fallback - which in node answers nothing rather than throwing.
    expect(JSON.parse(readFileSync(weboutPath, 'utf-8')).SYSHOSTNAME).toEqual(
      ''
    )

    // A host that hands back a stub, and no usable binding either, hears what is
    // missing instead of "Cannot read properties of undefined".
    const viaStub = new Function('require', 'console', 'process', source)
    expect(() => viaStub(() => ({}), quietConsole, process)).toThrow(
      'webout(): this host provides no fs with writeFileSync and appendFileSync'
    )

    // Nothing at all, including a require that refuses.
    const withoutBoth = new Function('require', 'console', 'process', source)
    expect(() =>
      withoutBoth(
        () => {
          throw new Error('Cannot find module')
        },
        quietConsole,
        process
      )
    ).toThrow(
      'webout(): this host provides no fs with writeFileSync and appendFileSync'
    )
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

  it('sends showmeta beside the table, in the shape %mp_jsonout writes', () => {
    const { body, failure } = runBlock({
      body: `
const meta = { vars: {
  ID: { format: 'best.', label: 'Identifier', length: 8, type: 'num' },
  NAME: { format: '$8.', label: 'Name', length: 8, type: 'char' }
} }
webout('OPEN')
webout('OBJ', 'Users', [{ ID: 1, NAME: 'ann' }], { showmeta: meta })
webout('CLOSE')`
    })

    expect(failure).toBeNull()

    const parsed = JSON.parse(body)

    expect(parsed.Users).toEqual([{ ID: 1, NAME: 'ann' }])
    // %mp_jsonout prefixes the member with $ and lower-cases the label.
    expect(parsed.$users).toEqual({
      vars: {
        ID: { format: 'best.', label: 'Identifier', length: 8, type: 'num' },
        NAME: { format: '$8.', label: 'Name', length: 8, type: 'char' }
      }
    })
  })

  it('takes the options whatever case they are written in, as SAS does', () => {
    const { body, failure } = runBlock({
      body: `
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }, { a: 2 }, { a: 3 }], { MAXOBS: 2, ShowMeta: { vars: {} } })
webout('CLOSE')`
    })

    expect(failure).toBeNull()

    const parsed = JSON.parse(body)

    expect(parsed.rows).toEqual([{ a: 1 }, { a: 2 }])
    expect(parsed.$rows).toEqual({ vars: {} })
  })

  it('limits the rows with maxobs, and refuses an unknown option', () => {
    const limited = runBlock({
      body: `
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }, { a: 2 }, { a: 3 }], { maxobs: 1 })
webout('ARR', 'pairs', [[1, 2], [3, 4]], { maxobs: 1 })
webout('CLOSE')`
    })

    expect(limited.failure).toBeNull()

    const parsed = JSON.parse(limited.body)

    expect(parsed.rows).toEqual([{ a: 1 }])
    expect(parsed.pairs).toEqual([[1, 2]])

    // A name that is not an option at all must fail the call rather than send
    // every row - a typo has to be loud, or a truncated table looks complete.
    expect(
      String(
        runBlock({
          body: `
webout('OPEN')
webout('OBJ', 'rows', [], { maxRows: 1 })`
        }).failure
      )
    ).toContain("does not know the option 'maxRows'")

    expect(
      String(
        runBlock({
          body: `
webout('OPEN')
webout('OBJ', 'rows', [], { fmt: 'Y' })`
        }).failure
      )
    ).toContain('missing=, fmt= and dslabel= have no JS equivalent')

    expect(
      String(
        runBlock({
          body: `
webout('OPEN')
webout('OBJ', 'rows', [], { maxobs: 'many' })`
        }).failure
      )
    ).toContain('maxobs takes a whole number of rows')

    // A string of digits and a boolean both coerce to a number, so a wrong type
    // would silently truncate instead of failing.
    for (const value of ["'2'", 'true']) {
      expect(
        String(
          runBlock({
            body: `
webout('OPEN')
webout('OBJ', 'rows', [{ a: 1 }], { maxobs: ${value} })`
          }).failure
        )
      ).toContain('maxobs takes a whole number of rows as a number')
    }
  })

  it('validates the options before it writes the member', () => {
    // A rejected call must leave the body as it found it: a caller that catches
    // the error and closes would otherwise send a table with no metadata, which
    // reads as a complete response.
    const { body, printed } = runBlock({
      body: `
webout('OPEN')
try {
  webout('OBJ', 'rows', [{ a: 1 }], { showmeta: true })
} catch (err) {
  console.log('caught: ' + err.message.slice(0, 30))
}
webout('OBJ', 'after', [{ b: 2 }])
webout('CLOSE')`
    })

    const parsed = JSON.parse(body)

    expect(parsed.rows).toBeUndefined()
    expect(parsed.$rows).toBeUndefined()
    expect(parsed.after).toEqual([{ b: 2 }])
    expect(printed.join('\n')).toContain('caught: ')
  })

  it('refuses a showmeta it cannot read, rather than inventing one', () => {
    expect(
      String(
        runBlock({
          body: `
webout('OPEN')
webout('OBJ', 'rows', [], { showmeta: true })`
        }).failure
      )
    ).toContain('cannot read showmeta from the rows')

    expect(
      String(
        runBlock({
          body: `
webout('OPEN')
webout('OBJ', 'rows', [], { showmeta: [{ vars: {} }] })`
        }).failure
      )
    ).toContain('showmeta takes an object')
  })
})
