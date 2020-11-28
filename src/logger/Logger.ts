import consola from 'consola'
import { LogLevel } from './LogLevel'
import { isLowerThanOrEqualTo } from './isLowerThanOrEqualTo'

export class Logger {
  constructor(logLevel?: LogLevel) {
    if (logLevel) {
      this._logLevel = logLevel
    }
  }

  get logLevel() {
    return this._logLevel
  }

  set logLevel(value: LogLevel) {
    this._logLevel = value
  }

  private _logLevel: LogLevel = LogLevel.Error

  debug = (message: string): void => {
    if (isLowerThanOrEqualTo(this.logLevel, LogLevel.Debug)) {
      consola.debug(message)
    }
  }

  info = (message: string): void => {
    if (isLowerThanOrEqualTo(this.logLevel, LogLevel.Info)) {
      consola.info(message)
    }
  }

  success = (message: string): void => {
    if (isLowerThanOrEqualTo(this.logLevel, LogLevel.Info)) {
      consola.success(message)
    }
  }

  warn = (message: string): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Warn)) {
      consola.warn(message)
    }
  }

  error = (message: string): void => {
    if (isLowerThanOrEqualTo(this.logLevel, LogLevel.Error)) {
      consola.error(message)
    }
  }
}
