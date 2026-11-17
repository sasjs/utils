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
  fetchContext?: {
    params?: Record<string, any>
    tables?: Array<{ name: string; filename: string; csv: string | Buffer }>
  }
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
    '_sasjs_fetch_context',
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
        : undefined,
      options.fetchContext
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
  it.each([
    [false, 'upload'],
    [false, 'parameter'],
    [true, 'upload'],
    [true, 'parameter']
  ] as const)(
    'FETCH preserves all numeric missing states from a representative CSV fixture on browser=%s via %s',
    (browser, transport) => {
      // Representative adapter 6.1.2 output, checked separately against the
      // released converter. Numeric inputs: '.', '._', '.A'–'.Z', 'A', '.a',
      // null, '', 0. Character inputs include '.A', '.a', null, '', '.', 'Case'.
      const csv = [
        'N:best. C:$char8.',
        '.,.A',
        '._,',
        '.a,.a',
        '.b,',
        '.c,',
        '.d,',
        '.e,',
        '.f,',
        '.g,',
        '.h,',
        '.i,',
        '.j,',
        '.k,',
        '.l,',
        '.m,',
        '.n,',
        '.o,',
        '.p,',
        '.q,',
        '.r,',
        '.s,',
        '.t,',
        '.u,',
        '.v,',
        '.w,',
        '.x,',
        '.y,',
        '.z,',
        '.a,.A',
        '.a,',
        '.,.a',
        '.,.',
        '0,Case'
      ].join('\r\n')
      const expected = [
        { N: null, C: '.A' },
        { N: '._', C: '' },
        ...Array.from('abcdefghijklmnopqrstuvwxyz', (letter) => ({
          N: `.${letter}`,
          C: letter === 'a' ? '.a' : ''
        })),
        { N: '.a', C: '.A' },
        { N: '.a', C: '' },
        { N: null, C: '.a' },
        { N: null, C: '.' },
        { N: 0, C: 'Case' }
      ]
      const fetchContext =
        transport === 'upload'
          ? {
              tables: [
                {
                  name: 'T',
                  filename: 'T.csv',
                  csv: browser ? csv : Buffer.from(csv)
                }
              ]
            }
          : { params: { sasjs_tables: 'T', sasjs1data: csv } }
      const result = runBlock({
        browser,
        fetchContext,
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(result.failure).toBeNull()
      const rows = JSON.parse(result.body).T
      expect(
        new Set(rows.slice(0, 28).map(({ N }: { N: unknown }) => N)).size
      ).toBe(28)
      expect(rows).toEqual(expected)
    }
  )

  it.each([
    [false, 'upload'],
    [false, 'parameter'],
    [true, 'upload'],
    [true, 'parameter']
  ] as const)(
    'FETCH preserves uppercase numeric special missings from direct CSV on browser=%s via %s',
    (browser, transport) => {
      // Direct CSV input, not adapter output: the adapter emits numeric
      // special-missing letters in lowercase, even for uppercase inputs.
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
      const csv = [
        'N:best.',
        '.',
        '._',
        ...Array.from(letters, (c) => `.${c}`)
      ].join('\r\n')
      const fetchContext =
        transport === 'upload'
          ? {
              tables: [
                {
                  name: 'T',
                  filename: 'T.csv',
                  csv: browser ? csv : Buffer.from(csv)
                }
              ]
            }
          : { params: { sasjs_tables: 'T', sasjs1data: csv } }
      const result = runBlock({
        browser,
        fetchContext,
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(result.failure).toBeNull()
      const rows = JSON.parse(result.body).T
      expect(new Set(rows.map(({ N }: { N: unknown }) => N)).size).toBe(28)
      expect(rows).toEqual([
        { N: null },
        { N: '._' },
        ...Array.from(letters, (letter) => ({ N: `.${letter}` }))
      ])
    }
  )

  it.each([false, true])(
    'FETCH reads an uploaded adapter table on browser=%s',
    (browser) => {
      const csv = 'Name:$char20. Count:best.\r\n"a,b",2'
      const result = runBlock({
        browser,
        fetchContext: {
          tables: [
            {
              name: 'MixedCase',
              filename: 'table.csv',
              csv: browser ? csv : Buffer.from(csv)
            }
          ]
        },
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body)).toEqual({
        MixedCase: [{ Name: 'a,b', Count: 2 }]
      })
    }
  )

  it.each([false, true])(
    'FETCH joins repeated and numbered parameter chunks in order on browser=%s',
    (browser) => {
      const result = runBlock({
        browser,
        fetchContext: {
          params: {
            sasjs_tables: 'First Second',
            sasjs1data: ['Col:$8.\r\nhel', 'lo'],
            sasjs2data0: '2',
            sasjs2data1: 'N:best.\r\n',
            sasjs2data2: '42'
          }
        },
        body: `_webout = JSON.stringify(webout('fetch'))`
      })
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body)).toEqual({
        First: [{ Col: 'hello' }],
        Second: [{ N: 42 }]
      })
    }
  )

  it.each(['direct', 'numbered'])(
    'FETCH visits parameter keys linearly for many %s tables',
    (mode) => {
      const count = 100
      const params: Record<string, string> = {
        sasjs_tables: Array.from({ length: count }, (_, i) => `T${i + 1}`).join(
          ' '
        )
      }
      for (let i = 1; i <= count; i++) {
        if (mode === 'direct') params[`sasjs${i}data`] = 'X:best.\n1'
        else {
          params[`sasjs${i}data0`] = '1'
          params[`sasjs${i}data1`] = 'X:best.\n1'
        }
      }
      const result = runBlock({
        fetchContext: { params },
        body: `
const originalKeys = Object.keys, originalStartsWith = String.prototype.startsWith;
let keyVisits = 0, prefixChecks = 0;
Object.keys = function (obj) {
  const keys = originalKeys(obj);
  keyVisits += keys.length;
  return keys;
};
String.prototype.startsWith = function (prefix, ...args) {
  if (originalStartsWith.call(String(this).toLowerCase(), 'sasjs')) prefixChecks++;
  return originalStartsWith.call(this, prefix, ...args);
};
try {
  const fetched = webout('FETCH');
  _webout = JSON.stringify({ fetched, keyVisits, prefixChecks });
} finally {
  Object.keys = originalKeys;
  String.prototype.startsWith = originalStartsWith;
}`
      })
      expect(result.failure).toBeNull()
      const { fetched, keyVisits, prefixChecks } = JSON.parse(result.body)
      expect(Object.keys(fetched)).toHaveLength(count)
      expect(fetched.T100).toEqual([{ X: 1 }])
      expect(keyVisits).toBeLessThanOrEqual(Object.keys(params).length * 4)
      expect(prefixChecks).toBeLessThanOrEqual(Object.keys(params).length * 4)
    }
  )

  it.each([false, true])(
    'FETCH rejects extra numbered chunks on browser=%s',
    (browser) => {
      for (const extra of [
        'SASJS1DATA2',
        'sasjs1data01',
        'sasjs1data9007199254740993'
      ]) {
        const result = runBlock({
          browser,
          fetchContext: {
            params: {
              SASJS_TABLES: 'T',
              SaSjS1DaTa0: '1',
              sasjs1data1: 'X:best.\r\n1',
              [extra]: 'ignored'
            }
          },
          body: `webout('FETCH')`
        })
        expect(String(result.failure)).toContain('unexpected chunk')
      }
    }
  )

  it.each([
    { sasjs1data0: '2', sasjs1data1: 'X:best.\r\n' },
    { sasjs1data1: 'X:best.\r\n1' },
    { SASJS1DATA0: '1', SASJS1DATA1: 'X:best.\r\n1' }
  ])(
    'FETCH rejects direct and numbered parameter forms together %#',
    (chunks) => {
      const result = runBlock({
        fetchContext: {
          params: { sasjs_tables: 'T', sasjs1data: 'X:best.\r\n1', ...chunks }
        },
        body: `webout('FETCH')`
      })
      expect(String(result.failure)).toContain('ambiguous parameter')
    }
  )

  it.each(['X:best. X:best.\r\n1,2', 'X:best. x:best.\r\n1,2', 'x:$8. X:$8.'])(
    'FETCH rejects duplicate column names in header %s',
    (csv) => {
      for (const browser of [false, true]) {
        for (const fetchContext of [
          { tables: [{ name: 'T', filename: 't.csv', csv }] },
          { params: { sasjs_tables: 'T', sasjs1data: csv } }
        ]) {
          const result = runBlock({
            browser,
            fetchContext,
            body: `webout('FETCH')`
          })
          expect(String(result.failure)).toContain('duplicate column')
        }
      }
    }
  )

  it.each(['1e0', '0x1', '1.0', ' 1 ', true, ['1'], '9007199254740992'])(
    'FETCH rejects invalid chunk count representation %p',
    (count) => {
      const result = runBlock({
        fetchContext: {
          params: {
            sasjs_tables: 'T',
            sasjs1data0: count,
            sasjs1data1: 'X:best.\r\n1'
          }
        },
        body: `webout('FETCH')`
      })
      expect(String(result.failure)).toContain('invalid chunk count')
    }
  )

  it('FETCH keeps chunk validation scoped and preserves the first error', () => {
    const valid = runBlock({
      fetchContext: {
        params: {
          sasjs_tables: 'Same Same',
          sasjs1data: 'X:best.\n1',
          sasjs2data0: '1',
          sasjs2data1: ['X:best.\n', '2'],
          sasjs01data1: 'ignored',
          sasjs3data00: 'ignored'
        }
      },
      body: `_webout = JSON.stringify(webout('FETCH'))`
    })
    expect(valid.failure).toBeNull()
    expect(JSON.parse(valid.body)).toEqual({ Same: [{ X: 2 }] })

    const invalid = runBlock({
      fetchContext: {
        params: {
          sasjs_tables: 'T',
          sasjs1data0: '1',
          sasjs1data3: '',
          sasjs1data02: '',
          sasjs1data1: 'X:best.\n1'
        }
      },
      body: `webout('FETCH')`
    })
    expect(String(invalid.failure)).toContain(
      'unexpected chunk sasjs1data3 for T'
    )
  })

  it('FETCH accepts ten and eleven chunks without confusing table indexes', () => {
    const params: Record<string, string> = {
      sasjs_tables: Array.from({ length: 11 }, (_, i) => `T${i + 1}`).join(' ')
    }
    for (let table = 1; table <= 11; table++) {
      if (table === 1 || table === 10) {
        const count = table === 1 ? 10 : 11
        params[`sasjs${table}data0`] = String(count)
        for (let chunk = 1; chunk <= count; chunk++)
          params[`sasjs${table}data${chunk}`] = chunk === 1 ? 'X:best.\r\n' : ''
        params[`sasjs${table}data${count}`] = String(table)
      } else params[`sasjs${table}data`] = `X:best.\r\n${table}`
    }
    const result = runBlock({
      fetchContext: { params },
      body: `_webout = JSON.stringify(webout('FETCH'))`
    })
    expect(result.failure).toBeNull()
    expect(JSON.parse(result.body).T1).toEqual([{ X: 1 }])
    expect(JSON.parse(result.body).T10).toEqual([{ X: 10 }])
    expect(JSON.parse(result.body).T11).toEqual([{ X: 11 }])
  })

  it.each(['bad-name', '1bad', 'bad.name', 'x'.repeat(33)])(
    'FETCH rejects invalid adapter-looking column name %s',
    (column) => {
      for (const browser of [false, true]) {
        const csv = `${column}:$char4.\r\ntext`
        for (const fetchContext of [
          { tables: [{ name: 'T', filename: 't.csv', csv }] },
          { params: { sasjs_tables: 'T', sasjs1data: csv } }
        ]) {
          const result = runBlock({
            browser,
            fetchContext,
            body: `webout('FETCH')`
          })
          expect(String(result.failure)).toContain('invalid column name')
        }
      }
    }
  )

  it.each([':$char4.', 'bad name:$char4.', 'A:best. bad-name:$char4.'])(
    'FETCH rejects malformed adapter-looking header %s',
    (header) => {
      const result = runBlock({
        fetchContext: {
          tables: [{ name: 'T', filename: 't.csv', csv: `${header}\r\ntext` }]
        },
        body: `webout('FETCH')`
      })
      expect(result.failure).not.toBeNull()
    }
  )

  it('FETCH bounds regex inputs when detecting an adversarial upload header', () => {
    const csv = 'A:' + '1'.repeat(40000) + '!'
    const result = runBlock({
      fetchContext: { tables: [{ name: 'raw', filename: 'raw.txt', csv }] },
      body: `
const originalExec = RegExp.prototype.exec;
RegExp.prototype.exec = function (input) {
  // The single-character newline search is linear; no header-detection regex
  // may receive the full adversarial line and backtrack over it.
  if (input.length > 1024 && this.source !== '[\\\\r\\\\n]')
    throw new Error('unbounded regex input in upload header detection');
  return originalExec.call(this, input);
};
try { _webout = JSON.stringify(webout('FETCH')); }
finally { RegExp.prototype.exec = originalExec; }`
    })
    expect(result.failure).toBeNull()
    expect(JSON.parse(result.body)).toEqual({})
  })

  it.each([
    [':$char4.', 'invalid header'],
    ['bad,name:8.', null],
    ['bad:name:8.', null],
    ['bad-name:8.,rest', 'invalid column name'],
    ['A:date9,other', 'unsupported informat'],
    ['A:date9!', null]
  ])('FETCH preserves upload signature boundaries for %s', (header, error) => {
    const result = runBlock({
      fetchContext: {
        tables: [{ name: 'T', filename: 't.csv', csv: `${header}\nvalue` }]
      },
      body: `_webout = JSON.stringify(webout('FETCH'))`
    })
    if (error) expect(String(result.failure)).toContain(error)
    else {
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body)).toEqual({})
    }
  })

  it('FETCH skips raw uploads but rejects malformed adapter-looking tables', () => {
    const raw = {
      name: 'file',
      filename: 'notes.csv',
      csv: 'name,value\r\na,b'
    }
    const yaml = {
      name: 'config',
      filename: 'settings.yml',
      csv: 'title:hello\nvalue:world'
    }
    const good = { name: 'table', filename: 'table.csv', csv: 'Id:8.\r\n5' }
    const result = runBlock({
      fetchContext: { tables: [raw, yaml, good] },
      body: `_webout = JSON.stringify(webout('FETCH'))`
    })
    expect(result.failure).toBeNull()
    expect(JSON.parse(result.body)).toEqual({ table: [{ Id: 5 }] })
    const invalid = runBlock({
      fetchContext: { tables: [{ ...good, csv: 'Id:best.\r\n"broken' }] },
      body: `webout('FETCH')`
    })
    expect(String(invalid.failure)).toContain('unterminated quote')
    const format = runBlock({
      fetchContext: { tables: [{ ...good, csv: 'Id:comma12.\r\n1,234' }] },
      body: `webout('FETCH')`
    })
    expect(String(format.failure)).toContain('unsupported informat comma12.')
    const header = runBlock({
      fetchContext: { tables: [{ ...good, csv: 'Id:best\r\n1' }] },
      body: `webout('FETCH')`
    })
    expect(String(header.failure)).toContain('unsupported informat best')
  })

  it.each([false, true])(
    'FETCH reads adapter best32. uploads on browser=%s',
    (browser) => {
      // Generated by adapter convertToCSV with a $T formats override.
      const csv = 'A:best32.\r\n1234\r\n12.34'
      const result = runBlock({
        browser,
        fetchContext: { tables: [{ name: 'T', filename: 't.csv', csv }] },
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body)).toEqual({
        T: [{ A: 1234 }, { A: 12.34 }]
      })
    }
  )

  it.each([false, true])(
    'FETCH applies adapter 8.2 decimals on browser=%s',
    (browser) => {
      // First two rows generated by adapter convertToCSV; exponent verifies w.d semantics.
      const csv = 'A:8.2\r\n1234\r\n12.34\r\n1e2\r\n1.0e2'
      const result = runBlock({
        browser,
        fetchContext: { tables: [{ name: 'T', filename: 't.csv', csv }] },
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body)).toEqual({
        T: [{ A: 12.34 }, { A: 12.34 }, { A: 1 }, { A: 100 }]
      })
    }
  )

  it('FETCH rejects unsupported adapter-looking uploads without a period', () => {
    const result = runBlock({
      fetchContext: {
        tables: [{ name: 'T', filename: 't.csv', csv: 'D:date9\r\n01JAN2020' }]
      },
      body: `webout('FETCH')`
    })
    expect(String(result.failure)).toContain('unsupported informat date9')
  })

  it('FETCH rejects a 10 MiB hostile numeric cell without applying an unbounded numeric regex', () => {
    const csv = 'N:best.\n' + '1'.repeat(10 * 1024 * 1024) + '!'
    const result = runBlock({
      fetchContext: { tables: [{ name: 'T', filename: 't.csv', csv }] },
      body: `
const originalExec = RegExp.prototype.exec;
RegExp.prototype.exec = function (input) {
  // These two fixed-width character tests cannot backtrack over the input.
  if (input.length > 1024 && this.source !== '[\\\\r\\\\n]' && this.source !== '^\\\\.[a-z_]$')
    throw new Error('unbounded numeric regex received a hostile cell');
  return originalExec.call(this, input);
};
try { webout('FETCH'); }
finally { RegExp.prototype.exec = originalExec; }`
    })
    expect(String(result.failure)).toContain('unsupported numeric value')
  })

  it.each([false, true])(
    'FETCH preserves numeric grammar on browser=%s',
    (browser) => {
      const values = [
        '+1',
        '-2',
        '1.',
        '.5',
        '-.5',
        '1.25E+2',
        '1e-2',
        '  ._  ',
        '.',
        ''
      ]
      const result = runBlock({
        browser,
        fetchContext: {
          tables: [
            {
              name: 'T',
              filename: 't.csv',
              csv: 'N:best.\n' + values.join('\n')
            }
          ]
        },
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body).T).toEqual(
        [1, -2, 1, 0.5, -0.5, 125, 0.01, '._', null, null].map((N) => ({ N }))
      )
      for (const value of [
        '+',
        '-.',
        '1e',
        '1e+',
        '1..0',
        '0x1',
        'Infinity',
        'NaN'
      ]) {
        const invalid = runBlock({
          browser,
          fetchContext: {
            tables: [{ name: 'T', filename: 't.csv', csv: `N:best.\n${value}` }]
          },
          body: `webout('FETCH')`
        })
        expect(String(invalid.failure)).toContain('unsupported numeric value')
      }
    }
  )

  it.each(['1e999', '-1e999'])(
    'FETCH rejects overflowing numeric value %s',
    (value) => {
      const result = runBlock({
        fetchContext: {
          tables: [{ name: 'T', filename: 't.csv', csv: `N:best.\r\n${value}` }]
        },
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(String(result.failure)).toContain('unsupported numeric value')
    }
  )

  it.each([false, true])(
    'FETCH resolves macro parameter names case-insensitively on browser=%s',
    (browser) => {
      const result = runBlock({
        browser,
        fetchContext: {
          params: {
            SASJS_TABLES: 'First Second',
            SaSjS1DaTa: ['X:best.\r\n', '7'],
            SaSjS2DaTa0: '2',
            SASJS2DATA1: 'Y:$8.\r\n',
            sasjs2DaTa2: 'ok'
          }
        },
        body: `_webout = JSON.stringify(webout('FETCH'))`
      })
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body)).toEqual({
        First: [{ X: 7 }],
        Second: [{ Y: 'ok' }]
      })
    }
  )

  it.each([
    { sasjs_tables: 'T', SASJS_TABLES: 'T', sasjs1data: 'A:8.\r\n1' },
    { sasjs_tables: 'T', sasjs1data: 'A:8.\r\n1', SASJS1DATA: 'A:8.\r\n1' },
    {
      sasjs_tables: 'T',
      sasjs1data0: '1',
      SASJS1DATA0: '1',
      sasjs1data1: 'A:8.\r\n1'
    },
    {
      sasjs_tables: 'T',
      sasjs1data0: '1',
      sasjs1data1: 'A:8.\r\n1',
      SASJS1DATA1: 'A:8.\r\n1'
    }
  ])('FETCH rejects case-colliding macro parameters %#', (params) => {
    for (const keys of [Object.keys(params), Object.keys(params).reverse()]) {
      const reversed = Object.fromEntries(
        keys.map((key) => [
          key,
          (params as Record<string, string | undefined>)[key]
        ])
      )
      const result = runBlock({
        fetchContext: { params: reversed },
        body: `webout('FETCH')`
      })
      expect(String(result.failure)).toContain('ambiguous parameter')
    }
  })

  it.each(['date9.2', 'date9.', 'comma12.2', 'best33.', '33.2', '8.32'])(
    'FETCH rejects unsupported informat %s in uploads and explicit parameter tables',
    (informat) => {
      const csv = `D:${informat}\r\n1234`
      for (const fetchContext of [
        { tables: [{ name: 'T', filename: 't.csv', csv }] },
        { params: { sasjs_tables: 'T', sasjs1data: csv } }
      ]) {
        expect(
          String(runBlock({ fetchContext, body: `webout('FETCH')` }).failure)
        ).toContain(`unsupported informat ${informat}`)
      }
    }
  )

  it('FETCH parses 8.2 in explicit parameter tables without mutating the context', () => {
    const params = { sasjs_tables: 'T', sasjs1data: 'A:8.2\r\n1234\r\n12.34' }
    const result = runBlock({
      fetchContext: { params },
      body: `_webout = JSON.stringify(webout('FETCH'))`
    })
    expect(result.failure).toBeNull()
    expect(JSON.parse(result.body)).toEqual({ T: [{ A: 12.34 }, { A: 12.34 }] })
    expect(params.sasjs1data).toBe('A:8.2\r\n1234\r\n12.34')
  })

  it('FETCH rejects malformed quote placement in adapter CSV', () => {
    for (const body of ['ab"cd', '"abc"suffix', '"abc""']) {
      const result = runBlock({
        fetchContext: {
          tables: [
            { name: 'Rows', filename: 'rows.csv', csv: `Col:$8.\r\n${body}` }
          ]
        },
        body: `webout('FETCH')`
      })
      expect(String(result.failure)).toMatch(/quote/i)
    }
  })

  it.each([false, true])(
    'FETCH decodes CSV values and keeps inputs and calls independent on browser=%s',
    (browser) => {
      const csv =
        'Text:$CHAR40. Amount:best. Other:8.\r\n"line 1\r\nline 2, ""quoted""",-1.25e2,.a\r\n,.,.\r\nempty,2,.Z'
      const context = {
        tables: [{ name: 'MiXeD', filename: 'ignored.csv', csv }]
      }
      const result = runBlock({
        browser,
        fetchContext: context,
        body: `
const first = webout('FETCH');
first.MiXeD[0].Text = 'changed';
_webout = JSON.stringify(webout('FETCH'));`
      })
      expect(result.failure).toBeNull()
      expect(JSON.parse(result.body)).toEqual({
        MiXeD: [
          { Text: 'line 1\r\nline 2, "quoted"', Amount: -125, Other: '.a' },
          { Text: '', Amount: null, Other: null },
          { Text: 'empty', Amount: 2, Other: '.Z' }
        ]
      })
      expect(context.tables[0].csv).toBe(csv)
    }
  )

  it.each([false, true])(
    'FETCH keeps dangerous names as data and chooses last duplicate on browser=%s',
    (browser) => {
      const tables = Array.from({ length: 12 }, (_, i) => ({
        name: `TaBle${i}`,
        filename: `${i}.csv`,
        csv: 'VaL:$8.\r\nx'
      }))
      tables.push({
        name: '__proto__',
        filename: 'p.csv',
        csv: '__proto__:$8. constructor:$8.\r\nsafe,value'
      })
      tables.push({
        name: 'constructor',
        filename: 'c.csv',
        csv: 'Value:best.\r\n1'
      })
      tables.push({
        name: 'TaBle0',
        filename: 'duplicate.csv',
        csv: 'VaL:$8.\r\nlast'
      })
      const result = runBlock({
        browser,
        fetchContext: { tables },
        body: `
const fetched = webout('FETCH');
if (Object.getPrototypeOf(fetched) !== null || Object.getPrototypeOf(fetched.__proto__[0]) !== null) throw Error('unsafe prototypes');
_webout = JSON.stringify(fetched);`
      })
      expect(result.failure).toBeNull()
      const parsed = JSON.parse(result.body)
      expect(Object.keys(parsed)).toHaveLength(14)
      expect(parsed.TaBle11).toEqual([{ VaL: 'x' }])
      expect(parsed.TaBle0).toEqual([{ VaL: 'last' }])
      expect(parsed.__proto__).toEqual([
        JSON.parse('{"__proto__":"safe","constructor":"value"}')
      ])
      expect(parsed.constructor).toEqual([{ Value: 1 }])
    }
  )

  it('FETCH defaults an absent lexical context to empty', () => {
    const prelude = getWeboutPrelude({
      weboutPath: 'unused',
      headersPath: 'unused',
      program: '',
      debug: '',
      username: '',
      userId: '',
      apiServerUrl: ''
    })
    const run = new Function(
      'require',
      'console',
      prelude + `\nreturn webout('FETCH')`
    )
    const result = run(require, { log() {}, warn() {}, error() {} })
    expect(Object.keys(result)).toEqual([])
  })

  it('FETCH refuses missing chunks, bad row widths and invalid numeric values', () => {
    const cases = [
      {
        params: {
          sasjs_tables: 'T',
          sasjs1data0: '2',
          sasjs1data1: 'A:best.\r\n'
        }
      },
      { tables: [{ name: 'T', filename: 't.csv', csv: 'A:best. B:8.\r\n1' }] },
      {
        tables: [{ name: 'T', filename: 't.csv', csv: 'A:8.\r\nnot-a-number' }]
      }
    ]
    for (const fetchContext of cases)
      expect(
        runBlock({ fetchContext, body: `webout('FETCH')` }).failure
      ).not.toBeNull()
  })

  it('FETCH gives parameter tables precedence and never executes hostile input', () => {
    const hostile = `'; globalThis.fetchPwned = true; //`
    const context = {
      params: { sasjs_tables: ['Dup'], sasjs1data: ['X:$100.\r\n', hostile] },
      tables: [{ name: 'Dup', filename: 'x.csv', csv: 'X:$4.\r\nold' }]
    }
    const result = runBlock({
      fetchContext: context,
      body: `
const fetched = webout('FETCH');
if (globalThis.fetchPwned) throw Error('request executed');
_webout = JSON.stringify(fetched);`
    })
    expect(result.failure).toBeNull()
    expect(JSON.parse(result.body)).toEqual({ Dup: [{ X: hostile }] })
    expect(context.params.sasjs1data).toEqual(['X:$100.\r\n', hostile])
  })

  it('FETCH preserves adapter empty-row versus header-only semantics', () => {
    const tables = [
      { name: 'NoRows', filename: 'a.csv', csv: 'Col:$8.' },
      { name: 'EmptyRow', filename: 'b.csv', csv: 'Col:$8.\r\n' },
      { name: 'TwoRows', filename: 'c.csv', csv: 'Col:$8.\r\nx\r\n' }
    ]
    const result = runBlock({
      fetchContext: { tables },
      body: `_webout = JSON.stringify(webout('FETCH'))`
    })
    expect(result.failure).toBeNull()
    expect(JSON.parse(result.body)).toEqual({
      NoRows: [],
      EmptyRow: [{ Col: '' }],
      TwoRows: [{ Col: 'x' }, { Col: '' }]
    })
  })

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
