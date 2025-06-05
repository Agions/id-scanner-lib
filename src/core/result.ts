/**
 * @file 结果包装类
 * @description 提供统一的操作结果封装
 * @module core/result
 */

/**
 * 结果类型
 * 用于封装操作的成功或失败结果
 */
export class Result<T = any> {
  /** 结果数据 */
  private _data?: T;
  /** 错误对象 */
  private _error?: Error;
  /** 是否成功 */
  private _success: boolean;
  /** 额外元数据 */
  private _meta?: Record<string, any>;
  
  /**
   * 构造函数
   * @param success 是否成功
   * @param data 结果数据
   * @param error 错误对象
   * @param meta 元数据
   */
  constructor(
    success: boolean,
    data?: T,
    error?: Error,
    meta?: Record<string, any>
  ) {
    this._success = success;
    this._data = data;
    this._error = error;
    this._meta = meta;
  }
  
  /**
   * 创建成功结果
   * @param data 结果数据
   * @param meta 元数据
   */
  static success<T>(data?: T, meta?: Record<string, any>): Result<T> {
    return new Result<T>(true, data, undefined, meta);
  }
  
  /**
   * 创建失败结果
   * @param error 错误对象
   * @param meta 元数据
   */
  static failure<T>(error: Error, meta?: Record<string, any>): Result<T> {
    return new Result<T>(false, undefined, error, meta);
  }
  
  /**
   * 检查结果是否成功
   */
  isSuccess(): boolean {
    return this._success;
  }
  
  /**
   * 检查结果是否失败
   */
  isFailure(): boolean {
    return !this._success;
  }
  
  /**
   * 获取结果数据
   */
  get data(): T | undefined {
    return this._data;
  }
  
  /**
   * 获取错误对象
   */
  get error(): Error | undefined {
    return this._error;
  }
  
  /**
   * 获取元数据
   */
  get meta(): Record<string, any> | undefined {
    return this._meta;
  }
  
  /**
   * 映射结果（如果成功）
   * @param fn 映射函数
   */
  map<U>(fn: (data: T) => U): Result<U> {
    if (this.isSuccess() && this._data !== undefined) {
      try {
        const newData = fn(this._data);
        return Result.success<U>(newData, this._meta);
      } catch (error) {
        return Result.failure<U>(error instanceof Error ? error : new Error(String(error)), this._meta);
      }
    }
    
    return Result.failure<U>(this._error!, this._meta);
  }
  
  /**
   * 如果成功，则执行函数
   * @param fn 要执行的函数
   */
  onSuccess(fn: (data?: T) => void): Result<T> {
    if (this.isSuccess()) {
      try {
        fn(this._data);
      } catch (error) {
        console.error('Error in onSuccess handler:', error);
      }
    }
    return this;
  }
  
  /**
   * 如果失败，则执行函数
   * @param fn 要执行的函数
   */
  onFailure(fn: (error: Error) => void): Result<T> {
    if (this.isFailure() && this._error) {
      try {
        fn(this._error);
      } catch (error) {
        console.error('Error in onFailure handler:', error);
      }
    }
    return this;
  }
  
  /**
   * 无论成功失败，都执行函数
   * @param fn 要执行的函数
   */
  onFinally(fn: () => void): Result<T> {
    try {
      fn();
    } catch (error) {
      console.error('Error in onFinally handler:', error);
    }
    return this;
  }
  
  /**
   * 转换为字符串
   */
  toString(): string {
    if (this.isSuccess()) {
      return `Success: ${JSON.stringify(this._data)}`;
    } else {
      return `Failure: ${this._error?.message || 'Unknown error'}`;
    }
  }
} 