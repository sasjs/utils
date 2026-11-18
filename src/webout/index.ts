/**
 * The `webout()` block, generated into the top of every JS stored program.
 *
 * It mirrors `%ms_webout()` in @sasjs/core, so a JS program is laid out the way
 * a SAS one is:
 *
 *     webout('OPEN')
 *     webout('ARR', 'mytable', rowsOfArrays)
 *     webout('OBJ', 'mytable', rowsOfObjects)
 *     webout('CLOSE')
 *
 * `OPEN` truncates the response body, starts one JSON object and appends
 * `content-type: application/json` to the response headers. `ARR` and `OBJ`
 * append one named member each - rows positional for `ARR`, keyed by column
 * name for `OBJ`, which is how `%mp_jsonout()` shapes them. `CLOSE` appends the
 * system block and closes the object.
 *
 * `webout('FETCH')` reads adapter input tables without affecting response state.
 * The host declares `const _sasjs_fetch_context = { params, tables }` in the same
 * lexical scope as this prelude. `params` holds form fields (including repeated
 * fields as ordered arrays), and `tables` holds `{ name, filename, csv }` uploads;
 * `csv` is a UTF-8 Node Buffer or a browser string. Omit the binding for no
 * inputs. Hosts must pass request data as values, not generated executable code.
 *
 * FETCH returns fresh null-prototype objects and row arrays, preserving table and
 * column casing and decoded values. Upload field `name` is the table name, not
 * `filename`. Uploads are parsed before parameter tables in `sasjs_tables` order;
 * exact duplicate names are last-wins. Parameter tables use `sasjs{N}data`, or
 * `sasjs{N}data0` as chunk count and `sasjs{N}data1..N` in order. Array-valued
 * chunks are joined without separators. Parameter names are case-insensitive;
 * case-colliding names, mixed direct and numbered forms, and missing, extra or
 * noncanonical chunks throw. Duplicate or invalid SAS column names also throw,
 * ignoring case when detecting duplicates.
 *
 * Uploads without a `name:informat` adapter-like header token are skipped, so
 * normal files remain usable. This is necessarily heuristic: an arbitrary file
 * containing that pattern in its first line is indistinguishable from an adapter
 * table and is parsed or rejected. A format-looking token contains a dot or digit, starts
 * with `$`, or is `best`. Explicit parameter tables are always parsed. Supported
 * informats are `$charN.`, `$N.`, `best.`, `bestN.`, `N.`, and `N.d`
 * (case-insensitive); numeric widths are 1-32 and d is 0-31. Unsupported
 * informats, malformed CSV and nonnumeric or nonfinite numeric cells throw.
 * Character values are strings; numeric cells are numbers, empty or `.` becomes
 * null, and `.a`-`.z` / `._` remain strings (with the CSV's letter case). Thus
 * all 28 SAS numeric missing states have distinct JS values: ordinary `.` is
 * null, and `._` and `.A`-`.Z` are represented by their dot strings. The adapter
 * writes special numeric missings in lowercase, so their original JS spelling
 * and case cannot be recovered. With adapter `best.` serialization, numeric
 * null, empty string and `.` all produce `.`; character null and empty string
 * both produce an empty string. FETCH rows contain no column-type metadata, so
 * a character string such as `.a` is indistinguishable from numeric missing
 * `.A` without an external schema. This is a representation of decoded values,
 * not a guarantee of full SAS runtime input, type or formatting semantics.
 * For N.d, values without a decimal point are divided by 10 to the power d, as
 * in SAS modified list input.
 * Quoted commas, doubled quotes and embedded newlines work. FETCH discards
 * zero-length physical records between record separators (CRLF, LF or CR).
 * A final separator is a terminator, not another row. Consequently an adapter
 * one-column empty row encoded as a blank record is lost, including an intended
 * trailing empty row. A quoted empty field (`""`), whitespace-only field, or
 * record containing a comma is not a blank physical record and is retained.
 * Numeric `.` and special missing tokens remain explicit records. This policy
 * differs from SAS infile DSD, which can read a blank physical record as an
 * observation. A header without any line break means no rows.
 *
 * A table call takes a fourth argument, an options object, for the parts of
 * `%ms_webout()` that carry over to a JS row: `maxobs` limits the rows sent,
 * and `showmeta` travels beside the table as `$<name>` in the `{ vars: {...} }`
 * shape `%mp_jsonout()` writes from the dictionary tables - pass the metadata
 * itself, because a JS program has no dictionary to read formats from. The
 * other `%ms_webout()` arguments are deliberately absent: `fmt=` and `missing=`
 * exist to render SAS formats and special missing values into a value, which a
 * JS row already is, and `dslabel=` IS the member name.
 *
 * The block is emitted INTO the program rather than required from a file, which
 * is the same choice `sasjs compile` makes when it embeds the macros a SAS
 * service declares: the program runs on any host that can run it, a person
 * reading the session log can see exactly what ran, and a host needs no module
 * resolution of its own. Two hosts consume this source and must not diverge -
 * sasjs/server's `createJSProgram` and the sasjs/cli mock runtime - which is why
 * it lives here rather than in either of them.
 */
