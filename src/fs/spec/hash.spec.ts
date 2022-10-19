import path from 'path'
import { getHash } from '../getHash'

describe('getHash', () => {
  it('should return the hash of provided directory', async () => {
    const hashedFolder = await getHash(path.join(__dirname, 'hashFolder'))
    const expectedHash = '74FFEA8EA05C42341754D6A4B01E90E5'
    const receivedHash = hashedFolder.hash
    expect(receivedHash).toEqual(expectedHash)
  })
})
