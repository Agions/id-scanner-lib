/**
 * @file 工具函数测试
 * @description 测试通用工具函数
 */

import {
  delay,
  throttle,
  debounce,
  formatBytes,
  generateUUID,
  chunk,
  safeParseJSON,
  clamp,
  isValidUrl,
} from '../utils';

describe('Utils', () => {
  describe('delay', () => {
    it('should delay for specified milliseconds', async () => {
      const start = Date.now();
      await delay(100);
      const elapsed = Date.now() - start;
      expect(elapsed).toBeGreaterThanOrEqual(90);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should throttle function calls', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after throttle period', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      jest.advanceTimersByTime(100);
      throttled();

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should debounce function calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      debounced();
      debounced();

      jest.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should execute immediately when immediate is true', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100, true);

      debounced();
      debounced();
      debounced();

      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 Bytes');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(1024 * 1024)).toBe('1 MB');
      expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should respect decimal places', () => {
      expect(formatBytes(1536, 2)).toBe('1.5 KB');
      expect(formatBytes(1536, 0)).toBe('2 KB');
    });
  });

  describe('generateUUID', () => {
    it('should generate valid UUID format', () => {
      const uuid = generateUUID();
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set(Array.from({ length: 100 }, () => generateUUID()));
      expect(uuids.size).toBe(100);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      const chunks = chunk(arr, 3);
      expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    });

    it('should handle last chunk smaller than chunk size', () => {
      const arr = [1, 2, 3, 4, 5];
      const chunks = chunk(arr, 2);
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });

    it('should throw error for invalid chunk size', () => {
      expect(() => chunk([1, 2, 3], 0)).toThrow('Chunk size must be greater than 0');
    });
  });

  describe('safeParseJSON', () => {
    it('should parse valid JSON', () => {
      const result = safeParseJSON('{"a": 1}', null);
      expect(result).toEqual({ a: 1 });
    });

    it('should return fallback for invalid JSON', () => {
      const result = safeParseJSON('invalid', { fallback: true });
      expect(result).toEqual({ fallback: true });
    });
  });

  describe('clamp', () => {
    it('should clamp value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('isValidUrl', () => {
    it('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('ftp://files.example.com')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
    });
  });
});
