/**
 * SAS log parsing.
 *
 * A SAS log is a stream of statements and messages, and only the messages
 * matter to a reader looking for trouble: the ones SAS prints at the start of a
 * line as `ERROR`, `WARNING` or `NOTE`. This module finds those messages and
 * reports where they are, as line and column indexes into the text it was given,
 * so a host can underline them without re-scanning the log and without rewriting
 * it.
 *
 * What is recognised - the marker in capitals, beginning the line:
 *
 *   ERROR: Libref X is not assigned.
 *   ERROR Libref Y is not assigned.
 *   ERROR 22-322: Syntax error, expecting one of the following: ;, CANCEL,
 *                 RUN, QUIT.
 *   WARNING 1-322: Assuming the symbol Y was misspelled.
 *   NOTE: Variable x is uninitialized.
 *
 * An error or a warning needs a colon, or a space, after the marker; `ERROR` on
 * its own is not a message, and neither is every line that happens to begin with
 * the word. The numeric code between the marker and the colon is SAS's own
 * message identifier and is reported separately, so a host can group by it.
 *
 * NOTES are reported only when they are the ones the log-checking literature
 * flags - see NOTE_KEYWORDS - and only in their colon form, because the notes
 * stream is endless and the notable ones are a closed list. A coded note
 * (`NOTE 49-169:`) is one of them and keeps its code. INFO lines are not
 * reported at all.
 *
 * {@link isSasLog} answers the different question a host asks before publishing
 * anything: whether this file is a SAS log at all. A Python log and a shell build
 * log both write `ERROR:` at the start of a line, so the marker alone does not
 * say so - the banner SAS prints about itself does, and so do its message codes
 * and its padded step numbers.
 *
 * Lines SAS wrapped are folded into the message they belong to, so one problem
 * is one issue rather than one issue per wrapped line, and the keyword search
 * runs on the folded message - a note whose keyword lands on the second line is
 * still found. Nothing indented counts as a marker, and neither does a marker in
 * lower case: the real one starts the line, which keeps a print of a data set,
 * or a message quoting another log, out of the results.
 *
 * ODS HTML logs wrap every line in markup. A tag sequence before the marker is
 * skipped and tags are stripped from the reported message, so the same parse
 * serves a plain log and an HTML one. The line and column indexes stay those of
 * the text as supplied, because they are what the caller needs to address.
 *
 * Nothing here touches the log: the caller renders from the issue list, which is
 * what lets one log be shown in an editor, in a browser panel and in a report
 * from the same parse.
 */

/**
 * The severities a log issue can carry. `note` is only ever a notable note - see
 * NOTE_KEYWORDS - never an ordinary one.
 */
export type LogSeverity = 'error' | 'warning' | 'note'

/** One ERROR, WARNING or notable NOTE in a SAS log, addressed in the text it was parsed from. */
export interface LogIssue {
  /** Zero-based index of the line carrying the marker. */
  line: number
  /** Zero-based index of the last line SAS wrapped into this message. */
  endLine: number
  /** Zero-based column where the marker starts on `line`. */
  column: number
  /** Zero-based column one past the end of `line`, for underlining it. */
  endColumn: number
  /** The marker that introduced the issue. */
  severity: LogSeverity
  /** SAS's message identifier, e.g. `22-322` for `ERROR 22-322:`. */
  code?: string
  /** The message text, with wrapped lines joined and markup stripped. */
  message: string
}

/** Direction of travel for {@link nextIssue}. */
export type IssueDirection = 'next' | 'previous'

/**
 * A marker at the start of a line: SAS writes `ERROR:` and `WARNING:` with a
 * colon, and also writes them with no colon at all - `ERROR Libref X is not
 * assigned.` - so a run of whitespace ends those two as well. The marker is
 * uppercase and begins the line, which is what keeps a print of a data set, or a
 * quotation of another log, out of the results.
 *
 * `NOTE` is a separate shape inside the same expression because it only counts
 * with its colon: matching any line that begins NOTE would put the whole notes
 * stream into the results. A coded note is a note - `NOTE 49-169:` carries the
 * same kind of identifier an error does, and two of the notable keywords are
 * written for coded notes.
 *
 * The tags of an ODS HTML log may lead the marker, with or without padding after
 * them - they are markup the reader never sees, and the marker still begins the
 * line's text. Padding without markup is not allowed: an indented marker is text
 * in a listing, not a message. The prefix is captured so the marker's column is
 * exact, and the code and message are captured separately.
 *
 * The spaces either side of a message code are a character class, not `\s`: the
 * expression now runs over the whole text, where `\s` would let a match swallow
 * the line break and read the next line as this message's code.
 */
