import {
  asyncForEach,
  uuidv4,
  isWindows,
  isLinux,
  getOSSpecificPath
} from './utils'
import * as utilsModule from './utils'

describe('uuidv4', () => {
  it('should generate 10000 uniq UUID', () => {
    const uuids: string[] = []

    for (let i = 0; i < 10 * 1000; i++) {
      const uuid = uuidv4()

      expect(uuids.includes(uuid)).toEqual(false)

      uuids.push(uuid)
    }
  })
})

describe('asyncForEach', () => {
  it('should execute promises sequentially', async () => {
    const chars = ['a', 'b', 'c', 'd', 'e']
    const expectedResult = chars.slice()
    const result: string[] = []

    const promise = async (char: string) => result.push(char)

    await asyncForEach(chars, promise)

    expect(result).toEqual(expectedResult)
  })
})

describe('isWindows', () => {
  it('should return if current operation system is windows', () => {
    expect(isWindows()).toEqual(process.platform === 'win32')
  })
})

describe('isLinux', () => {
  it('should return if current operation system is linux', () => {
    expect(isLinux()).toEqual(process.platform === 'linux')
  })
})

describe('getOSSpecificPath', () => {
  describe('when platform is win32', () => {
    it('should return the path with double backslashes', () => {
      jest.spyOn(utilsModule, 'isWindows').mockImplementationOnce(() => true)
      const path = 'some\\file\\path'
      expect(getOSSpecificPath(path)).toEqual('some\\\\file\\\\path')
    })
  })

  describe('when platform is not win32', () => {
    it('should return the path as it is ', () => {
      jest.spyOn(utilsModule, 'isWindows').mockImplementationOnce(() => false)
      const path = 'some/file/path'
      expect(getOSSpecificPath(path)).toEqual(path)
    })
  })
})
