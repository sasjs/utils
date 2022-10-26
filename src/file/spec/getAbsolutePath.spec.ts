import { getAbsolutePath } from '../getAbsolutePath'
import path from 'path'

describe('getAbsolutePath', () => {
  it('should return absolute path in normalized form', () => {
    expect(getAbsolutePath('~/..', '')).toBeTruthy()
  })

  it('should return joined path when provided path is not absolute path', () => {
    expect(getAbsolutePath('utils', 'sasjs')).toEqual(
      path.join('sasjs', 'utils')
    )
  })
})
