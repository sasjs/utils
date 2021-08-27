import { bytesToSize } from './bytesToSize'

describe('bytesToSize', () => {
  it('should Convert bytes to KB, MB, GB, TB', () => {
    expect(bytesToSize(1024)).toEqual('1.0 KB')
  })
})
