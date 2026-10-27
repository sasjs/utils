import {
  getDoxygenHeader,
  throwIfDoxygenHeaderClosesEarly
} from './doxygenHeader'

const header = `/**
  @file test.sas
  @brief Example
  @details some details

  <h4> SAS Macros </h4>
  @li example.sas

**/
%example()`

// Line 1 opens the header, line 7 holds the nested comment, line 14 holds the
// terminator.
const nestedHeader = `/**
  @file test.sas
  @brief Example
  @details Usage:

      %my_macro(outlib=web1)
      /* reaching here means the child completed */
      data _null_;
        set work.status;
      run;

  @param [in] outlib Output libref

**/

%macro my_macro(outlib=0);
  %put outlib = &outlib;
%mend my_macro;`

describe('getDoxygenHeader', () => {
  it('should return null for content without a header comment', () => {
    expect(getDoxygenHeader('%macro mf_test(); %mend;')).toBeNull()
  })

  it('should return null for empty content', () => {
    expect(getDoxygenHeader('')).toBeNull()
    expect(getDoxygenHeader('  \n\n\t ')).toBeNull()
  })

  it('should report an unterminated header without a close or terminator', () => {
    expect(getDoxygenHeader('/**\n  @file test.sas\n')).toEqual({
      start: 0,
      close: null,
      nestedComment: null,
      terminator: null
    })
  })

  it('should report no nested comment for an unterminated header', () => {
    // Nothing closes, so nothing is truncated: the `/*` is text in a comment
    // that runs to the end of the file.
    expect(
      getDoxygenHeader('/**\n  @file test.sas\n  /* inner comment\n')
    ).toEqual({
      start: 0,
      close: null,
      nestedComment: null,
      terminator: null
    })
  })

  it('should not treat a plain block comment as a header', () => {
    // The reviewer case: an ordinary comment that holds a `/*`, ahead of a
    // doxygen header further down the file. Nothing here is a doxygen header
    // closing early, so nothing is reported.
    const content = `/* a note
  /* with a nested opener */
*/
data a;
run;

/**
  @file test.sas
**/
%example()`

    expect(getDoxygenHeader(content)).toBeNull()
    expect(() => throwIfDoxygenHeaderClosesEarly(content)).not.toThrow()
  })

  it('should locate the header after a single leading space', () => {
    expect(getDoxygenHeader(` ${header}`)?.start).toBe(1)
  })

  it('should not take a terminator that shares its line with code', () => {
    // The house style stands the terminator alone on its line; a `**/` with
    // code around it belongs to that code.
    expect(getDoxygenHeader('/**/%example()')).toEqual({
      start: 0,
      close: 2,
      nestedComment: null,
      terminator: null
    })
  })

  it('should locate the header after leading whitespace', () => {
    const offset = 4
    const headerInfo = getDoxygenHeader(`\n\n  ${header}`)

    expect(headerInfo).toEqual({
      start: offset,
      close: offset + header.indexOf('**/') + 1,
      nestedComment: null,
      terminator: offset + header.indexOf('**/')
    })
  })

  it('should find a terminator that is indented rather than at line start', () => {
    const content = `/**
  @file test.sas
  **/
%example()`

    expect(getDoxygenHeader(content)?.terminator).toBe(content.indexOf('**/'))
  })

  it('should report no nested comment for a well formed header', () => {
    expect(getDoxygenHeader(header)?.nestedComment).toBeNull()
  })

  it('should report the nested comment that truncates the header', () => {
    const headerInfo = getDoxygenHeader(nestedHeader)

    expect(headerInfo?.nestedComment).toBe(
      nestedHeader.indexOf('/* reaching here')
    )
    expect(headerInfo?.close).toBe(
      nestedHeader.indexOf('completed */') + 'completed '.length
    )
    expect(headerInfo?.terminator).toBe(nestedHeader.indexOf('\n**/') + 1)
  })

  it('should treat a literal /* as header text when the terminator closes first', () => {
    // The terminator is the first close marker, so nothing is truncated - the
    // `/*` is header text that SAS never acts on.
    const content = `/**
  @file test.sas
  @details use /* to open a comment
  @brief Example
**/
%example()`

    expect(getDoxygenHeader(content)?.close).toBe(content.indexOf('**/') + 1)
    expect(() => throwIfDoxygenHeaderClosesEarly(content)).not.toThrow()
  })
})

