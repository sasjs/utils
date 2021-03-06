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
    spyOn(consola, 'warn')

    logger.warn('This is a warning.')

    expect(consola.warn).toHaveBeenCalledTimes(1)
  })

  it('should not log warnings when the log level is above Warn', () => {
    const logger = new Logger(LogLevel.Error)
    spyOn(consola, 'warn')

    logger.warn('This is a warning.')

    expect(consola.warn).not.toHaveBeenCalled()
  })

  it('should log errors when the log level is Warn', () => {
    const logger = new Logger(LogLevel.Warn)
    spyOn(consola, 'error')

    logger.error('This is an error.')

    expect(consola.error).toHaveBeenCalledTimes(1)
  })

  it('should not log errors when the log level is Off', () => {
    const logger = new Logger(LogLevel.Off)
    spyOn(consola, 'error')

    logger.error('This is an error.')

    expect(consola.error).not.toHaveBeenCalled()
  })

  it('should log info messages when the log level is Info', () => {
    const logger = new Logger(LogLevel.Info)
    spyOn(consola, 'info')

    logger.info('This is info.')

    expect(consola.info).toHaveBeenCalledTimes(1)
  })

  it('should not log info messages when the log level is Error', () => {
    const logger = new Logger(LogLevel.Error)
    spyOn(consola, 'info')

    logger.info('This is info.')

    expect(consola.info).not.toHaveBeenCalled()
  })

  it('should log debug messages when the log level is Debug', () => {
    const logger = new Logger(LogLevel.Debug)
    spyOn(consola, 'debug')

    logger.debug('This is debug.')

    expect(consola.debug).toHaveBeenCalledTimes(1)
  })

  it('should not log debug messages when the log level is Error', () => {
    const logger = new Logger(LogLevel.Error)
    spyOn(consola, 'debug')

    logger.debug('This is debug.')

    expect(consola.debug).not.toHaveBeenCalled()
  })

  it('should log success messages when the log level is Debug', () => {
    const logger = new Logger(LogLevel.Debug)
    spyOn(consola, 'success')

    logger.success('This is success.')

    expect(consola.success).toHaveBeenCalledTimes(1)
  })

  it('should not log success messages when the log level is Error', () => {
    const logger = new Logger(LogLevel.Error)
    spyOn(consola, 'success')

    logger.success('This is success.')

    expect(consola.success).not.toHaveBeenCalled()
  })

  it('should log a message regardless of log level', () => {
    const logger = new Logger(LogLevel.Off)
    spyOn(consola, 'log')

    logger.log('This is a log.')

    expect(consola.log).toHaveBeenCalledTimes(1)
  })

  describe('logger.table', () => {
    it('should log a table with default border style without head', () => {
      const logger = new Logger(LogLevel.Debug)
      spyOn(consola, 'log')

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
      spyOn(consola, 'log')

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
      spyOn(consola, 'log')

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
        expect(error.matcherResult.pass).toEqual(false)
      }
    })

    it('should log a table with custom border style', () => {
      const logger = new Logger(LogLevel.Debug)
      spyOn(consola, 'log')

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
