import { asyncForEach, uuidv4, isWindows, isLinux } from './utils'

describe('uuidv4', () => {
  it('should generate 10000 uniq UUID', () => {
    const uuids = []

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
