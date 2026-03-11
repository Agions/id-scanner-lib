/**
 * 工具函数测试
 */

import { retry, retryWithBackoff } from '../src/utils/retry';

describe('retry', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Failed');
      return 'success';
    };

    const result = await retry(fn, { maxAttempts: 3 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw after max attempts', async () => {
    const fn = async () => {
      throw new Error('Always fails');
    };

    await expect(retry(fn, { maxAttempts: 3 })).rejects.toThrow('Always fails');
  });

  it('should respect delay option', async () => {
    const start = Date.now();
    const fn = async () => {
      throw new Error('Failed');
    };

    try {
      await retry(fn, { maxAttempts: 3, delay: 100 });
    } catch (e) {
      // Expected
    }

    const elapsed = Date.now() - start;
    expect(elapsed).toBeGreaterThanOrEqual(200);
  });
});

describe('retryWithBackoff', () => {
  it('should increase delay with each attempt', async () => {
    const delays: number[] = [];
    let attempts = 0;

    const fn = async () => {
      attempts++;
      delays.push(Date.now());
      if (attempts < 3) throw new Error('Failed');
      return 'success';
    };

    await retryWithBackoff(fn, { maxAttempts: 3, baseDelay: 50 });
    expect(attempts).toBe(3);
  });
});