export interface WeboutPreludeConfig {
  /** Absolute path of the response body file for this run. */
  weboutPath: string
  /** Absolute path of the header file the session seeds with text/html. */
  headersPath: string
  /** The `_program` value the program was called with. */
  program: string
  /** The `_debug` value the program was called with. */
  debug: string
  /** The signed-in user's username. */
  username: string
  /** The signed-in user's id. */
  userId: string
  /** The address the program is running on, for SYSTCPIPHOSTNAME. */
  apiServerUrl: string
  /**
   * What programs see as SYSSITE - the site a licence key is issued for.
   *
   * SAS has this as a global macro variable set on the server, so a SAS service
   * reads it without being told anything. A JS program has no such variable, so
   * the host passes its configured site in here; the default is `123`, the site
   * the SASjs demo estate and the SAS9 test server use. Pass an empty string to
   * report no site at all.
   */
  siteId?: string
}

/**
 * Longest text kept for SYSERRORTEXT / SYSWARNINGTEXT. A program that logs in a
 * loop would otherwise write the whole history into every response; the tail of
 * the message is kept because it carries the actual cause.
 */
const MAX_SYSTEM_TEXT = 2000

const FETCH_SOURCE = String.raw`
const _sasjs_fetch = () => {
  const context = typeof _sasjs_fetch_context === 'undefined' ? {} : (_sasjs_fetch_context || {});
  const result = Object.create(null);
  const sourceParams = context.params || {};
  const params = Object.create(null);
  // Index numbered keys while detecting case collisions: each table then visits
  // only its own chunks, rather than rescanning every request parameter.
  const numbered = Object.create(null);
  for (const key of Object.keys(sourceParams)) {
    const match = /^(sasjs\d+data)(\d*)$/i.exec(key);
    if (match || /^sasjs_tables$/i.test(key)) {
      const lower = key.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(params, lower))
        throw new Error("webout('FETCH'): ambiguous parameter " + lower);
      params[lower] = sourceParams[key];
      if (match && match[2]) {
        const base = match[1].toLowerCase();
        if (!numbered[base]) numbered[base] = [];
        numbered[base].push({ param: lower, suffix: match[2] });
      }
    }
  }
  const own = (key) => Object.prototype.hasOwnProperty.call(params, key);
  const textOf = (value) => Array.isArray(value) ? value.map(String).join('') : String(value);
  const names = own('sasjs_tables') ? textOf(params.sasjs_tables).trim().split(/\s+/).filter(Boolean) : [];
  const parameterTables = names.map((name, index) => {
    const key = 'sasjs' + (index + 1) + 'data';
    if (own(key)) {
      if (numbered[key])
        throw new Error("webout('FETCH'): ambiguous parameter forms for " + name);
      return { name, csv: textOf(params[key]) };
    }
    const countValue = params[key + '0'];
    const count = typeof countValue === 'number' ? countValue :
      typeof countValue === 'string' && /^[1-9]\d*$/.test(countValue) ? Number(countValue) : NaN;
    if (!own(key + '0') || !Number.isSafeInteger(count) || count < 1)
      throw new Error("webout('FETCH'): missing or invalid chunk count for " + name);
    for (const { param, suffix } of numbered[key] || []) {
      if (suffix === '0') continue;
      const chunk = Number(suffix);
      if (!Number.isSafeInteger(chunk) || chunk < 1 || String(chunk) !== suffix || chunk > count)
        throw new Error("webout('FETCH'): unexpected chunk " + param + ' for ' + name);
    }
    const chunks = [];
    for (let i = 1; i <= count; i++) {
      if (!own(key + i)) throw new Error("webout('FETCH'): missing chunk " + i + ' for ' + name);
      chunks.push(textOf(params[key + i]));
    }
    return { name, csv: chunks.join('') };
  });
  /* Each digit is visited once; an optional decimal point must not split a
     digit run between two overlapping quantifiers on a failed match. */
  const numeric = (text) => {
    let i = 0;
    const digit = () => i < text.length && text.charCodeAt(i) >= 48 && text.charCodeAt(i) <= 57;
    if (text[i] === '+' || text[i] === '-') i++;
    const start = i;
    while (digit()) i++;
    const integerDigits = i - start;
    let fractionDigits = 0;
    if (text[i] === '.') {
      i++;
      const fractionStart = i;
      while (digit()) i++;
      fractionDigits = i - fractionStart;
    }
    if (!integerDigits && !fractionDigits) return false;
    if (text[i] === 'e' || text[i] === 'E') {
      i++;
      if (text[i] === '+' || text[i] === '-') i++;
      const exponentStart = i;
      while (digit()) i++;
      if (i === exponentStart) return false;
    }
    return i === text.length;
  };
  const uploads = context.tables || [];
  for (const [index, table] of [...uploads, ...parameterTables].entries()) {
    const text = String(table.csv);
    const end = text.search(/[\r\n]/);
    const header = end < 0 ? text : text.slice(0, end);
    /* Scan each whitespace-delimited candidate once. The format may end at a
       comma; malformed or missing names still identify an adapter-like header. */
    const adapterHeader = () => {
      let i = 0;
      while (i < header.length) {
        while (i < header.length && /\s/.test(header[i])) i++;
        let nameValid = true;
        while (i < header.length && !/\s/.test(header[i]) && header[i] !== ':') {
          if (header[i] === ',') nameValid = false;
          i++;
        }
        if (i < header.length && header[i] === ':' && nameValid) {
          const start = ++i;
          let valid = true, marker = false;
          while (i < header.length && !/\s/.test(header[i]) && header[i] !== ',') {
            const char = header[i++];
            if (!/[A-Za-z0-9_$.]/.test(char)) valid = false;
            if (/[.0-9]/.test(char)) marker = true;
          }
          if (valid && (marker || header[start] === '$' || header.slice(start, i).toLowerCase() === 'best')) return true;
        }
        while (i < header.length && !/\s/.test(header[i])) i++;
      }
      return false;
    };
    if (index < uploads.length && !adapterHeader()) continue;
    const columnNames = new Set();
    const columns = header.trim().split(/\s+/).map((item) => {
      const match = /^([^:]+):([^\s]+)$/.exec(item);
      if (!match) throw new Error("webout('FETCH'): invalid header " + item);
      if (!/^[A-Za-z_][A-Za-z0-9_]{0,31}$/.test(match[1]))
        throw new Error("webout('FETCH'): invalid column name " + match[1]);
      const columnName = match[1].toLowerCase();
      if (columnNames.has(columnName))
        throw new Error("webout('FETCH'): duplicate column " + match[1] + ' in ' + table.name);
      columnNames.add(columnName);
      if (!/^(?:\$(?:char)?\d+\.|best(?:[1-9]|[12]\d|3[0-2])?\.|(?:[1-9]|[12]\d|3[0-2])\.(?:[0-9]|[12]\d|3[01])?)$/i.test(match[2]))
        throw new Error("webout('FETCH'): unsupported informat " + match[2]);
      const decimal = /^\d+\.(\d+)$/.exec(match[2]);
      return { name: match[1], character: match[2].startsWith('$'), decimal: decimal ? Number(decimal[1]) : 0 };
    });
    const rows = [];
    let row = [], value = '', quoted = false, started = false, closedQuote = false;
    const record = () => {
      row.push(value);
      if (row.length !== columns.length)
        throw new Error("webout('FETCH'): wrong column count in " + table.name);
      const obj = Object.create(null);
      columns.forEach((column, i) => {
        const cell = row[i];
        if (column.character) obj[column.name] = cell;
        else if (cell.trim() === '' || cell.trim() === '.') obj[column.name] = null;
        else if (/^\.[a-z_]$/i.test(cell.trim())) obj[column.name] = cell.trim();
        else if (numeric(cell.trim())) {
          const number = Number(cell.trim());
          if (!Number.isFinite(number)) throw new Error("webout('FETCH'): unsupported numeric value in " + table.name + '.' + column.name);
          obj[column.name] = cell.includes('.') ? number : number / 10 ** column.decimal;
        }
        else throw new Error("webout('FETCH'): unsupported numeric value in " + table.name + '.' + column.name);
      });
      rows.push(obj);
      row = []; value = ''; started = false; closedQuote = false;
    };
    const body = end < 0 ? '' : text.slice(end + (text.slice(end, end + 2) === '\r\n' ? 2 : 1));
    for (let i = 0; i < body.length; i++) {
      const char = body[i];
      if (quoted) {
        if (char === '"' && body[i + 1] === '"') { value += '"'; i++; }
        else if (char === '"') { quoted = false; closedQuote = true; }
        else value += char;
      } else if (char === '"') {
        if (value !== '' || closedQuote) throw new Error("webout('FETCH'): invalid quote in " + table.name);
        quoted = true; started = true;
      } else if (char === ',') { row.push(value); value = ''; started = true; closedQuote = false; }
      else if (char === '\r' || char === '\n') {
        if (char === '\r' && body[i + 1] === '\n') i++;
        if (started || row.length) record();
      } else {
        if (closedQuote) throw new Error("webout('FETCH'): invalid quote in " + table.name);
        value += char; started = true;
      }
    }
    if (quoted) throw new Error("webout('FETCH'): unterminated quote in " + table.name);
    /* A record is pending only when text was read for it: a body that ends with
       a terminator - a CSV written to a file does - has already recorded its
       last row, and recording again would push an empty cell and fail the
       column count. A header with no rows therefore also yields no rows, which
       is what infile dsd gives for the same text. */
    if (started || row.length) record();
    result[table.name] = rows;
  }
  return result;
};
`