const MARKER =
  /^((?:<[^>]*>)+[ \t]*|)(?:(ERROR|WARNING)(?:[ \t]+(\d+-\d+))?(:[ \t]?|[ \t]+)|(NOTE)(?:[ \t]+(\d+-\d+))?:[ \t]?)(.*)$/

/**
 * The shapes only SAS writes, tested over the whole text in one pass so no line
 * array is built: a coded marker (`ERROR 22-322:`), or a line SAS numbers at the
 * start followed by a statement - one that begins with a macro call, a comment,
 * or ends in the semicolon SAS statement syntax requires. The padded number alone
 * is not evidence: `1   item` is a numbered list in somebody else's output.
 *
 * The statement tail is `[^\n;]*` rather than `[^;]*` because a negated class
 * matches a newline, and a shape match must not span two lines. A semicolon alone
 * does not make a statement - `12  Building target;` is a numbered list in output
 * that is not SAS - so the line also has to begin with a statement keyword or
 * carry an assignment or a call before its semicolon.
 */
const SAS_SHAPE =
  /^(?:(?:<[^>]*>)+[ \t]*|)(?:(?:ERROR|WARNING|NOTE) +\d+-\d+|\d+ {2,}(?:[%*/]|(?:by|data|filename|footnote|format|if|infile|input|libname|merge|ods|options|output|proc|put|quit|run|set|title|where)\b|[^\n;]*[=(][^\n;]*;))/m

/**
 * The phrases SAS prints about itself, and nothing else does: the version banner,
 * the licence note, the platform note, the work-area conversion warning, the page
 * header of a listing and the step footer. Every SAS log carries at least one;
 * a log that has lost its head usually keeps the step footer.
 */
const SAS_BANNER =
  /(?:The SAS System|^You are running SAS \d|^NOTE: (?:SAS|Copyright .*\bSAS Institute|This session is executing|DATA statement used))/m

/**
 * Whether a text is a SAS log rather than somebody else's log file.
 *
 * A marker alone does not say so: Python's logging writes `ERROR:root:boom` and
 * a shell build log writes `ERROR: Command failed with exit code 1`, both at the
 * start of a line. Nor does the word SAS - build logs of this estate's own
 * repositories mention it in prose - so the test is SAS's own vocabulary: the
 * banner it prints about itself, its message codes, and its padded step numbers.
 * Each of those is written by SAS and by nothing else.
 *
 * This is a heuristic, and one way only: a true answer means SAS wrote the text,
 * while a false answer does not prove it did not - a trimmed excerpt of a log,
 * pasted with only its `ERROR:` lines, carries none of the three and reads as
 * somebody else's. A host that publishes diagnostics should therefore treat false
 * as "not obviously SAS" rather than "not SAS".
 *
 * Counting marker lines instead was considered and rejected: two `ERROR:` lines is
 * what a Python log is made of, so it would readmit exactly the files this
 * predicate exists to keep out.
 *
 * The check is deliberately cheap and runs before a host publishes anything, so
 * a `.log` from another tool is left alone.
 */
export const isSasLog = (text: string): boolean =>
  SAS_BANNER.test(text) || SAS_SHAPE.test(text)

/**
 * The notes worth reporting, matched case-insensitively against the folded
 * message. Each is a message SAS prints when something has gone wrong quietly -
 * a variable never set, a row that failed input, a value silently converted, a
 * format too small to hold a number.
 *
 * The list is taken from SASLogChecker, Yutaka Morioka's log checker
 * (https://github.com/Morioka-Yutaka/SASLogChecker, MIT): the 25 targeted
 * NOTE / INFO examples in its help header map onto the keywords below, and its
 * first commit (2025-07-07) already carried them - sixteen months before this
 * parser existed, so the direction of travel is settled rather than assumed.
 *
 * Its matcher greps hex-encoded Japanese messages, because it reads logs from a
 * Japanese Windows SAS session (SJIS, Unicode, Latin); the English wording here
 * is its header's description of those messages. This parser matches English
 * text only, so a Japanese log yields no notable notes from it.
 *
 * The SAS user-group papers on the same subject carry shorter, differently
 * worded lists and are background here, not the source: SUGI 31 128-31 (2006)
 * greps for six strings, SASGF 2017 1173-2017 / MWSUG 2017 TT02 list eight
 * common messages, SASGF 2012 042-2012 lists ten categories. None of them
 * contains the statistical notes this list reports - the log axis, thinned tick
 * values, infinite likelihood, not positive definite, or processing on disk
 * during summarization - which is the practical-experience part SASLogChecker
 * adds, and none uses SAS's own message wording for the rest.
 *
 * Credit travels with the data: if you add a keyword, say where it came from.
 *
 * Adding a keyword widens what every host reports, so the list is deliberately
 * short: a message belongs here when a reviewer would want to see it even though
 * SAS called it a note.
 */
const NOTE_KEYWORDS = [
  'is uninitialized',
  'Missing values were generated',
  'Division by zero',
  'Mathematical operations could not be performed',
  'Invalid data',
  'Invalid argument',
  'Invalid third argument',
  'have been converted to',
  'The meaning of an identifier',
  'too small for',
  'Unreferenced label',
  'WHERE clause has been replaced',
  'stopped due to looping',
  'will be overwritten by data set',
  'repeats of BY values',
  'was not found',
  'reached past the end of a line',
  'LOST CARD',
  'NOEXEC',
  'A CASE expression has no ELSE clause',
  'have been thinned',
  'discarded because neither',
  'Processing on disk occurred during summarization',
  'log axis cannot support',
  'lines were truncated',
  'outside the axis range',
  'infinite likelihood',
  'not positive definite',
  'The SAS System stopped processing this step because of errors'
]

/** `RegExp`-escaping, so a keyword added later cannot change the meaning of the pattern. */
const escape = (text: string): string =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * The keyword list as one case-insensitive expression. Testing 30 keywords with
 * `includes` meant lowercasing every note and up to 30 scans of it; a log holds
 * thousands of notes and this is the second hottest function in the module.
 */
const NOTABLE_NOTE = new RegExp(NOTE_KEYWORDS.map(escape).join('|'), 'i')

/** How many wrapped lines one message may absorb, so a malformed log cannot run away. */
const MAX_WRAPPED_LINES = 10

/** Whether a note's message is one of the notable ones. */
export const isNotableNote = (message: string): boolean =>
  NOTABLE_NOTE.test(message)

/**
 * The pointer line SAS prints under the token it complains about: a run of
 * dashes, or the column number on its own.
 */
const POINTER_LINE = /^\s*(?:[-_]+\s*$|\d+\s*$)/

/**
 * A line with the tags that open it removed, so what SAS wrote begins the line.
 *
 * ODS HTML writes every physical line as `<font ...>text</font>`, and SAS wraps
 * a long message inside those tags. The tags are markup the reader never sees,
 * so both the indentation test and the marker test look past them; the reported
 * columns still address the raw line, which is what a host underlines.
 */
const withoutMarkup = (line: string): string =>
  line.replace(/^(?:<[^>]*>)+/, '')

/**
 * A line SAS wrapped: indented, and neither a pointer line nor a marker.
 *
 * The indentation is tested after the tags that open an ODS HTML line are
 * dropped: SAS wraps a line inside the markup, so the wrapped half of
 * `<font ...>              RUN, QUIT.</font>` is indented but does not begin
 * with the whitespace. Reading only the raw line treated every wrapped line of
 * an HTML log as a new line and left the message truncated at the break.
 *
 * The marker test is {@link MARKER} itself, applied to the text of the trimmed
 * line, so a continuation is excluded exactly when the line would have been a
 * marker had it begun the line - the markup-prefixed form included. A second,
 * subtly different expression is how an indented marker ends up belonging to
 * neither the message above nor the issue list. Such a marker is dropped rather
 * than reported, which is the rule the parser states: a message begins the line.
 */
const isWrappedLine = (line: string): boolean => {
  const text = withoutMarkup(line)

  return (
    /^\s+\S/.test(text) && !POINTER_LINE.test(text) && !MARKER.test(text.trim())
  )
}

/**
 * Whether a character code is printable ASCII and not a space. The fast path in
 * {@link clean} is limited to ASCII at both ends, so a message carrying one of
 * the non-ASCII spaces the slow path collapses still takes the slow path.
 */
const isPlainCode = (code: number): boolean => code > 32 && code < 127

/**
 * Removes markup and collapses the whitespace a wrapped message carries.
 *
 * Most messages need neither: a single line with no markup and no run of spaces
 * is returned as it is, which keeps three passes off the common path - this is
 * the hottest function in the module on a large log.
 */
const clean = (text: string): string => {
  const plain =
    isPlainCode(text.charCodeAt(0)) &&
    isPlainCode(text.charCodeAt(text.length - 1)) &&
    text.indexOf('<') < 0 &&
    text.indexOf('\t') < 0 &&
    text.indexOf('  ') < 0

  return plain
    ? text
    : text
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

/**
 * Finds every ERROR and WARNING in a SAS log, and every notable note.
 *
 * The issue list is in log order. `line` and `column` address the text as
 * supplied, so a caller can offset a decoration or a diagnostic by them
 * directly. A host that wants errors only filters on `severity`; nothing is
 * behind an option, because a notable note is worth reporting wherever the log
 * is shown.
 */
/**
 * The marker expression with the multiline flags, so one call walks the whole
 * text. `exec` on a line at a time costs a call per line - half a million on a
 * 16 MB log - where one pass over the string costs a fraction of that, and the
 * line and column indexes are recovered from the match offsets instead.
 */
const SCAN = new RegExp(MARKER.source, 'gm')

/** The index of the line break that ends the line starting at `from`, or -1. */
const lineEnd = (text: string, from: number): number => text.indexOf('\n', from)

/** A slice of the text with the carriage return of a CRLF line ending removed. */
const withoutCr = (text: string, from: number, to: number): string =>
  to > from && text.charCodeAt(to - 1) === 13
    ? text.slice(from, to - 1)
    : text.slice(from, to)

/**
 * Finds every ERROR and WARNING in a SAS log, and every notable note.
 *
 * The issue list is in log order. `line` and `column` address the text as
 * supplied, so a caller can offset a decoration or a diagnostic by them
 * directly. A host that wants errors only filters on `severity`; nothing is
 * behind an option, because a notable note is worth reporting wherever the log
 * is shown.
 *
 * The text is never split into lines: a log is often megabytes, and a pass that
 * builds an array of its lines costs more than the scan and hands the collector
 * a million strings. One global match walks the text, the line number is counted
 * forward from the previous match, and only the lines a message needs are sliced.
 */
export const parseLog = (text: string): LogIssue[] => {
  if (!text) {
    return []
  }

  const issues: LogIssue[] = []
  let line = 0
  let countedTo = 0
  let match: RegExpExecArray | null

  SCAN.lastIndex = 0

  while ((match = SCAN.exec(text)) !== null) {
    const markerStart = match.index

    // Lines between the last block and this marker.
    for (
      let index = text.indexOf('\n', countedTo);
      index !== -1 && index < markerStart;
      index = text.indexOf('\n', index + 1)
    ) {
      line++
    }

    const markerEnd = lineEnd(text, markerStart)
    const endIndex = markerEnd === -1 ? text.length : markerEnd
    const markerLine = line

    let message = clean(match[7])
    let endLine = markerLine
    let cursor = endIndex + 1
    let wrapped = 0

    while (cursor <= text.length && wrapped < MAX_WRAPPED_LINES) {
      const nextEnd = lineEnd(text, cursor)
      const sliceEnd = nextEnd === -1 ? text.length : nextEnd
      const candidate = withoutCr(text, cursor, sliceEnd)

      if (!isWrappedLine(candidate)) {
        break
      }

      const part = clean(candidate)
      if (part !== '') {
        message = message === '' ? part : `${message} ${part}`
      }

      endLine++
      wrapped++
      cursor = sliceEnd + 1
    }

    // The lines folded into this message belong to it whether or not it is
    // reported, so the scan resumes after them either way.
    SCAN.lastIndex = cursor
    countedTo = cursor
    line = endLine + 1

    // A marker with nothing after it is not a message: SAS does not print a bare
    // `ERROR` or `ERROR:` line, and an empty issue would reach a host as a blank
    // line in its problem list.
    if (message === '') {
      continue
    }

    const severity: LogSeverity = match[2]
      ? match[2] === 'ERROR'
        ? 'error'
        : 'warning'
      : 'note'

    if (severity === 'note' && !isNotableNote(message)) {
      continue
    }

    const code = match[3] ?? match[6]
    const issue: LogIssue = {
      line: markerLine,
      endLine,
      column: match[1].length,
      // The whole match is the line's text: `$` stops before the `\r` of a CRLF.
      endColumn: match[0].length,
      severity,
      message
    }

    if (code) {
      issue.code = code
    }

    issues.push(issue)
  }

  return issues
}

/**
 * The issue after (or before) a given line, wrapping around, which is the
 * behaviour both a "next problem" button and a "previous problem" button need.
 *
 * A line of -1 starts at the beginning, and a line past the end starts again
 * from the beginning, so a caller does not have to special-case either end.
 * Returns undefined only when the log holds no issues.
 */
export const nextIssue = (
  issues: LogIssue[],
  line: number,
  direction: IssueDirection = 'next'
): LogIssue | undefined => {
  if (issues.length === 0) {
    return undefined
  }

  if (direction === 'next') {
    return issues.find((issue) => issue.line > line) ?? issues[0]
  }

  for (let index = issues.length - 1; index >= 0; index--) {
    if (issues[index].line < line) {
      return issues[index]
    }
  }

  return issues[issues.length - 1]
}
