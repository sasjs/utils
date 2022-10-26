import { bytesToSize } from '../bytesToSize'

describe('bytesToSize', () => {
  it(`should Convert '1024' bytes to '1.0 KB'`, () => {
    expect(bytesToSize(1024)).toEqual('1.0 KB')
  })

  it(`should Convert '0 byte' to '0 B'`, () => {
    expect(bytesToSize(0)).toEqual('0 B')
  })

  it('should return maximum bytes if number of bytes are greater than maxValue', () => {
    expect(bytesToSize(1024 * 1024, 1, 1024)).toEqual('1.0 KB')
  })

  it('should return byte size with out decimal places', () => {
    expect(bytesToSize(1024, -1)).toEqual('1 KB')
  })
})
