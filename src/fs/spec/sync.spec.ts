import path from 'path'
import {
  generateProgramToGetRemoteHash,
  generateProgramToSyncHashDiff,
  findResourcesNotPresentLocally
} from '../sync'
import { getHash } from '../hash'
import { createFile, readFile } from '../../file'

describe('generateProgramToGetRemoteHash', () => {
  it('should return a sas program to get hashes from remote server', async () => {
    const expectedProgram = await readFile(
      path.join(__dirname, 'files', 'getRemoteHash.sas')
    )
    const program = await generateProgramToGetRemoteHash('/tmp/remote/path')

    expect(program).toEqual(expectedProgram)
  })
})

describe('generateProgramToSyncHashDiff', () => {
  it('should return a sas program that syncs hash differences to remote server', async () => {
    const hashedFolder = await getHash(path.join(__dirname, 'hashFolder'))
    const expectedProgram = await readFile(
      path.join(__dirname, 'files', 'syncHashDiff.sas')
    )
    const program = await generateProgramToSyncHashDiff(
      hashedFolder,
      '/tmp/remote/path'
    )

    expect(program).toEqual(expectedProgram)
  })
})

describe('findResourcesNotPresentLocally', () => {
  it('should return a sas program that syncs hash differences to remote server', async () => {
    const hashedFolder = await getHash(path.join(__dirname, 'hashFolder'))
    const resourcesNotPresentLocally = findResourcesNotPresentLocally(
      hashedFolder,
      { './file/not/exists': 'HashString' }
    )

    expect(resourcesNotPresentLocally).toEqual(['./file/not/exists'])
  })
})
