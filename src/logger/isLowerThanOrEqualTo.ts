import { LogLevel } from './logLevel'

export const isLowerThanOrEqualTo = (
  currentLevel: LogLevel,
  level: LogLevel
): boolean => {
  if (currentLevel === LogLevel.Off) {
    return false
  }

  if (currentLevel === LogLevel.Debug) {
    return true
  }

  if (currentLevel === LogLevel.Info) {
    return (
      level === LogLevel.Info ||
      level === LogLevel.Warn ||
      level === LogLevel.Error
    )
  }

  if (currentLevel === LogLevel.Warn) {
    return level === LogLevel.Warn || level === LogLevel.Error
  }

  return level === LogLevel.Error
}
