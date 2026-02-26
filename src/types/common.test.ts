/**
 * @file 通用类型测试
 * @description 测试通用类型
 */

import {
  Rectangle,
  Point,
  Size,
  ImageSource,
  ModuleState,
  CancellablePromise,
  KeyValuePair
} from './common';

describe('Common Types', () => {
  describe('Rectangle', () => {
    it('should create rectangle', () => {
      const rect: Rectangle = {
        x: 10,
        y: 20,
        width: 100,
        height: 50
      };

      expect(rect.x).toBe(10);
      expect(rect.y).toBe(20);
      expect(rect.width).toBe(100);
      expect(rect.height).toBe(50);
    });
  });

  describe('Point', () => {
    it('should create point', () => {
      const point: Point = {
        x: 50,
        y: 100
      };

      expect(point.x).toBe(50);
      expect(point.y).toBe(100);
    });
  });

  describe('Size', () => {
    it('should create size', () => {
      const size: Size = {
        width: 1920,
        height: 1080
      };

      expect(size.width).toBe(1920);
      expect(size.height).toBe(1080);
    });
  });

  describe('ModuleState', () => {
    it('should have correct states', () => {
      expect(ModuleState.UNINITIALIZED).toBe('uninitialized');
      expect(ModuleState.INITIALIZING).toBe('initializing');
      expect(ModuleState.INITIALIZED).toBe('initialized');
      expect(ModuleState.RUNNING).toBe('running');
      expect(ModuleState.PAUSED).toBe('paused');
      expect(ModuleState.STOPPED).toBe('stopped');
      expect(ModuleState.ERROR).toBe('error');
      expect(ModuleState.DESTROYED).toBe('destroyed');
    });
  });

  describe('CancellablePromise', () => {
    it('should create cancellable promise', () => {
      let cancelled = false;
      
      const cp: CancellablePromise<string> = {
        promise: new Promise((resolve) => {
          setTimeout(() => resolve('done'), 100);
        }),
        cancel: () => {
          cancelled = true;
        }
      };

      expect(cp.promise).toBeInstanceOf(Promise);
      expect(typeof cp.cancel).toBe('function');
    });
  });

  describe('KeyValuePair', () => {
    it('should create key value pair', () => {
      const pair: KeyValuePair<string, number> = {
        key: 'age',
        value: 25
      };

      expect(pair.key).toBe('age');
      expect(pair.value).toBe(25);
    });
  });
});
