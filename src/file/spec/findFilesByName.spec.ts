import fs from 'fs-extra'
import path from 'path'
import os from 'os'
import { findFilesByName } from '../file'

describe('findFilesByName', () => {
  let root: string

  beforeEach(() => {
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
})
