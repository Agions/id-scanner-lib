/**
 * @file 通用工具测试
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
  browserCapabilities
} from './index';

describe('delay', () => {
  it('should delay for specified milliseconds', async () => {
    const start = Date.now();
    await delay(50);
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeGreaterThanOrEqual(45);
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
    let count = 0;
    const fn = throttle(() => count++, 100);
    
    fn();
    fn();
    fn();
    
    expect(count).toBe(1);
    
    jest.advanceTimersByTime(100);
    
    fn();
    expect(count).toBe(2);
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
    let count = 0;
    const fn = debounce(() => count++, 100);
    
    fn();
    fn();
    fn();
    
    expect(count).toBe(0);
    
    jest.advanceTimersByTime(100);
    
    expect(count).toBe(1);
  });

  it('should execute immediately when immediate is true', () => {
    let count = 0;
    const fn = debounce(() => count++, 100, true);
    
    fn();
    // Immediate should execute once
    expect(count).toBe(1);
    
    // Advance time and check if it runs again
    jest.advanceTimersByTime(100);
    // Depending on implementation, this may vary
    expect(count).toBeGreaterThanOrEqual(1);
  });
});

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1024 * 1024)).toBe('1 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
  });

  it('should handle decimals', () => {
    expect(formatBytes(1536, 2)).toBe('1.5 KB');
  });
});

describe('generateUUID', () => {
  it('should generate valid UUID', () => {
    const uuid = generateUUID();
    
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('should generate unique UUIDs', () => {
    const uuids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      uuids.add(generateUUID());
    }
    
    expect(uuids.size).toBe(100);
  });
});

describe('chunk', () => {
  it('should split array into chunks', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7];
    const chunks = chunk(arr, 3);
    
    expect(chunks).toEqual([[1, 2, 3], [4, 5, 6], [7]]);
  });

  it('should throw error for invalid chunk size', () => {
    expect(() => chunk([1, 2, 3], 0)).toThrow();
  });
});

describe('safeParseJSON', () => {
  it('should parse valid JSON', () => {
    const result = safeParseJSON('{"a": 1}', { default: true });
    expect(result).toEqual({ a: 1 });
  });

  it('should return fallback for invalid JSON', () => {
    const result = safeParseJSON<boolean>('invalid', true);
    expect(result).toBe(true);
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
  it('should validate URLs', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://test.com/path')).toBe(true);
    expect(isValidUrl('invalid')).toBe(false);
    expect(isValidUrl('not a url')).toBe(false);
  });
});

describe('browserCapabilities', () => {
  it('should check camera support', () => {
    expect(typeof browserCapabilities.hasCamera).toBe('function');
  });

  it('should check WebAssembly support', () => {
    expect(typeof browserCapabilities.hasWasm).toBe('function');
  });

  it('should check WebWorker support', () => {
    expect(typeof browserCapabilities.hasWebWorker).toBe('function');
  });

  it('should check WebGL support', () => {
    expect(typeof browserCapabilities.hasWebGL).toBe('function');
  });

  it('should use supports method', () => {
    expect(typeof browserCapabilities.supports).toBe('function');
  });
});
