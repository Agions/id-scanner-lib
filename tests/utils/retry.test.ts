/**
 * 重试机制测试
 */

import { withRetry, createRetryable } from '../../src/utils/retry';

describe('withRetry', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Failed');
      return 'success';
    };

    // 使用较短的 initialDelay 加快测试
    const result = await withRetry(fn, { maxAttempts: 3, initialDelay: 10 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  }, 10000);

  it('should throw after max attempts', async () => {
    const fn = async () => {
      throw new Error('Always fails');
    };

    await expect(withRetry(fn, { maxAttempts: 3, initialDelay: 10 })).rejects.toThrow('Always fails');
  }, 10000);

  it('should respect initialDelay option', async () => {
    const start = Date.now();
    const fn = async () => {
      throw new Error('Failed');
    };

    try {
      await withRetry(fn, { maxAttempts: 3, initialDelay: 50 });
    } catch (e) {
      // Expected
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(150);
  });
});

describe('createRetryable', () => {
  it('should create a retryable function', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Failed');
      return 'success';
    };

    const retryable = createRetryable(fn, { initialDelay: 10 });
    const result = await retryable();
    expect(result).toBe('success');
  }, 10000);
});
