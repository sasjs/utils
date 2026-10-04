import { consola } from 'consola'
import { isLowerThanOrEqualTo } from './isLowerThanOrEqualTo'
import { isNullOrUndefined } from './isNullOrUndefined'
import { LogLevel } from './logLevel'
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

  trace = (message: string, ...args: any): void => {
    if (isLowerThanOrEqualTo(this._logLevel, LogLevel.Trace)) {
      consola.debug(message, ...this.filterArgs(args))
    }
  }

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
      consola.warn(message, ...this.filterArgs(args))
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

  /**
   * Prints rows as aligned columns, separated by two spaces. When `head` is
   * given it is printed first, underlined with dashes.
   *
   * Cells may carry colour codes, which occupy no screen columns, so column
   * widths are measured on the text with the codes removed.
   */
  table = (data: string[][], options?: { head?: string[] }) => {
    const head = options?.head?.map((header: string) =>
      chalk.white.bold(header)
    )
    const rows = head?.length ? [head, ...data] : data

    const widths: number[] = []
    rows.forEach((row) =>
      row.forEach((cell, column) => {
        widths[column] = Math.max(widths[column] || 0, this.visibleLength(cell))
      })
    )

    const lines = rows.map((row) =>
      row
        .map(
          (cell, column) =>
            cell +
            ' '.repeat(Math.max(0, widths[column] - this.visibleLength(cell)))
        )
        .join('  ')
        .trimEnd()
    )

    if (head?.length) {
      lines.splice(1, 0, widths.map((width) => '-'.repeat(width)).join('  '))
    }

    this.log(lines.join('\n') + '\n')
  }

  private visibleLength(value: string) {
    return String(value).replace(/\u001b\[[0-9;]*m/g, '').length
  }

  private filterArgs(args: any[]) {
    return args.filter((arg: any) => (arg ? arg : false))
  }
}