/**
 * SYSSITE when a host has not configured one. It matches the site the SASjs demo
 * estate and the SAS9 test server use, so a program that checks SYSSITE against
 * a licence key behaves the same on the JS runtimes as it does on SAS.
 */
export const DEFAULT_SITE_ID = '123'

/** A JavaScript string literal that cannot be broken out of. */
const literal = (value: unknown): string =>
  JSON.stringify(value === undefined || value === null ? '' : String(value))

/**
 * The prelude for one program: the webout() definition, with every value of the
 * run inlined as a literal, plus the console tap that feeds SYSERRORTEXT and
 * SYSWARNINGTEXT.
 *
 * The emitted text resolves what it needs itself, so a host cannot get it wrong:
 * `require('fs')` is called inside the block, falling back to a host-provided
 * `fs` binding when `require` is absent, and `require('os')` is optional. The one
 * binding the block cannot provide is `_webout` itself: the host declares
 * `let _webout = ''` and hands it to `finalise()`, which is what
 * `weboutFinaliseStatement` spells out.
 *
 * `globalThis.webout` is an assignment rather than a declaration so a program
 * that declares its own `webout` shadows it instead of failing to parse, and the
 * runtime keeps its own reference under the reserved `_sasjs_webout` name.
 */
export const getWeboutPrelude = (
  config: WeboutPreludeConfig
): string => `/* webout(): send data back, mirroring %ms_webout in @sasjs/core.
   webout('OPEN'); webout('OBJ', 'name', rows); webout('CLOSE')
   Generated by @sasjs/utils - change it there, not here. */
const _sasjs_webout_config = {
  weboutPath: ${literal(config.weboutPath)},
  headersPath: ${literal(config.headersPath)},
  program: ${literal(config.program)},
  debug: ${literal(config.debug)},
  username: ${literal(config.username)},
  userId: ${literal(config.userId)},
  apiServerUrl: ${literal(config.apiServerUrl)},
  siteId: ${literal(config.siteId === undefined ? DEFAULT_SITE_ID : config.siteId)}
};

/* Resolved here rather than assumed, so a host that emits this block without
   binding fs in the program's scope still works - the alternative is a
   ReferenceError in the session log at the first webout() call. What comes back
   is checked for the two calls this block makes: a host that hands back an empty
   or partial shim must hear that, not 'appendFileSync of undefined'. */
const _sasjs_fs = (() => {
  const _sasjs_usable = (candidate) =>
    !!candidate &&
    typeof candidate.writeFileSync === 'function' &&
    typeof candidate.appendFileSync === 'function';

  try {
    const _sasjs_required = require('fs');
    if (_sasjs_usable(_sasjs_required)) return _sasjs_required;
  } catch (_sasjs_no_require) {}

  /* a program's own later 'const fs' leaves the name in its temporal dead zone
     here, so even the typeof can throw */
  try {
    if (typeof fs !== 'undefined' && _sasjs_usable(fs)) return fs;
  } catch (_sasjs_fs_unset) {}

  throw new Error(
    'webout(): this host provides no fs with writeFileSync and appendFileSync'
  );
})();

/* Node modules are absent in a browser host, and a host may refuse them, so the
   system block falls back to what the browser can answer. The shape is checked
   for the same reason as fs: a host that hands back a stub must not be taken for
   a working os module. */
let _sasjs_os = null;
try {
  const _sasjs_os_module = require('os');
  if (
    _sasjs_os_module &&
    typeof _sasjs_os_module.hostname === 'function' &&
    typeof _sasjs_os_module.type === 'function' &&
    typeof _sasjs_os_module.totalmem === 'function'
  )
    _sasjs_os = _sasjs_os_module;
} catch (_sasjs_no_os) { _sasjs_os = null; }

let _sasjs_syserrortext = '';
let _sasjs_syswarningtext = '';
let _sasjs_opened = false;
let _sasjs_closed = false;
let _sasjs_streamed = false;

/* SAS keeps the LAST error and warning the engine recorded; a JS program has no
   engine, so the equivalent is the last message it sent to the console. Both are
   forwarded unchanged, so the log looks exactly as it did before. */
try {
  const _sasjs_cap = (text) => String(text).slice(-${MAX_SYSTEM_TEXT});
  const _sasjs_console_error = console.error;
  const _sasjs_console_warn = console.warn;
  console.error = function () {
    _sasjs_syserrortext = _sasjs_cap(Array.prototype.join.call(arguments, ' '));
    return _sasjs_console_error.apply(console, arguments);
  };
  console.warn = function () {
    _sasjs_syswarningtext = _sasjs_cap(Array.prototype.join.call(arguments, ' '));
    return _sasjs_console_warn.apply(console, arguments);
  };
} catch (_sasjs_frozen_console) { /* a frozen console is not worth failing a run over */ }

const _sasjs_pad = (value) => String(value).padStart(2, '0');

/**
 * &SYSDATE is DATE7 - ddMMMyy, with a two-digit year - and %mm_webout writes it
 * as it stands. A four-digit year here is DATE9, a format the SAS side never
 * emits, and a consumer that parses the field as DATE7 reads it wrong.
 */
const _sasjs_sas_date = (date) => {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
    'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  return _sasjs_pad(date.getDate()) + months[date.getMonth()] +
    _sasjs_pad(date.getFullYear() % 100);
};

/** &SYSTIME is TIME5 - hh:mm. The seconds stay in the log, not in this field. */
const _sasjs_sas_time = (date) =>
  _sasjs_pad(date.getHours()) + ':' + _sasjs_pad(date.getMinutes());

/**
 * END_DTTM is %sysfunc(datetime(),E8601DT26.6): local time, six fraction
 * digits, no zone suffix. toISOString() was UTC with a trailing Z and three
 * digits, so a consumer parsing both sides saw different instants on any estate
 * that is not at UTC. Date carries milliseconds only; the last three digits are
 * zeros rather than invented.
 */
const _sasjs_e8601dt = (date) =>
  date.getFullYear() + '-' + _sasjs_pad(date.getMonth() + 1) + '-' +
  _sasjs_pad(date.getDate()) + 'T' + _sasjs_pad(date.getHours()) + ':' +
  _sasjs_pad(date.getMinutes()) + ':' + _sasjs_pad(date.getSeconds()) + '.' +
  String(date.getMilliseconds() * 1000).padStart(6, '0');

const _sasjs_hostname = () =>
  _sasjs_os ? _sasjs_os.hostname() : (typeof location !== 'undefined' ? location.hostname : '');

const _sasjs_hostinfo = () =>
  _sasjs_os
    ? _sasjs_os.type() + ' ' + _sasjs_os.release() + ' ' + _sasjs_os.arch()
    : (typeof navigator !== 'undefined' ? navigator.userAgent : '');

const _sasjs_platform = () => (_sasjs_os ? process.platform : 'browser');

const _sasjs_vlong = () => (_sasjs_os ? process.version : 'browser');

const _sasjs_pid = () =>
  typeof process !== 'undefined' && process.pid ? String(process.pid) : '';

/* SAS SIZEKMG, eg 15.6G. Node reports the host's memory; a browser reports the
   device memory it is allowed to see, when it exposes one at all. */
const _sasjs_memsize = () => {
  if (_sasjs_os) {
    const bytes = _sasjs_os.totalmem();
    const gigabytes = bytes / (1024 * 1024 * 1024);
    return gigabytes >= 1
      ? gigabytes.toFixed(1) + 'G'
      : Math.round(bytes / (1024 * 1024)) + 'M';
  }
  return typeof navigator !== 'undefined' && navigator.deviceMemory
    ? navigator.deviceMemory.toFixed(1) + 'G'
    : '';
};

const _sasjs_append = (text) =>
  _sasjs_fs.appendFileSync(_sasjs_webout_config.weboutPath, text, 'utf-8');

/* The options a table takes here, and the %ms_webout ones that have no
   equivalent: a JS row already carries its final value, so there is nothing to
   format (fmt=) and no special missing to render (missing=), and the member name
   IS the label (dslabel=). */
const _sasjs_option_names = ['showmeta', 'maxobs'];

/* A member of the enclosing object, with its own leading comma so a caller never
   tracks commas between tables. */
const _sasjs_member = (name, value) =>
  _sasjs_append(',' + JSON.stringify(String(name)) + ':' + JSON.stringify(value));

const _sasjs_options = (action, options) => {
  const given = options === undefined || options === null ? {} : options;
  if (typeof given !== 'object' || Array.isArray(given))
    throw new Error("webout('" + action + "') takes its options as one object, eg { maxobs: 100 }");

  const out = {};

  /* SAS keyword arguments are case-insensitive, so a call ported from
     %ms_webout(showmeta=YES) still means showmeta. An unknown name is refused
     rather than ignored: a typo in maxObs would otherwise send every row. */
  for (const key of Object.keys(given)) {
    const name = String(key).toLowerCase();
    if (_sasjs_option_names.indexOf(name) < 0)
      throw new Error("webout('" + action + "') does not know the option '" + key +
        "' - use " + _sasjs_option_names.join(' or ') +
        ' (missing=, fmt= and dslabel= have no JS equivalent)');
    out[name] = given[key];
  }

  /* Every option is checked here, before the caller writes anything: a table
     that is rejected after its member has been appended leaves a half-written
     body, and a caller that catches the error and closes then sends a table
     with no metadata - the same 'looks complete' failure maxobs guards against. */
  if (out.maxobs !== undefined && (typeof out.maxobs !== 'number' ||
      !Number.isInteger(out.maxobs) || out.maxobs < 0))
    throw new Error("webout('" + action + "') maxobs takes a whole number of rows as a number, got " +
      JSON.stringify(out.maxobs));

  if (out.showmeta !== undefined && out.showmeta !== null) {
    if (out.showmeta === true)
      throw new Error("webout('" + action + "') cannot read showmeta from the rows - pass the metadata itself, { vars: { COL: { format, label, length, type } } }, the way %mp_jsonout builds it");
    if (typeof out.showmeta !== 'object' || Array.isArray(out.showmeta))
      throw new Error("webout('" + action + "') showmeta takes an object, eg { vars: { COL: { format: 'best.', label: 'Col', length: 8, type: 'num' } } }");
  }

  return out;
};

const _sasjs_maxobs = (rows, settings) =>
  settings.maxobs === undefined ? rows : rows.slice(0, settings.maxobs);

const _sasjs_open = () => {
  if (_sasjs_closed)
    throw new Error("webout('OPEN') cannot follow webout('CLOSE') - the body is already complete");
  if (_sasjs_opened)
    throw new Error("webout('OPEN') has already been called - call webout('CLOSE') first");

  const now = new Date();

  _sasjs_fs.writeFileSync(
    _sasjs_webout_config.weboutPath,
    '{"SYSDATE":"' + _sasjs_sas_date(now) + '","SYSTIME":"' + _sasjs_sas_time(now) + '"',
    'utf-8'
  );
  /* The header file is seeded with a text/html line that carries no trailing
     newline, so the leading newline keeps this entry on its own line. */
  _sasjs_fs.appendFileSync(_sasjs_webout_config.headersPath, '\\ncontent-type: application/json\\n', 'utf-8');

  _sasjs_opened = true;
  _sasjs_streamed = true;
};

const _sasjs_table = (action, name, rows, options) => {
  if (!_sasjs_opened)
    throw new Error("webout('" + action + "') requires webout('OPEN') first");
  if (!name)
    throw new Error("webout('" + action + "') needs a member name, eg webout('OBJ', 'mytable', rows)");
  if (!Array.isArray(rows))
    throw new Error("webout('" + action + "') needs an array of rows, got " + (rows === null ? 'null' : typeof rows));
  if (action === 'ARR' && rows.some((row) => !Array.isArray(row)))
    throw new Error("webout('ARR') takes positional rows - one array per row, like the SAS array format. Use webout('OBJ') for rows keyed by column name.");
  if (action === 'OBJ' && rows.some((row) => row === null || typeof row !== 'object' || Array.isArray(row)))
    throw new Error("webout('OBJ') takes rows keyed by column name - one object per row, like the SAS object format. Use webout('ARR') for positional rows.");

  /* validated first: nothing is written for a call that will not be sent */
  const settings = _sasjs_options(action, options);
  const sent = _sasjs_maxobs(rows, settings);

  _sasjs_member(name, sent);

  /* The metadata travels beside its table under a $ prefix, in the shape
     %mp_jsonout writes from the dictionary tables:
     ,"$mytable":{"vars":{"COL":{"format":"best.","label":"Col","length":8,"type":"num"}}} */
  if (settings.showmeta !== undefined && settings.showmeta !== null) {
    /* %mp_jsonout names the member $<dslabel> in lower case. */
    _sasjs_member('$' + String(name).toLowerCase(), settings.showmeta);
  }
};

const _sasjs_close = () => {
  /* The closed state is tested first: after a successful CLOSE the opened flag is
     false, so testing that first would report a duplicate CLOSE as a missing OPEN. */
  if (_sasjs_closed) throw new Error("webout('CLOSE') has already been called");
  if (!_sasjs_opened) throw new Error("webout('CLOSE') requires webout('OPEN') first");

  _sasjs_member('_DEBUG', _sasjs_webout_config.debug);
  _sasjs_member('_PROGRAM', _sasjs_webout_config.program);
  _sasjs_member('AUTOEXEC', '');
  _sasjs_member('MF_GETUSER', _sasjs_webout_config.username);
  _sasjs_member('SYSCC', String(_sasjs_syserrortext ? 8 : 0));
  _sasjs_member('SYSENCODING', 'utf-8');
  _sasjs_member('SYSERRORTEXT', _sasjs_syserrortext);
  _sasjs_member('SYSHOSTINFOLONG', _sasjs_hostinfo());
  _sasjs_member('SYSHOSTNAME', _sasjs_hostname());
  _sasjs_member('SYSPROCESSID', _sasjs_pid());
  _sasjs_member('SYSPROCESSMODE', 'Stored Program');
  _sasjs_member('SYSPROCESSNAME', _sasjs_os ? 'NodeJS' : 'Browser');
  _sasjs_member('SYSJOBID', _sasjs_pid());
  _sasjs_member('SYSSCPL', _sasjs_platform());
  _sasjs_member('SYSSITE', _sasjs_webout_config.siteId);
  _sasjs_member('SYSTCPIPHOSTNAME', _sasjs_webout_config.apiServerUrl);
  _sasjs_member('SYSUSERID', _sasjs_webout_config.userId);
  _sasjs_member('SYSVLONG', _sasjs_vlong());
  _sasjs_member('SYSWARNINGTEXT', _sasjs_syswarningtext);
  _sasjs_member('END_DTTM', _sasjs_e8601dt(new Date()));
  _sasjs_member('MEMSIZE', _sasjs_memsize());

  _sasjs_append('}');

  _sasjs_opened = false;
  _sasjs_closed = true;
};

${FETCH_SOURCE}

const _sasjs_webout = (action, name, rows, options) => {
  const requested = String(action === undefined || action === null ? '' : action).toUpperCase();

  if (requested === 'FETCH') return _sasjs_fetch();
  if (requested === 'OPEN') return _sasjs_open();
  if (requested === 'ARR' || requested === 'OBJ') return _sasjs_table(requested, name, rows, options);
  if (requested === 'CLOSE') return _sasjs_close();

  throw new Error("webout: unknown action '" + action + "' - use OPEN, ARR, OBJ or CLOSE");
};

/* Writes the body the program left in _webout when it did not call webout(), and
   reports what it left unfinished. An unclosed object is not repaired: that is
   invalid JSON, exactly as a SAS program that omits %ms_webout(CLOSE) leaves one. */
_sasjs_webout.finalise = (body) => {
  if (_sasjs_streamed) {
    if (body)
      console.log('webout: _webout was assigned as well as using webout() - the assignment is ignored');
  } else if (body) {
    _sasjs_fs.writeFileSync(_sasjs_webout_config.weboutPath, body);
  }

  if (_sasjs_opened)
    console.log("webout: webout('OPEN') was called but webout('CLOSE') was not - the response body is not valid JSON");
};

globalThis.webout = _sasjs_webout;
`

/**
 * The statement a generated program ends with: it writes the raw `_webout` body
 * and reports an unfinished envelope. Naming the reserved handle rather than
 * `webout` is what keeps a program that declares its own `webout` from taking
 * the runtime's tail down with it.
 */
export const weboutFinaliseStatement = '_sasjs_webout.finalise(_webout)'
