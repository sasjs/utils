import consola from 'consola'
import { isLowerThanOrEqualTo } from './isLowerThanOrEqualTo'
import { isNullOrUndefined } from './isNullOrUndefined'
import { LogLevel } from './logLevel'

export class Logger {
  constructor(logLevel?: LogLevel) {
    if (!isNullOrUndefined(logLevel) && logLevel! in LogLevel) {
      this._logLevel = logLevel as LogLevel
    }
  }

  get logLevel() {
    return this._logLevel
  }

  set logLevel(value: LogLevel) {
    this._logLevel = value
  }

  private _logLevel: LogLevel = LogLevel.Error

  debug = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Debug)) {
      consola.debug(message, ...args)
    }
  }

  info = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Info)) {
      consola.info(message, ...args)
    }
  }

  success = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Info)) {
      consola.success(message, ...args)
    }
  }

  warn = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Warn)) {
      consola.warn(message, ...args)
    }
  }

  error = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Error)) {
      consola.error(message, ...args)
    }
  }

  log = (message: string, ...args: any): void => {
    consola.log(message, ...args)
  }
}
