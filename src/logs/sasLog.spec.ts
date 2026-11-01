import { isSasLog, nextIssue, parseLog } from '.'

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
    expect(parseLog('ERROR \n')).toEqual([])
    expect(parseLog('WARNING   \n')).toEqual([])
    expect(parseLog('ERROR: \n')).toEqual([])
    expect(parseLog('ERROR:\t\n')).toEqual([])
  })

  it('should not match a word that merely begins with the marker', () => {
    expect(parseLog('ERRORS: none.\n')).toEqual([])
    expect(parseLog('WARNINGS are not errors.\n')).toEqual([])
  })

  it('should not report a note that carries no colon', () => {
    const log = 'NOTE Variable x is uninitialized.\n'

    expect(parseLog(log)).toEqual([])
  })

  it('should report a coded note and keep its code', () => {
    const [note] = parseLog(
      'NOTE 49-169: The meaning of an identifier after a quoted string may change.\n'
    )

    expect(note.severity).toEqual('note')
    expect(note.code).toEqual('49-169')
    expect(note.message).toEqual(
      'The meaning of an identifier after a quoted string may change.'
    )
  })

  it('should not report a coded note that is not on the notable list', () => {
    const log = 'NOTE 55-151: A step numbering has been restarted.\n'

    expect(parseLog(log)).toEqual([])
  })

  it('should read a marker that follows markup and its padding', () => {
    const [error] = parseLog(
      '<font color="red"> ERROR: File WORK.X.DATA does not exist.</font>\n'
    )

    expect(error.severity).toEqual('error')
    expect(error.column).toEqual('<font color="red"> '.length)
    expect(error.message).toEqual('File WORK.X.DATA does not exist.')
  })

  it('should not match a marker across a line break', () => {
    expect(parseLog('ERROR\n   22-322: Syntax error.\n')).toEqual([])
  })

  it('should not fold an indented marker into the issue above it', () => {
    const issues = parseLog('ERROR: first\n  ERROR: second\n')

    expect(issues).toHaveLength(1)
    expect(issues[0].message).toEqual('first')
    expect(issues[0].endLine).toEqual(0)
  })

  it('should not fold an indented marker that carries markup', () => {
    const log = [
      'ERROR: first',
      '  <font color="red">ERROR: second</font>',
      ''
    ].join('\n')
    const issues = parseLog(log)

    expect(issues).toHaveLength(1)
    expect(issues[0].message).toEqual('first')
    expect(issues[0].endLine).toEqual(0)
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

  it('should fold a wrapped line that carries the markup of an ODS HTML log', () => {
    const log =
      '<font size="2">ERROR 22-322: Syntax error, expecting one of the following: ;, CANCEL,</font>\n' +
      '<font size="2">              RUN, QUIT.</font>'
    const [error] = parseLog(log)

    expect(error.endLine).toEqual(1)
    expect(error.code).toEqual('22-322')
    expect(error.message).toEqual(
      'Syntax error, expecting one of the following: ;, CANCEL, RUN, QUIT.'
    )
  })

  it('should not fold a line of an ODS HTML log that holds only markup', () => {
    const [error] = parseLog(
      '<font size="2">ERROR: File WORK.X.DATA does not exist.</font>\n' +
        '<font size="2"></font>\n' +
        'NOTE: There were 5 observations read.'
    )

    expect(error.endLine).toEqual(0)
  })

  it('should take a wrapped line as the message when the marker line is bare', () => {
    const [issue] = parseLog('ERROR:\n   File WORK.X.DATA does not exist.')

    expect(issue.message).toEqual('File WORK.X.DATA does not exist.')
    expect(issue.endLine).toEqual(1)
  })

  it('should read a marker on the last line when the log has no final newline', () => {
    const issues = parseLog(
      'NOTE: a note\nERROR: File WORK.X.DATA does not exist.'
    )

    expect(issues).toHaveLength(1)
    expect(issues[0].line).toEqual(1)
    expect(issues[0].message).toEqual('File WORK.X.DATA does not exist.')
    expect(issues[0].endColumn).toEqual(
      'ERROR: File WORK.X.DATA does not exist.'.length
    )
  })

  it('should fold a wrapped line that ends the log with no final newline', () => {
    const [issue] = parseLog(
      'ERROR: File WORK.X.DATA does not exist.\n   and the rest'
    )

    expect(issue.endLine).toEqual(1)
    expect(issue.message).toEqual(
      'File WORK.X.DATA does not exist. and the rest'
    )
  })

  it('should read a log written with CRLF line endings', () => {
    const issues = parseLog(
      'NOTE: Variable x is uninitialized.\r\n' +
        'ERROR: File WORK.X.DATA does not exist.\r\n' +
        'WARNING: Division by zero detected.\r\n'
    )

    expect(
      issues.map((issue) => [issue.line, issue.severity, issue.message])
    ).toEqual([
      [0, 'note', 'Variable x is uninitialized.'],
      [1, 'error', 'File WORK.X.DATA does not exist.'],
      [2, 'warning', 'Division by zero detected.']
    ])

    // The column stops before the carriage return, so it addresses the line the
    // reader sees rather than the newline after it.
    expect(issues[1].endColumn).toEqual(
      'ERROR: File WORK.X.DATA does not exist.'.length
    )
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

  it('should normalise a message that carries a non-ASCII space', () => {
    const [issue] = parseLog('ERROR:\u00A0File WORK.X.DATA does not exist.\n')

    expect(issue.message).toEqual('File WORK.X.DATA does not exist.')
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

describe('isSasLog', () => {
  it('should accept a log on the banner SAS prints about itself', () => {
    const log = [
      'NOTE: Copyright (c) 2025 by SAS Institute Inc., Cary, NC, USA.',
      'NOTE: SAS (r) Proprietary Software 9.4 (TS1M9 MBCS3170)',
      'NOTE: This session is executing on the Linux 5.14.0 platform.'
    ]

    expect(isSasLog(log.join('\n'))).toBe(true)
  })

  it('should accept a log on the work-area conversion warning', () => {
    const log =
      'You are running SAS 9. Some SAS 9 files will be automatically converted.'

    expect(isSasLog(log)).toBe(true)
  })

  it('should accept a log whose head is lost but whose step footer survives', () => {
    const log = [
      '12       x = 1;',
      '',
      'NOTE: DATA statement used (Total process time):'
    ]

    expect(isSasLog(log.join('\n'))).toBe(true)
  })

  it('should accept a listing on its page header', () => {
    const log = [
      '1                     The SAS System              Wednesday, October 29, 2025',
      '',
      'OBS    NAME',
      '  1    Alfred'
    ]

    expect(isSasLog(log.join('\n'))).toBe(true)
  })

  it('should accept a SAS log on its padded step numbers', () => {
    const log = [
      '1    data a;',
      '2      x = 1;',
      'ERROR Libref X is not assigned.'
    ]

    expect(isSasLog(log.join('\n'))).toBe(true)
  })

  it('should accept a numbered statement fragment that has no semicolon', () => {
    expect(isSasLog('1    data want')).toBe(true)
    expect(isSasLog('7    proc sql')).toBe(true)
    expect(isSasLog('3    libname mylib "/data"')).toBe(true)
  })

  it('should not accept a numbered list line that ends in a semicolon', () => {
    expect(isSasLog('12  Building target;')).toBe(false)
    expect(isSasLog('12  color: red;')).toBe(false)
  })

  it('should not accept a padded number that is not a SAS statement', () => {
    expect(isSasLog('1   item')).toBe(false)
    expect(isSasLog('12  Building target')).toBe(false)
    expect(isSasLog(['7  first point', '8  second point'].join('\n'))).toBe(
      false
    )
  })

  it('should accept a SAS log on a message code alone', () => {
    expect(isSasLog('ERROR 22-322: Syntax error.')).toBe(true)
  })

  it('should reject a log of notes from another tool', () => {
    expect(isSasLog('NOTE: some other tool writes this\n')).toBe(false)
    expect(isSasLog(PUBLISHED)).toBe(false)
  })

  it('should reject a Python log, which writes the same markers', () => {
    const log = ['INFO:root:start', 'ERROR:root:boom', 'WARNING:root:careful']

    expect(isSasLog(log.join('\n'))).toBe(false)
  })

  it('should reject a shell or build log', () => {
    const log = ['ERROR: Command failed with exit code 1', 'npm ERR! path x']

    expect(isSasLog(log.join('\n'))).toBe(false)
  })

  it('should reject a log that mentions SAS in prose', () => {
    const log = [
      '[warn] SASAUTOS was not refreshed.',
      '[info] running the SASjs CLI against the SAS server',
      'Done in 4s'
    ]

    expect(isSasLog(log.join('\n'))).toBe(false)
  })

  it('should reject a text that is not a log at all', () => {
    expect(isSasLog('')).toBe(false)
    expect(isSasLog('nothing to see here')).toBe(false)
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
