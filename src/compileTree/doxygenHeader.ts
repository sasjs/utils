/** Where a doxygen header starts and where SAS actually ends it. */
export interface DoxygenHeader {
  /** Index of the `/*` that opens the header. */
  start: number
  /** Index of the comment terminator, as the SAS lexer sees it, or `null`. */
  close: number | null
  /** Index of a nested `/*` that closes before the header does, or `null`. */
  nestedComment: number | null
  /** Index of the first double-asterisk terminator at or after the close, or `null`. */
  terminator: number | null
}

const CLOSE = '*/'
const TERMINATOR = '**/'

const firstNonWhitespace = (content: string) => content.search(/\S/)

/**
 * Reads the doxygen header a file opens with.
 *
 * Returns `null` when the file does not open with a doxygen header (`/**`). A
 * plain block comment is not a header, and files that open with one are the
 * subject of the lint rule for header style, not of this check.
 */
export const getDoxygenHeader = (content: string): DoxygenHeader | null => {
  const start = firstNonWhitespace(content)

  if (start === -1 || !content.startsWith('/**', start)) return null

  const close = content.indexOf(CLOSE, start + 2)
  const nestedComment = content.indexOf('/*', start + 2)

  return {
    start,
    close: close === -1 ? null : close,
    nestedComment:
      nestedComment !== -1 && nestedComment < close ? nestedComment : null,
    terminator: close === -1 ? null : getOwnTerminator(content, close)
  }
}

// Finds the double-asterisk terminator that belongs to this header.
//
// Two things disqualify a candidate. It has to stand alone on its line, because
// the house style writes it that way and a terminator inside a statement ends
// that statement's comment. And it has to arrive before another header opens:
// one behind a later opener closes that header, not this one. Both bounds keep
// the verdict on one header local to it, so the same header is not reported or
// ignored depending on what happens to follow it.
const LATER_HEADER = /^[ \t]*\/\*\*/m

const getOwnTerminator = (content: string, close: number) => {
  let candidate = content.indexOf(TERMINATOR, close - 1)

  while (candidate !== -1) {
    const lineStart = content.lastIndexOf('\n', candidate - 1) + 1
    const lineLeading = !content.slice(lineStart, candidate).trim()

    // Another header opens before this candidate, so nothing beyond it can be
    // this header's end.
    if (LATER_HEADER.test(content.slice(close + 2, candidate))) return null

    if (lineLeading) return candidate

    candidate = content.indexOf(TERMINATOR, candidate + 1)
  }

  return null
}

const lineOf = (content: string, index: number) =>
  content.slice(0, index).split('\n').length

/**
 * Fails when a doxygen header is cut short.
 *
 * A header is a SAS block comment, and SAS block comments do not nest: the
 * first close marker ends the comment. A block comment inside the header ends
 * it at that inner marker, and so does header text holding a close marker. In
 * both cases the rest of the header is compiled as SAS. Without this the
 * failure lands hundreds of lines away from the header, named by nothing
 * useful.
 *
 * @param content - the raw content of a SAS file.
 * @param filePath - path reported in the error, when the caller knows it.
 */
export const throwIfDoxygenHeaderClosesEarly = (
  content: string,
  filePath?: string
) => {
  const header = getDoxygenHeader(content)

  // A header that closed at its own terminator was not cut short, and one with
  // no terminator carries no evidence that it was meant to continue.
  if (!header || header.close === null || header.terminator === null) return

  if (header.terminator === header.close - 1) return

  const nested = header.nestedComment
  const label = filePath ? `${filePath}: ` : ''
  const closeLine = lineOf(content, header.close)
  const terminatorLine = lineOf(content, header.terminator)

  // The terminator stands alone on its line and the close marker is not
  // whitespace, so the two are always on different lines.
  const affected = `lines ${closeLine + 1}-${terminatorLine}`

  // `/*/` is a comment opener followed straight away by a close marker - the
  // shape a glob such as `src/*/file.sas` leaves in header text.
  const literalSequence = nested !== null && nested === header.close - 1
  const reword = literalSequence || nested === null

  const cause = literalSequence
    ? `the /*/ on line ${closeLine} holds that close marker.`
    : nested === null
      ? `the close marker on line ${closeLine} is text in the header.`
      : `the close marker on line ${closeLine} belongs to the block comment opened ${
          lineOf(content, nested) === closeLine
            ? 'on the same line'
            : `at line ${lineOf(content, nested)}`
        }.`

  throw new Error(
    `${label}the doxygen header is closed at line ${closeLine}, before its **/ terminator at line ${terminatorLine}: ` +
      `${cause} ` +
      `SAS block comments do not nest - a block comment ends at the first close marker it meets - so ${affected} - including the header's closing **/ - would be compiled as SAS. ` +
      (reword
        ? `Reword the header text so that it holds no comment terminator.`
        : `Remove the block comment from the header, or move it below the header.`)
  )
}
