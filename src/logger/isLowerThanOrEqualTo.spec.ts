import { isLowerThanOrEqualTo } from './isLowerThanOrEqualTo'
import { LogLevel } from './logLevel'

describe('isLowerThanOrEqualTo', () => {
  it('should return false when the current level is OFF', () => {
    const currentLevel = LogLevel.Off
    const level = LogLevel.Debug

    const result = isLowerThanOrEqualTo(currentLevel, level)

    expect(result).toBeFalsy()
  })

  it('should return true when the current level is DEBUG', () => {
    const currentLevel = LogLevel.Debug
    const level = LogLevel.Error

    const result = isLowerThanOrEqualTo(currentLevel, level)

    expect(result).toBeTruthy()
  })

  it('should return true when the current level is lower than the level passed in', () => {
    const currentLevel = LogLevel.Warn
    const level = LogLevel.Error

    const result = isLowerThanOrEqualTo(currentLevel, level)

    expect(result).toBeTruthy()
  })

  it('should return true when the current level is lower than the level passed in', () => {
    const currentLevel = LogLevel.Info
    const level = LogLevel.Error

    const result = isLowerThanOrEqualTo(currentLevel, level)

    expect(result).toBeTruthy()
  })

  it('should return true when the current level is equal to the level passed in', () => {
    const currentLevel = LogLevel.Warn
    const level = LogLevel.Warn

    const result = isLowerThanOrEqualTo(currentLevel, level)

    expect(result).toBeTruthy()
  })

  it('should return false when the current level is higher than the level passed in', () => {
    const currentLevel = LogLevel.Error
    const level = LogLevel.Warn

    const result = isLowerThanOrEqualTo(currentLevel, level)

    expect(result).toBeFalsy()
  })
})
