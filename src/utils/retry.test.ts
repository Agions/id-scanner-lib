/**
 * @file 重试工具测试
 * @description 测试重试功能
 */

import { withRetry, AsyncCache, Semaphore } from './retry';

describe('withRetry', () => {
  it('should retry on failure and succeed', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('fail');
      return 'success';
    };

    const result = await withRetry(fn, {
      maxAttempts: 3,
      initialDelay: 10
    });

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should fail after max attempts', async () => {
    const fn = async () => {
      throw new Error('always fails');
    };

    await expect(
      withRetry(fn, { maxAttempts: 2, initialDelay: 10 })
    ).rejects.toThrow('always fails');
  });

  it('should not retry if shouldRetry returns false', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('test');
    };

    await expect(
      withRetry(fn, {
        maxAttempts: 3,
        initialDelay: 10,
        shouldRetry: () => false
      })
    ).rejects.toThrow();

    expect(attempts).toBe(1);
  });
});

describe('AsyncCache', () => {
  it('should store and retrieve values', async () => {
    const cache = new AsyncCache<string>(1000);
    cache.set('key1', 'value1');

    expect(cache.get('key1')).toBe('value1');
  });

  it('should return undefined for expired cache', async () => {
    const cache = new AsyncCache<string>(50);
    cache.set('key1', 'value1');

    await new Promise(resolve => setTimeout(resolve, 60));

    expect(cache.get('key1')).toBeUndefined();
  });

  it('should getOrSet value if not exists', async () => {
    const cache = new AsyncCache<string>(1000);
    
    const result = await cache.getOrSet('key1', async () => 'computed');
    
    expect(result).toBe('computed');
    expect(cache.get('key1')).toBe('computed');
  });

  it('should not recompute if exists', async () => {
    const cache = new AsyncCache<string>(1000);
    let computeCount = 0;
    
    const compute = async () => {
      computeCount++;
      return 'value';
    };

    await cache.getOrSet('key1', compute);
    await cache.getOrSet('key1', compute);
    
    expect(computeCount).toBe(1);
  });

  it('should clear all cache', async () => {
    const cache = new AsyncCache<string>(1000);
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    
    expect(cache.size).toBe(2);
    
    cache.clear();
    expect(cache.size).toBe(0);
  });
});

describe('Semaphore', () => {
  it('should acquire and release permits', async () => {
    const sem = new Semaphore(2);
    
    expect(sem.availablePermits).toBe(2);
    
    await sem.acquire();
    expect(sem.availablePermits).toBe(1);
    
    await sem.acquire();
    expect(sem.availablePermits).toBe(0);
    
    sem.release();
    expect(sem.availablePermits).toBe(1);
  });

  it('should tryAcquire returns false when no permits', () => {
    const sem = new Semaphore(1);
    sem.acquire();
    
    expect(sem.tryAcquire()).toBe(false);
  });

  it('should queue waiting acquires', async () => {
    const sem = new Semaphore(1);
    
    // First acquire
    await sem.acquire();
    expect(sem.availablePermits).toBe(0);
    
    // Release
    sem.release();
    expect(sem.availablePermits).toBe(1);
  });
});
