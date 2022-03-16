import { newLine } from './'

describe('newLine', () => {
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
})
