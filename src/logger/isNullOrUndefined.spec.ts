import { isNullOrUndefined } from './isNullOrUndefined'

describe('isNullOrUndefined', () => {
  it('should return true when the value is null', () => {
    expect(isNullOrUndefined(null)).toBeTruthy()
  })

  it('should return true when the value is undefined', () => {
    expect(isNullOrUndefined(undefined)).toBeTruthy()
  })

  it('should return false when the value is 0', () => {
    expect(isNullOrUndefined(0)).toBeFalsy()
  })

  it('should return false when the value is a non-zero number', () => {
    expect(isNullOrUndefined(67)).toBeFalsy()
  })

  it('should return false when the value is the empty string', () => {
    expect(isNullOrUndefined('')).toBeFalsy()
  })

  it('should return false when the value is a non-empty string', () => {
    expect(isNullOrUndefined('test')).toBeFalsy()
  })
})
