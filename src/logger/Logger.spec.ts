import consola from 'consola'
import { Logger, LogLevel } from '.'
import chalk from 'chalk'
import { sanitizeSpecialChars } from '../formatter'

jest.mock('consola')

describe('Logger', () => {
  it('should set the log level', () => {
    const logger = new Logger()

    logger.logLevel = LogLevel.Off

    expect(logger.logLevel).toEqual(LogLevel.Off)
  })

  it('should log warnings when the log level is below Warn', () => {
    const logger = new Logger()
    logger.logLevel = LogLevel.Debug
    jest.spyOn(consola, 'warn')

    logger.warn('This is a warning.')

    expect(consola.warn).toHaveBeenCalledTimes(1)
  })

  it('should not log warnings when the log level is above Warn', () => {
    const logger = new Logger(LogLevel.Error)
    jest.spyOn(consola, 'warn')

    logger.warn('This is a warning.')

    expect(consola.warn).not.toHaveBeenCalled()
  })

  it('should log errors when the log level is Warn', () => {
    const logger = new Logger(LogLevel.Warn)
    jest.spyOn(consola, 'error')

    logger.error('This is an error.')

    expect(consola.error).toHaveBeenCalledTimes(1)
  })

  it('should not log errors when the log level is Off', () => {
    const logger = new Logger(LogLevel.Off)
    jest.spyOn(consola, 'error')

    logger.error('This is an error.')

    expect(consola.error).not.toHaveBeenCalled()
  })

  it('should log info messages when the log level is Info', () => {
    const logger = new Logger(LogLevel.Info)
    jest.spyOn(consola, 'info')

    logger.info('This is info.')

    expect(consola.info).toHaveBeenCalledTimes(1)
  })

  it('should not log info messages when the log level is Error', () => {
    const logger = new Logger(LogLevel.Error)
    jest.spyOn(consola, 'info')

    logger.info('This is info.')

    expect(consola.info).not.toHaveBeenCalled()
  })

  it('should log debug messages when the log level is Debug', () => {
    const logger = new Logger(LogLevel.Debug)
    jest.spyOn(consola, 'debug')

    logger.debug('This is debug.')

    expect(consola.debug).toHaveBeenCalledTimes(1)
  })

  it('should log debug messages when the log level is Trace', () => {
    const logger = new Logger(LogLevel.Trace)
    jest.spyOn(consola, 'debug')

    logger.debug('This is debug.')

    expect(consola.debug).toHaveBeenCalledTimes(1)
    expect(consola.debug).toHaveBeenCalledWith('This is debug.')
  })

  it('should log trace messages when the log level is Trace', () => {
    const logger = new Logger(LogLevel.Trace)
    jest.spyOn(consola, 'debug')

    logger.trace('This is trace.')

    expect(consola.debug).toHaveBeenCalledTimes(1)
    expect(consola.debug).toHaveBeenCalledWith('This is trace.')
  })

  it('should not log debug messages when the log level is Error', () => {
    const logger = new Logger(LogLevel.Error)
    jest.spyOn(consola, 'debug')

    logger.debug('This is debug.')

    expect(consola.debug).not.toHaveBeenCalled()
  })

  it('should log success messages when the log level is Debug', () => {
    const logger = new Logger(LogLevel.Debug)
    jest.spyOn(consola, 'success')

    logger.success('This is success.')

    expect(consola.success).toHaveBeenCalledTimes(1)
  })

  it('should log success messages when the log level is Trace', () => {
    const logger = new Logger(LogLevel.Trace)
    jest.spyOn(consola, 'success')

    logger.success('This is success.')

    expect(consola.success).toHaveBeenCalledTimes(1)
    expect(consola.success).toHaveBeenCalledWith('This is success.')
  })

  it('should not log success messages when the log level is Error', () => {
    const logger = new Logger(LogLevel.Error)
    jest.spyOn(consola, 'success')

    logger.success('This is success.')

    expect(consola.success).not.toHaveBeenCalled()
  })

  it('should log a message regardless of log level', () => {
    const logger = new Logger(LogLevel.Off)
    jest.spyOn(consola, 'log')

    logger.log('This is a log.')

    expect(consola.log).toHaveBeenCalledTimes(1)
  })

  it('should log correct error message when empty string has been provided as argument', () => {
    const logger = new Logger(LogLevel.Error)
    jest.spyOn(consola, 'error')

    const message = `'test_results' not found in server response, to debug click https://server.com/SASJobExecution/?_program=/Public/sasjs/jobs/tests/macros/friday.test&_debug=2477&_contextName=SAS%20Job%20Execution%20compute%20context`

    logger.error(message, '')

    expect(consola.error).toHaveBeenLastCalledWith(message)
  })

  it('should ignore not valid args', () => {
    const logger = new Logger(LogLevel.Error)

    expect(logger['filterArgs']([false, '', undefined, null, 'test'])).toEqual([
      'test'
    ])
  })

  describe('logger.table', () => {
    it('should log a table with default border style without head', () => {
      const logger = new Logger(LogLevel.Debug)
      jest.spyOn(consola, 'log')

      logger.table(
        [
          ['test_1_1', 'test_1_2'],
          ['test_2_1', 'tes_t2_2']
        ],
        {},
        true
      )

      const expectedOutput = sanitizeSpecialChars(`╔══════════╤══════════╗
║ test_1_1 │ test_1_2 ║
╟──────────┼──────────╢
║ test_2_1 │ tes_t2_2 ║
╚══════════╧══════════╝
`)

      expect(consola.log).toHaveBeenCalledTimes(1)
      expect(consola.log).toHaveBeenCalledWith(expectedOutput)
    })

    it('should log a table with default border style', () => {
      const logger = new Logger(LogLevel.Debug)
      jest.spyOn(consola, 'log')

      logger.table(
        [
          ['test_1_1', 'test_1_2'],
          ['test_2_1', 'tes_t2_2']
        ],
        { head: ['title 1', 'title 2'] },
        true
      )

      const expectedOutput = sanitizeSpecialChars(`╔══════════╤══════════╗
║ ${chalk.white.bold('title 1')}  │ ${chalk.white.bold('title 2')}  ║
╟──────────┼──────────╢
║ test_1_1 │ test_1_2 ║
╟──────────┼──────────╢
║ test_2_1 │ tes_t2_2 ║
╚══════════╧══════════╝
`)

      expect(consola.log).toHaveBeenCalledTimes(1)
      expect(consola.log).toHaveBeenCalledWith(expectedOutput)
    })

    it('should log a table with default border and special chars', () => {
      const logger = new Logger(LogLevel.Debug)
      jest.spyOn(consola, 'log')

      logger.table(
        [
          ['test_1_1', 'test_1_2'],
          ['test_2_1', 'tes_t2_2']
        ],
        { head: ['title 1', 'title 2'] }
      )

      const expectedOutput = sanitizeSpecialChars(`╔══════════╤══════════╗
║ ${chalk.white.bold('title 1')}  │ ${chalk.white.bold('title 2')}  ║
╟──────────┼──────────╢
║ test_1_1 │ test_1_2 ║
╟──────────┼──────────╢
║ test_2_1 │ tes_t2_2 ║
╚══════════╧══════════╝
`)

      expect(consola.log).toHaveBeenCalledTimes(1)

      try {
        expect(consola.log).toHaveBeenCalledWith(expectedOutput)
      } catch (error) {
        const err = (error as unknown) as any

        expect(err.matcherResult.pass).toEqual(false)
      }
    })

    it('should log a table with custom border style', () => {
      const logger = new Logger(LogLevel.Debug)
      jest.spyOn(consola, 'log')

      logger.table(
        [
          ['test_1_1', 'test_1_2'],
          ['test_2_1', 'tes_t2_2']
        ],
        {
          chars: { mid: '', 'left-mid': '', 'mid-mid': '', 'right-mid': '' }
        },
        true
      )

      const expectedOutput = sanitizeSpecialChars(`┌──────────┬──────────┐
│ test_1_1 │ test_1_2 │
│ test_2_1 │ tes_t2_2 │
└──────────┴──────────┘
`)

      expect(consola.log).toHaveBeenCalledTimes(1)
      expect(consola.log).toHaveBeenCalledWith(expectedOutput)
    })
  })
})
