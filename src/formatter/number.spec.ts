import { padWithNumber } from './number'

describe('padWithNumber', () => {
  it('should pad with zero by default', () => {
    expect(padWithNumber(1)).toEqual('01')
  })

  it('should not pad number that is greater than 9', () => {
    expect(padWithNumber(10)).toEqual(10)
  })

  it('should pad number', () => {
    expect(padWithNumber(5, 6)).toEqual('65')
  })
})
