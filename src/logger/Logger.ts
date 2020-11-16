import { LogLevel } from './LogLevel'
import { LogOutput } from './LogOutput'
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

  get logOutput() {
    return this._logOutput
  }

  set logOutput(value: LogOutput) {
    this._logOutput = value
  }

  private _logOutput: LogOutput = console

  debug = (message: string): void => {
    if (isLowerThanOrEqualTo(this.logLevel, LogLevel.Debug)) {
      this.logOutput.debug(`DEBUG: ${message}`)
    }
  }

  info = (message: string): void => {
    if (isLowerThanOrEqualTo(this.logLevel, LogLevel.Info)) {
      this.logOutput.debug(`INFO: ${message}`)
    }
  }

  warn = (message: string): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Warn)) {
      this.logOutput.warn(`WARNING: ${message}`)
    }
  }

  error = (message: string): void => {
    if (isLowerThanOrEqualTo(this.logLevel, LogLevel.Error)) {
      this.logOutput.error(`ERROR: ${message}`)
    }
  }
}
