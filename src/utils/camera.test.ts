/**
 * @file 摄像头工具测试
 * @description 测试摄像头相关工具
 */

import { getMediaConstraints } from './index';

describe('Camera Utils', () => {
  describe('getMediaConstraints', () => {
    it('should return default constraints', () => {
      const constraints = getMediaConstraints();
      
      expect(constraints).toBeDefined();
      expect(constraints.audio).toBe(false);
      expect(constraints.video).toBeDefined();
    });

    it('should accept custom parameters', () => {
      const constraints = getMediaConstraints(1920, 1080, 'user', 60);
      
      expect(constraints.video).toBeDefined();
    });

    it('should handle partial parameters', () => {
      const constraints = getMediaConstraints(640);
      
      expect(constraints.video).toBeDefined();
    });
  });
});
