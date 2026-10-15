import { newLine } from './'

describe('newLine', () => {
  const realProcess = global.process

  afterEach(() => {
    global.process = realProcess
  })

  it('should return correct new line regexp entry for windows', () => {
    Object.defineProperty(process, 'platform', {
      value: 'win32'
    })

    expect(newLine()).toEqual('\\r\\n')
  })

  it('should return correct new line regexp entry for darwin', () => {
    Object.defineProperty(process, 'platform', {
      value: 'darwin'
    })

    expect(newLine()).toEqual('\\n')
  })

  it('should return the unix new line when there is no process', () => {
    // The formatter runs in browsers too, where process does not exist. This
    // is the case that used to throw a ReferenceError.
    // @ts-expect-error - simulating a browser, which has no process object
    delete global.process

    expect(newLine()).toEqual('\\n')
  })
})
