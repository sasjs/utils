import { consola } from 'consola'
import { Logger, LogLevel } from '.'
import chalk from 'chalk'

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

  it('should drop invalid args from a warning, as the other log methods do', () => {
    const logger = new Logger(LogLevel.Debug)
    jest.spyOn(consola, 'warn')

    logger.warn('This is a warning.', false, '', undefined, null, 'extra')

    expect(consola.warn).toHaveBeenCalledWith('This is a warning.', 'extra')
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
    it('should log rows as aligned columns without a head', () => {
      const logger = new Logger(LogLevel.Debug)
      jest.spyOn(consola, 'log')

      logger.table([
        ['test_1_1', 'test_1_2'],
        ['test_2_1', 'tes_t2_2']
      ])

      const expectedOutput = `test_1_1  test_1_2
test_2_1  tes_t2_2
`

      expect(consola.log).toHaveBeenCalledTimes(1)
      expect(consola.log).toHaveBeenCalledWith(expectedOutput)
    })

    it('should underline the head with dashes', () => {
      const logger = new Logger(LogLevel.Debug)
      jest.spyOn(consola, 'log')

      logger.table(
        [
          ['test_1_1', 'test_1_2'],
          ['test_2_1', 'tes_t2_2']
        ],
        { head: ['title 1', 'title 2'] }
      )

      const expectedOutput = `${chalk.white.bold('title 1')}   ${chalk.white.bold(
        'title 2'
      )}
--------  --------
test_1_1  test_1_2
test_2_1  tes_t2_2
`

      expect(consola.log).toHaveBeenCalledTimes(1)
      expect(consola.log).toHaveBeenCalledWith(expectedOutput)
    })

    it('should measure column width on the visible text when cells carry colour', () => {
      const logger = new Logger(LogLevel.Debug)
      jest.spyOn(consola, 'log')

      logger.table([
        ['ok', chalk.green('pass')],
        ['longer_key', 'fail']
      ])

      const output = (consola.log as unknown as jest.Mock).mock
        .calls[0][0] as string
      const visible = output
        .split('\n')
        .filter((line) => line.length)
        .map((line) => line.replace(/\u001b\[[0-9;]*m/g, ''))

      // The colour codes occupy no screen columns, so the second column starts
      // at the same offset in both rows and the rows are the same width. If the
      // codes were counted as width, the first row would be padded further.
      expect(visible[0].indexOf('pass')).toEqual(visible[1].indexOf('fail'))
      expect(new Set(visible.map((line) => line.length)).size).toEqual(1)
    })
  })
})
