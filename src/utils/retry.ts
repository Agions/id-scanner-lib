/**
 * @file 重试工具
 * @description 提供重试逻辑功能
 * @module utils/retry
 */

/**
 * 重试选项
 */
export interface RetryOptions {
  /** 最大重试次数 */
  maxAttempts?: number;
  /** 初始等待时间(ms) */
  initialDelay?: number;
  /** 最大等待时间(ms) */
  maxDelay?: number;
  /** 指数退避因子 */
  backoffFactor?: number;
  /** 是否随机抖动 */
  jitter?: boolean;
  /** 重试条件 */
  shouldRetry?: (error: unknown) => boolean;
}

/**
 * 默认重试选项
 */
const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
  jitter: true,
  shouldRetry: () => true
};

/**
 * 带重试的异步函数包装器
 * @param fn 要执行的异步函数
 * @param options 重试选项
 * @returns 函数结果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 检查是否应该重试
      if (!opts.shouldRetry(error)) {
        throw error;
      }

      // 如果不是最后一次尝试，等待后重试
      if (attempt < opts.maxAttempts) {
        // 添加随机抖动
        const jitterAmount = opts.jitter ? Math.random() * delay : 0;
        const waitTime = Math.min(delay + jitterAmount, opts.maxDelay);

        await sleep(waitTime);

        // 指数退避
        delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
      }
    }
  }

  throw lastError;
}

/**
 * 睡眠函数
 * @param ms 毫秒数
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 创建指数退避重试函数
 * @param options 重试选项
 * @returns 包装后的重试函数
 */
export function createRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>): Promise<ReturnType<T>> => {
    return withRetry(() => fn(...args), options);
  }) as T;
}

/**
 * 异步缓存
 * @description 用于缓存异步函数的结果
 */
export class AsyncCache<T> {
  private cache: Map<string, { value: T; expiry: number }> = new Map();
  private defaultTTL: number;

  /**
   * @param defaultTTL 默认过期时间(毫秒)
   */
  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
  }

  /**
   * 获取缓存值
   * @param key 缓存键
   * @returns 缓存值，如果不存在或已过期则返回undefined
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value;
  }

  /**
   * 设置缓存值
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间(毫秒)
   */
  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + (ttl || this.defaultTTL)
    });
  }

  /**
   * 删除缓存值
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    // 清理过期项
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }

  /**
   * 异步获取或设置缓存
   * @param key 缓存键
   * @param fn 获取值的函数
   * @param ttl 过期时间
   * @returns 缓存值
   */
  async getOrSet(
    key: string,
    fn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fn();
    this.set(key, value, ttl);
    return value;
  }
}

/**
 * 简单信号量
 * @description 用于控制并发数量
 */
export class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  /**
   * @param permits 最大许可数
   */
  constructor(permits: number) {
    this.permits = permits;
  }

  /**
   * 获取许可
   * @returns Promise
   */
  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.queue.push(resolve);
    });
  }

  /**
   * 释放许可
   */
  release(): void {
    this.permits++;
    const next = this.queue.shift();
    if (next) {
      this.permits--;
      next();
    }
  }

  /**
   * 尝试获取许可
   * @returns 是否获取成功
   */
  tryAcquire(): boolean {
    if (this.permits > 0) {
      this.permits--;
      return true;
    }
    return false;
  }

  /**
   * 获取当前可用许可数
   */
  get availablePermits(): number {
    return this.permits;
  }
}

/**
 * 带信号量的异步函数包装器
 * @param fn 异步函数
 * @param semaphore 信号量
 * @returns 包装后的函数
 */
export function withSemaphore<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  semaphore: Semaphore
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    await semaphore.acquire();
    try {
      return await fn(...args);
    } finally {
      semaphore.release();
    }
  }) as T;
}
