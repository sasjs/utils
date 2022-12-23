import path from 'path'
import { getHash, compareHashes, extractHashArray } from '../hash'

const webout = {
  hashes: [
    {
      DIRECTORY: '/export/pvs/sasdata/homes/viyademo08f/stephan/extract',
      FILE_HASH: 'F041B4AF15A7F844D20F45BA4F5EE1B4',
      HASH_DURATION: 0.0069699287,
      FILE_PATH:
        '/export/pvs/sasdata/homes/viyademo08f/stephan/extract/makedata2.sas',
      FILE_OR_FOLDER: 'file',
      LEVEL: 1
    },
    {
      DIRECTORY: '/export/pvs/sasdata/homes/viyademo08f/stephan/load',
      FILE_HASH: '616C9FA7A70C53AF4D335BE546B62441',
      HASH_DURATION: 0.007089138,
      FILE_PATH:
        '/export/pvs/sasdata/homes/viyademo08f/stephan/load/runjob1.test.sas',
      FILE_OR_FOLDER: 'file',
      LEVEL: 1
    }
  ]
}

describe('getHash', () => {
  it('should return the hash of provided directory', async () => {
    const hashedFolder = await getHash(path.join(__dirname, 'hashFolder'))
    const expectedHash = '74FFEA8EA05C42341754D6A4B01E90E5'
    const receivedHash = hashedFolder.hash
    expect(receivedHash).toEqual(expectedHash)
  })
})

describe('compareHashes', () => {
  it('should return hashed folder tree with nodes either not existing in remoteHashMap or their hashes mismatch', async () => {
    const hashedFolder = await getHash(path.join(__dirname, 'hashFolder'))
    const hashedDiff = compareHashes(hashedFolder, {})
    expect(hashedDiff).toEqual(hashedFolder)
  })
})

describe('extractHashArray', () => {
  it('should extract and return a hash array', () => {
    const logContent = `>>weboutBEGIN<<\n${JSON.stringify(
      webout
    )}\n>>weboutEND<<\n`
    const hashes = extractHashArray(logContent)
    expect(hashes).toEqual(webout.hashes)
  })

  it('should throw an error when webout is not valid json', () => {
    const logContent = `>>weboutBEGIN<<\n${webout}\n>>weboutEND<<\n`
    expect(() => extractHashArray(logContent)).toThrowError(
      `An error occurred while extracting hashes array from webout: "[object Object]" is not valid JSON`
    )
  })
})
