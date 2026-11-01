import { nextIssue, parseLog } from '.'

/**
 * A log covering what SAS 9 and Viya print for a step that warns, then fails.
 */
const LOG = [
  '1    data want;',
  '2      set sashelp.class;',
  '3      x = age / 0;',
  '4    run;',
  '',
  'NOTE: There were 19 observations read from the data set SASHELP.CLASS.',
  'WARNING: Division by zero detected at line 3 column 11.',
  'NOTE: The data set WORK.WANT has 19 observations and 5 variables.',
  '',
  '5    proc sql;',
  '6      select x from missing_ds;',
  '7    quit;',
  'ERROR: File WORK.MISSING_DS.DATA does not exist.',
  'ERROR 22-322: Syntax error, expecting one of the following: ;, CANCEL,',
  '              RUN, QUIT.',
  ''
].join('\n')

/**
 * A corpus drawn from published SAS log-checking tools, so the parser is held
 * against lines that appear in the literature rather than lines written to suit
 * it: "You've Got E-Mail: Automatic Log Checking via E-Mail Notification"
 * (SUGI 31, 128-31), "Check Please: An Automated Approach to Log Checking"
 * (MWSUG 2017, TT02), "Log Checks Made Easy" (SAS Global Forum 2012, 042-2012)
 * and the log viewer of the SAS extension for VS Code.
 */
const PUBLISHED = [
  'ERROR: DDE session not ready.',
  'ERROR: Physical file does not exist, Data.xls',
  'ERROR: File not found.',
  'WARNING: Apparent symbolic reference MACNAME not resolved.',
  'NOTE: MERGE statement has more than one data set with repeats of BY values.',
  'NOTE: Invalid data for age in line 42 3-5.',
  'NOTE: Variable x is uninitialized.',
  'NOTE: At least one W.D format was too small for the number to be printed.',
  'INFO: The variable y on data set WORK.A will be overwritten by data set WORK.B.',
  'ERROR: The following columns were not found in the contributing tables: amount.',
  'WARNING: The data set WORK.OUT may be incomplete. When this step was stopped there were 0 observations.',
  ''
].join('\n')

