import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { clearFileSearchIndex, findFilesByName } from '../file'

describe('findFilesByName', () => {
  let root: string

  beforeEach(() => {
    clearFileSearchIndex()

    root = fs.mkdtempSync(path.join(os.tmpdir(), 'find-files-'))
    fs.mkdirsSync(path.join(root, 'nested', 'deeper'))
    fs.writeFileSync(path.join(root, 'target.sas'), '')
    fs.writeFileSync(path.join(root, 'other.sas'), '')
    fs.writeFileSync(path.join(root, 'nested', 'target.sas'), '')
    fs.writeFileSync(path.join(root, 'nested', 'deeper', 'target.sas'), '')
  })

  afterEach(() => fs.removeSync(root))

  it('finds every matching file at or below the folder', () => {
    const found = findFilesByName('target.sas', root)

    expect(found).toHaveLength(3)
    expect(found).toEqual(
      expect.arrayContaining([
        path.join(root, 'target.sas'),
        path.join(root, 'nested', 'target.sas'),
        path.join(root, 'nested', 'deeper', 'target.sas')
      ])
    )
  })

  it('matches on the whole file name, not a prefix', () => {
    expect(findFilesByName('other.sas', root)).toEqual([
      path.join(root, 'other.sas')
    ])
  })

  it('returns an empty array when nothing matches', () => {
    expect(findFilesByName('absent.sas', root)).toEqual([])
  })

  it('returns an empty array for a folder that does not exist', () => {
    expect(
      findFilesByName('target.sas', path.join(root, 'no-such-dir'))
    ).toEqual([])
  })

  it('walks the folder once and answers later lookups from the index', () => {
    const readdir = jest.spyOn(fs, 'readdirSync')

    findFilesByName('target.sas', root)

    const afterFirstLookup = readdir.mock.calls.length
    expect(afterFirstLookup).toBeGreaterThan(0)

    findFilesByName('other.sas', root)
    findFilesByName('absent.sas', root)

    expect(readdir.mock.calls.length).toEqual(afterFirstLookup)
  })

  it('keeps the result a copy, so a caller cannot change what the index answers', () => {
    const found = findFilesByName('other.sas', root)
    found.push('not-a-real-path')

    expect(findFilesByName('other.sas', root)).toEqual([
      path.join(root, 'other.sas')
    ])
  })

  it('sees a file added after indexing only once the index is cleared', () => {
    expect(findFilesByName('added.sas', root)).toEqual([])

    const addedPath = path.join(root, 'nested', 'added.sas')
    fs.writeFileSync(addedPath, '')

    // The folder was indexed before the file existed, so the stale answer stands
    // until the caller says the tree changed.
    expect(findFilesByName('added.sas', root)).toEqual([])

    clearFileSearchIndex()

    expect(findFilesByName('added.sas', root)).toEqual([addedPath])
  })

  it('does not remember a folder that could not be read', () => {
    const lateFolder = path.join(root, 'created-later')

    expect(findFilesByName('late.sas', lateFolder)).toEqual([])

    fs.mkdirsSync(lateFolder)
    fs.writeFileSync(path.join(lateFolder, 'late.sas'), '')

    // No clearFileSearchIndex() here: a failed walk is not a cacheable answer.
    expect(findFilesByName('late.sas', lateFolder)).toEqual([
      path.join(lateFolder, 'late.sas')
    ])
  })

  it('matches file names case-sensitively on every platform', () => {
    // A folder of its own: on a case-insensitive filesystem a `Target.sas`
    // written beside the `target.sas` above would open that same file, leaving
    // nothing mixed-case to look for.
    const mixedCaseFolder = path.join(root, 'mixedcase')
    fs.mkdirsSync(mixedCaseFolder)
    fs.writeFileSync(path.join(mixedCaseFolder, 'MixedCase.sas'), '')

    expect(findFilesByName('MixedCase.sas', mixedCaseFolder)).toEqual([
      path.join(mixedCaseFolder, 'MixedCase.sas')
    ])

    // The comparison is exact, not case-folded, so a dependency declared in a
    // different case fails to resolve identically on Windows and on Linux.
    expect(findFilesByName('mixedcase.sas', mixedCaseFolder)).toEqual([])
  })
})
