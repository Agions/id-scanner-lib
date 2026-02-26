/**
 * @file 统一错误处理工具
 * @description 提供统一的错误处理和日志记录功能
 * @module utils/error-handler
 */

import { Logger } from '../core/logger';

/**
 * 错误严重级别
 */
export enum ErrorSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * 错误处理工具类
 */
export class ErrorHandler {
  private static logger = Logger.getInstance();

  /**
   * 处理错误并记录日志
   * @param context 错误上下文(模块名)
   * @param message 错误消息
   * @param error 错误对象
   * @param severity 错误级别
   */
  static handle(
    context: string,
    message: string,
    error?: unknown,
    severity: ErrorSeverity = ErrorSeverity.ERROR
  ): void {
    const errorObj = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    
    switch (severity) {
      case ErrorSeverity.DEBUG:
        this.logger.debug(context, message, errorObj);
        break;
      case ErrorSeverity.INFO:
        this.logger.info(context, message, errorObj);
        break;
      case ErrorSeverity.WARN:
        this.logger.warn(context, message, errorObj);
        break;
      case ErrorSeverity.ERROR:
      default:
        this.logger.error(context, message, errorObj);
    }
  }

  /**
   * 处理异步错误
   * @param context 错误上下文
   * @param message 错误消息
   * @returns 返回一个错误处理函数
   */
  static asyncHandler(
    context: string,
    message: string
  ): (error: unknown) => void {
    return (error: unknown) => {
      this.handle(context, message, error);
    };
  }

  /**
   * 安全执行异步函数并处理错误
   * @param fn 异步函数
   * @param context 错误上下文
   * @param fallbackValue 错误时的返回值
   * @returns 函数结果或 fallbackValue
   */
  static async safeExecute<T>(
    fn: () => Promise<T>,
    context: string,
    fallbackValue: T
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      this.handle(context, 'Operation failed', error);
      return fallbackValue;
    }
  }

  /**
   * 安全执行函数并处理错误
   * @param fn 函数
   * @param context 错误上下文
   * @param fallbackValue 错误时的返回值
   * @returns 函数结果或 fallbackValue
   */
  static safeExecuteSync<T>(
    fn: () => T,
    context: string,
    fallbackValue: T
  ): T {
    try {
      return fn();
    } catch (error) {
      this.handle(context, 'Operation failed', error);
      return fallbackValue;
    }
  }
}