describe('parseLog', () => {
  it('should report no issues for an empty log', () => {
    expect(parseLog('')).toEqual([])
  })

  it('should report no issues for a log with nothing to report', () => {
    const log =
      'NOTE: There were 19 observations read.\nNOTE: DATA statement used.\n'

    expect(parseLog(log)).toEqual([])
  })

  it('should not report ordinary notes or info lines', () => {
    const log = [
      'NOTE: There were 19 observations read from the data set SASHELP.CLASS.',
      'NOTE: The data set WORK.WANT has 19 observations and 5 variables.',
      'NOTE: DATA statement used (Total process time):',
      'INFO: The variable y on data set WORK.A will be overwritten.',
      ''
    ].join('\n')

    expect(parseLog(log)).toEqual([])
  })

  it('should find the errors and warnings of a real log, in order', () => {
    const issues = parseLog(LOG)

    expect(issues.map((issue) => [issue.line, issue.severity])).toEqual([
      [6, 'warning'],
      [12, 'error'],
      [13, 'error']
    ])
  })

  it('should report the message SAS prints after the marker', () => {
    const [warning] = parseLog(LOG)

    expect(warning.message).toEqual(
      'Division by zero detected at line 3 column 11.'
    )
  })

  it('should report the message code separately from the message', () => {
    const issues = parseLog(LOG)

    expect(issues[1].code).toBeUndefined()
    expect(issues[2].code).toEqual('22-322')
  })

  it('should fold the lines SAS wrapped into the message they belong to', () => {
    const syntaxError = parseLog(LOG)[2]

    expect(syntaxError.line).toEqual(13)
    expect(syntaxError.endLine).toEqual(14)
    expect(syntaxError.message).toEqual(
      'Syntax error, expecting one of the following: ;, CANCEL, RUN, QUIT.'
    )
  })

  it('should address the marker line so a host can underline it', () => {
    const [, error] = parseLog(LOG)

    expect(error.column).toEqual(0)
    expect(error.endColumn).toEqual(
      'ERROR: File WORK.MISSING_DS.DATA does not exist.'.length
    )
  })

  it('should not match a marker that does not start the line', () => {
    const log = ' a data step printed ERROR: this is text in a data set\n'

    expect(parseLog(log)).toEqual([])
  })

  it('should report an error that carries no colon', () => {
    const issues = parseLog('ERROR Libref X is not assigned.\n')

    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toEqual('error')
    expect(issues[0].message).toEqual('Libref X is not assigned.')
  })

  it('should report a warning that carries no colon', () => {
    const [warning] = parseLog('WARNING Cartesian product will be generated.\n')

    expect(warning.severity).toEqual('warning')
    expect(warning.message).toEqual('Cartesian product will be generated.')
  })

  it('should report a coded error that carries no colon', () => {
    const [error] = parseLog('ERROR 22-322 Syntax error.\n')

    expect(error.code).toEqual('22-322')
    expect(error.message).toEqual('Syntax error.')
  })

  it('should not match a marker indented from the start of the line', () => {
    expect(parseLog('  ERROR: indented, so not a message.\n')).toEqual([])
    expect(parseLog('\tWARNING indented too.\n')).toEqual([])
  })

  it('should not match a marker in lower or mixed case', () => {
    expect(parseLog('error: SAS writes its markers in capitals.\n')).toEqual([])
    expect(parseLog('Warning: and in mixed case.\n')).toEqual([])
  })

  it('should not match a marker with nothing after it', () => {
    expect(parseLog('ERROR\n')).toEqual([])
    expect(parseLog('WARNING\n')).toEqual([])
  })

  it('should not match a word that merely begins with the marker', () => {
    expect(parseLog('ERRORS: none.\n')).toEqual([])
    expect(parseLog('WARNINGS are not errors.\n')).toEqual([])
  })

  it('should not report a note that carries no colon', () => {
    const log = 'NOTE Variable x is uninitialized.\n'

    expect(parseLog(log)).toEqual([])
  })

  it('should not absorb the pointer lines SAS prints under a source statement', () => {
    const log = [
      '14       x = age / 0;',
      '                ----',
      '                22',
      'ERROR: Division by zero detected.',
      ''
    ].join('\n')
    const [error] = parseLog(log)

    expect(error.endLine).toEqual(3)
    expect(error.message).toEqual('Division by zero detected.')
  })

  it('should skip the markup of an ODS HTML log and strip it from the message', () => {
    const log =
      '<font color="red">ERROR: File WORK.X.DATA does not exist.</font><br>\n'
    const [error] = parseLog(log)

    expect(error.severity).toEqual('error')
    expect(error.column).toEqual('<font color="red">'.length)
    expect(error.message).toEqual('File WORK.X.DATA does not exist.')
  })

  it('should read a log written with CRLF line endings', () => {
    const issues = parseLog('NOTE: one\r\nERROR: two\r\nWARNING: three\r\n')

    expect(
      issues.map((issue) => [issue.line, issue.severity, issue.message])
    ).toEqual([
      [1, 'error', 'two'],
      [2, 'warning', 'three']
    ])
  })

  it('should report the errors, warnings and notable notes of a published corpus', () => {
    const issues = parseLog(PUBLISHED)

    expect(
      issues.map((issue) => [issue.line, issue.severity, issue.message])
    ).toEqual([
      [0, 'error', 'DDE session not ready.'],
      [1, 'error', 'Physical file does not exist, Data.xls'],
      [2, 'error', 'File not found.'],
      [3, 'warning', 'Apparent symbolic reference MACNAME not resolved.'],
      [
        4,
        'note',
        'MERGE statement has more than one data set with repeats of BY values.'
      ],
      [5, 'note', 'Invalid data for age in line 42 3-5.'],
      [6, 'note', 'Variable x is uninitialized.'],
      [
        7,
        'note',
        'At least one W.D format was too small for the number to be printed.'
      ],
      [
        9,
        'error',
        'The following columns were not found in the contributing tables: amount.'
      ],
      [
        10,
        'warning',
        'The data set WORK.OUT may be incomplete. When this step was stopped there were 0 observations.'
      ]
    ])
  })

  it('should leave the ordinary notes of that corpus alone', () => {
    const issues = parseLog(PUBLISHED)

    expect(
      issues.some((issue) => issue.message.includes('will be overwritten'))
    ).toEqual(false)
  })

  it('should report each notable note as a note, not as a warning', () => {
    const log = [
      'NOTE: Missing values were generated as a result of performing an operation on missing values.',
      'NOTE: Division by zero detected at line 11 column 5.',
      'NOTE: Mathematical operations could not be performed at the following places.',
      'NOTE: Character values have been converted to numeric values.',
      'NOTE: The meaning of an identifier after a quoted string might change.',
      'NOTE: Unreferenced label defined: y.',
      'NOTE: WHERE clause has been replaced.',
      'NOTE: DATA STEP stopped due to looping.',
      'NOTE: The file WORK.X was not found.',
      'NOTE: SAS went to a new line when INPUT statement reached past the end of a line.',
      'NOTE: LOST CARD.',
      'NOTE: Statement not executed due to NOEXEC option.',
      'NOTE: A CASE expression has no ELSE clause.',
      'NOTE: Some of the tick values have been thinned.',
      'NOTE: A GROUP BY clause has been discarded because neither the SELECT clause',
      'NOTE: Processing on disk occurred during summarization.',
      'NOTE: The log axis cannot support zero or negative values.',
      'NOTE: One or more lines were truncated.',
      'NOTE: The SAS System stopped processing this step because of errors.',
      ''
    ].join('\n')

    const issues = parseLog(log)

    expect(issues).toHaveLength(19)
    expect(issues.map((issue) => issue.severity)).toEqual(
      new Array(19).fill('note')
    )
  })

  it('should find a notable note whose keyword lands on a wrapped line', () => {
    const log = [
      'NOTE: Character values have been converted',
      '      to numeric values at the places given by: (Line):(Column).',
      ''
    ].join('\n')

    const [note] = parseLog(log)

    expect(note.severity).toEqual('note')
    expect(note.line).toEqual(0)
    expect(note.endLine).toEqual(1)
    expect(note.message).toEqual(
      'Character values have been converted to numeric values at the places given by: (Line):(Column).'
    )
  })

  it('should not report a marker quoted inside another message', () => {
    const log =
      'NOTE: The previous step wrote ERROR: File not found. - see the documentation.\n'

    expect(parseLog(log)).toEqual([])
  })
})

describe('nextIssue', () => {
  it('should step forward from the cursor and wrap at the end', () => {
    const issues = parseLog(LOG)

    expect(nextIssue(issues, -1)?.line).toEqual(6)
    expect(nextIssue(issues, 6)?.line).toEqual(12)
    expect(nextIssue(issues, 13)?.line).toEqual(6)
  })

  it('should step back from the cursor and wrap at the start', () => {
    const issues = parseLog(LOG)

    expect(nextIssue(issues, 6, 'previous')?.line).toEqual(13)
    expect(nextIssue(issues, 98, 'previous')?.line).toEqual(13)
    expect(nextIssue(issues, 13, 'previous')?.line).toEqual(12)
  })

  it('should yield nothing over a log with no issues', () => {
    expect(nextIssue([], 0)).toBeUndefined()
    expect(nextIssue([], 0, 'previous')).toBeUndefined()
  })
})
