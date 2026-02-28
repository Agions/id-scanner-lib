/**
 * @file Logger 测试
 * @description 测试日志系统
 */

import { Logger, LogLevel } from './logger';

describe('Logger', () => {
  let logger: Logger;

  beforeEach(() => {
    logger = Logger.getInstance();
  });

  it('should get singleton instance', () => {
    const logger2 = Logger.getInstance();
    expect(logger).toBe(logger2);
  });

  it('should log debug message', () => {
    expect(() => {
      logger.debug('Test', 'Debug message');
    }).not.toThrow();
  });

  it('should log info message', () => {
    expect(() => {
      logger.info('Test', 'Info message');
    }).not.toThrow();
  });

  it('should log warn message', () => {
    expect(() => {
      logger.warn('Test', 'Warning message');
    }).not.toThrow();
  });

  it('should log error message', () => {
    expect(() => {
      logger.error('Test', 'Error message', new Error('test error'));
    }).not.toThrow();
  });

  it('should set log level', () => {
    expect(() => {
      logger.setLevel(LogLevel.WARN);
    }).not.toThrow();
  });
});
