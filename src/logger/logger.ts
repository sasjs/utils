import consola from 'consola'
import { isLowerThanOrEqualTo } from './isLowerThanOrEqualTo'
import { isNullOrUndefined } from './isNullOrUndefined'
import { LogLevel } from './logLevel'
import { sanitizeSpecialChars } from '../formatter'
import cliTable from 'cli-table'
import chalk from 'chalk'

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
      consola.debug(message, ...this.filterArgs(args))
    }
  }

  info = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Info)) {
      consola.info(message, ...this.filterArgs(args))
    }
  }

  success = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Info)) {
      consola.success(message, ...this.filterArgs(args))
    }
  }

  warn = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Warn)) {
      consola.warn(message, ...args)
    }
  }

  error = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Error)) {
      consola.error(message, ...this.filterArgs(args))
    }
  }

  log = (message: string, ...args: any): void => {
    consola.log(message, ...this.filterArgs(args))
  }

  table = (
    data: string[][],
    options?: { chars?: {}; head?: string[] },
    disableStyling?: boolean
  ) => {
    const defaultOptions = {
      chars: {
        top: '═',
        'top-mid': '╤',
        'top-left': '╔',
        'top-right': '╗',
        bottom: '═',
        'bottom-mid': '╧',
        'bottom-left': '╚',
        'bottom-right': '╝',
        left: '║',
        'left-mid': '╟',
        mid: '─',
        'mid-mid': '┼',
        right: '║',
        'right-mid': '╢',
        middle: '│'
      },
      head: []
    }

    let table: cliTable

    if (options && Object.keys(options).length) {
      table = new cliTable({
        chars: options.chars || defaultOptions.chars,
        head:
          options.head?.map((header: string) => chalk.white.bold(header)) ||
          defaultOptions.head
      })
    } else {
      table = new cliTable({
        chars: defaultOptions.chars
      })
    }

    data.forEach((item) => table.push(item))

    this.log(
      (disableStyling
        ? sanitizeSpecialChars(table.toString())
        : table.toString()) + '\n'
    )
  }

  private filterArgs(args: any[]) {
    return args.filter((arg: any) => (arg ? arg : false))
  }
}
