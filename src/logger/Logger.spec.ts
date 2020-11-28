import consola from 'consola'
import { Logger, LogLevel } from '.'

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

  it('should log info messages when the log level is Info', () => {
    const logger = new Logger(LogLevel.Info)
    spyOn(consola, 'info')

    logger.info('This is info.')

    expect(consola.info).toHaveBeenCalledTimes(1)
  })
})
