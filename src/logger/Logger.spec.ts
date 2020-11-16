import { Logger, LogLevel } from '.'
import { LogOutput } from './LogOutput'

const createTestLogOutput = (): LogOutput => ({
  log: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  error: jest.fn()
})

describe('Logger', () => {
  it('should set the log level', () => {
    const logger = new Logger()
    logger.logLevel = LogLevel.Off

    expect(logger.logLevel).toEqual(LogLevel.Off)
  })

  it('should set the log output', () => {
    const logger = new Logger()
    const logOutput = createTestLogOutput()
    logger.logOutput = logOutput

    expect(logger.logOutput).toEqual(logOutput)
  })

  it('should log warnings when the log level is below WARNING', () => {
    const logger = new Logger()
    logger.logLevel = LogLevel.Debug
    logger.logOutput = createTestLogOutput()

    logger.warn('This is a warning.')

    expect(logger.logOutput.warn).toHaveBeenCalledTimes(1)
  })

  it('should not log warnings when the log level is above WARNING', () => {
    const logger = new Logger()
    logger.logLevel = LogLevel.Error
    logger.logOutput = createTestLogOutput()
    logger.warn('This is a warning.')

    expect(logger.logOutput.warn).not.toHaveBeenCalled()
  })
})
