import { isLinux, isWindows } from './utils'

describe('platform helpers', () => {
  const realProcess = global.process

  afterEach(() => {
    global.process = realProcess
  })

  it('reports windows from process.platform', () => {
    Object.defineProperty(process, 'platform', { value: 'win32' })

    expect(isWindows()).toBe(true)
    expect(isLinux()).toBe(false)
  })

  it('reports linux from process.platform', () => {
    Object.defineProperty(process, 'platform', { value: 'linux' })

    expect(isWindows()).toBe(false)
    expect(isLinux()).toBe(true)
  })

  it('answers false for both when there is no process', () => {
    // These helpers are exported from the package root and called from browser
    // code, where process does not exist. This is the case that used to throw
    // a ReferenceError.
    // @ts-expect-error - simulating a browser, which has no process object
    delete global.process

    expect(isWindows()).toBe(false)
    expect(isLinux()).toBe(false)
  })
})
