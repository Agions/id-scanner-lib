/**
 * 版本测试
 */

import { version, VERSION } from '../src/version';

describe('Version', () => {
  it('should export version string', () => {
    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
  });

  it('should export VERSION constant', () => {
    expect(VERSION).toBeDefined();
    expect(VERSION).toBe(version);
  });

  it('should match semver format', () => {
    const semverRegex = /^\d+\.\d+\.\d+$/;
    expect(version).toMatch(semverRegex);
  });
});
