import { diff } from '../diff'

describe('diff', () => {
  it('should return the difference of two arrays', () => {
    expect(diff(['a', 'b', 'c'], ['c', 'd', 'e'])).toEqual(['a', 'b', 'd', 'e'])
    expect(diff([{ a: 1 }, { b: 2 }], [{ b: 2 }, { c: 3 }])).toEqual([
      { a: 1 },
      { c: 3 }
    ])
  })
})
