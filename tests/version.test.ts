/**
 * 版本测试
 */

import { VERSION } from '../src/version';

describe('Version', () => {
  it('should export version string', () => {
    expect(VERSION).toBeDefined();
    expect(typeof VERSION).toBe('string');
  });

  it('should match semver format', () => {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    expect(VERSION).toMatch(semverRegex);
  });
});
