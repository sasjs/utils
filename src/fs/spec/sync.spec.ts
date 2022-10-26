import path from 'path'
import {
  generateProgramToGetRemoteHash,
  generateProgramToSyncHashDiff,
  findResourcesNotPresentLocally
} from '../sync'
import { getHash } from '../hash'

describe('generateProgramToGetRemoteHash', () => {
  it('should return a sas program to get hashes from remote server', async () => {
    const program = await generateProgramToGetRemoteHash('/tmp/remote/path')

    expect(program).toContain('%let fsTarget=/tmp/remote/path;')
    expect(program).toContain('%macro mp_hashdirectory')
    expect(program).toContain('%macro mp_jsonout')
  })
})

describe('generateProgramToSyncHashDiff', () => {
  it('should return a sas program that syncs hash differences to remote server', async () => {
    const hashedFolder = await getHash(path.join(__dirname, 'hashFolder'))
    const program = await generateProgramToSyncHashDiff(
      hashedFolder,
      '/tmp/remote/path'
    )

    expect(program).toContain('%let fsTarget=/tmp/remote/path;')
    expect(program).toContain('%macro mp_hashdirectory')
    expect(program).toContain('%macro mp_jsonout')
    expect(program).toContain('%macro mf_mkdir')
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