describe('throwIfDoxygenHeaderClosesEarly', () => {
  it('should not throw for content without a header', () => {
    expect(() =>
      throwIfDoxygenHeaderClosesEarly('%macro mf_test(); %mend;')
    ).not.toThrow()
  })

  it('should not throw for a well formed header', () => {
    expect(() => throwIfDoxygenHeaderClosesEarly(header)).not.toThrow()
  })

  it('should not throw for a header after leading line breaks and spaces', () => {
    expect(() =>
      throwIfDoxygenHeaderClosesEarly(`\n\n   ${header}`)
    ).not.toThrow()
  })

  it('should throw for a header truncated by a nested block comment', () => {
    expect(() => throwIfDoxygenHeaderClosesEarly(nestedHeader)).toThrow(
      /the doxygen header is closed at line 7, before its \*\*\/ terminator at line 14/
    )
  })

  it('should name the nested comment and the code that leaks into the compile', () => {
    expect(() => throwIfDoxygenHeaderClosesEarly(nestedHeader)).toThrow(
      /the close marker on line 7 belongs to the block comment opened on the same line\. SAS block comments do not nest - a block comment ends at the first close marker it meets - so lines 8-14 - including the header's closing \*\*\/ - would be compiled as SAS\. Remove the block comment from the header, or move it below the header\./
    )
  })

  it('should report where a nested comment opens and closes when they differ', () => {
    const content = `/**
  @file test.sas
  @brief Example
  @details a comment spanning two lines:

      /* this one starts here
         and ends here */
      data _null_;
      run;

**/

%example()`

    expect(() => throwIfDoxygenHeaderClosesEarly(content)).toThrow(
      /the doxygen header is closed at line 7, before its \*\*\/ terminator at line 11: the close marker on line 7 belongs to the block comment opened at line 6\. SAS block comments do not nest - a block comment ends at the first close marker it meets - so lines 8-11 - including/
    )
  })

  it('should report a glob that carries a comment terminator as literal text', () => {
    // `src/*/file.sas` holds `/*/`, which SAS reads as an opener followed by a
    // close marker. The header really does end there, but nothing opened a
    // comment, so the remedy is the wording rather than the comment.
    const content = `/**
  @file test.sas
  @details outputs land in src/*/file.sas
  @brief Example

**/
%example()`

    expect(() => throwIfDoxygenHeaderClosesEarly(content)).toThrow(
      /the doxygen header is closed at line 3, before its \*\*\/ terminator at line 6: the \/\*\/ on line 3 holds that close marker\./
    )
    expect(() => throwIfDoxygenHeaderClosesEarly(content)).toThrow(
      /Reword the header text so that it holds no comment terminator\./
    )
  })

  it('should not take a later header terminator as its own', () => {
    // The verdict on one header is local to it: the `**/` below belongs to the
    // second header, so it says nothing about the first one's extent.
    const content = `/**
  @file a.sas
  @details a nested /* comment */
*/
%macro a; %mend;

/**
  @file b.sas
**/`

    expect(getDoxygenHeader(content)?.terminator).toBeNull()
    expect(() => throwIfDoxygenHeaderClosesEarly(content)).not.toThrow()
  })

  it('should name the file when a path is given', () => {
    expect(() =>
      throwIfDoxygenHeaderClosesEarly(nestedHeader, 'src/services/test.sas')
    ).toThrow(
      /^src\/services\/test\.sas: the doxygen header is closed at line 7/
    )
  })

  it('should not take a literal **/ in code as the header terminator', () => {
    const content = `/**
  @file test.sas
  @brief Example
*/

data _null_;
  put 'a **/ marker';
run;`

    expect(getDoxygenHeader(content)?.terminator).toBeNull()
    expect(() => throwIfDoxygenHeaderClosesEarly(content)).not.toThrow()
  })

  it('should not name a file when no path is given', () => {
    expect(() => throwIfDoxygenHeaderClosesEarly(nestedHeader)).toThrow(
      /^the doxygen header is closed at line 7/
    )
  })

  it('should not throw when a literal **/ in code follows a header holding a /*', () => {
    // The header closes on its own plain close marker, and the `/*` is text.
    // A `**/` inside a later statement belongs to that statement.
    const content = `/**
  @file test.sas
  @details use /* to open a comment
  @brief Example
*/

data _null_;
  put 'a **/ marker';
run;`

    expect(() => throwIfDoxygenHeaderClosesEarly(content)).not.toThrow()
  })

  it('should report an inner snippet that closes with its own terminator', () => {
    // The snippet's `**/` ends the outer header just as a plain close marker
    // would, even though it looks like the terminator of a header.
    const content = `/**
  @details a snippet: /** @file x **/
  @brief Example

**/
%example()`

    expect(() => throwIfDoxygenHeaderClosesEarly(content)).toThrow(
      /the doxygen header is closed at line 2, before its \*\*\/ terminator at line 5: the close marker on line 2 belongs to the block comment opened on the same line\./
    )
  })

  it('should report header text that holds a close marker', () => {
    const content = `/**
  @file test.sas
  @details the close marker */ ends this header
  @brief Example

**/
%example()`

    expect(() => throwIfDoxygenHeaderClosesEarly(content)).toThrow(
      /the doxygen header is closed at line 3, before its \*\*\/ terminator at line 6: the close marker on line 3 is text in the header\./
    )
    expect(() => throwIfDoxygenHeaderClosesEarly(content)).toThrow(
      /Reword the header text so that it holds no comment terminator\./
    )
  })

  it('should not throw for a header closed by a single asterisk with no terminator', () => {
    // Nothing states the header was meant to continue, so this is a different
    // defect - the dependency lists are unreadable - and not a truncation.
    const content = `/**
  @file test.sas
  @details some /* detail */ here
*/
%example()`

    expect(() => throwIfDoxygenHeaderClosesEarly(content)).not.toThrow()
  })

  it('should not throw when the header closes before a later block comment', () => {
    const content = `/**
  @file test.sas
*/
/* a code comment */
data a;
run;

/**
  @file other.sas
**/`

    expect(() => throwIfDoxygenHeaderClosesEarly(content)).not.toThrow()
  })
})
