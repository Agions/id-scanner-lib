/**
 * @file 加载状态管理测试
 * @description 测试 LoadingStateManager
 */

import { LoadingStateManager, LoadingState } from './loading-state';

describe('LoadingStateManager', () => {
  let manager: LoadingStateManager;

  beforeEach(() => {
    manager = new LoadingStateManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  it('should start with idle state', () => {
    expect(manager.getState()).toBe(LoadingState.IDLE);
  });

  it('should start loading', () => {
    manager.startLoading(5);
    
    expect(manager.getState()).toBe(LoadingState.LOADING);
    expect(manager.getProgress().progress).toBe(0);
  });

  it('should track model loading', () => {
    manager.startLoading(5);
    manager.startModelLoading('model1');
    
    expect(manager.getProgress().loadingModel).toBe('model1');
    
    manager.completeModelLoading('model1');
    expect(manager.getProgress().loadedModels).toContain('model1');
  });

  it('should complete loading', () => {
    manager.startLoading(2);
    manager.completeModelLoading('model1');
    manager.completeModelLoading('model2');
    manager.complete();
    
    expect(manager.getState()).toBe(LoadingState.READY);
    expect(manager.isReady()).toBe(true);
  });

  it('should handle failure', () => {
    manager.startLoading(2);
    manager.fail('Network error');
    
    expect(manager.getState()).toBe(LoadingState.ERROR);
    expect(manager.getProgress().error).toBe('Network error');
    expect(manager.hasError()).toBe(true);
  });

  it('should dispose correctly', () => {
    manager.startLoading(2);
    manager.complete();
    manager.dispose();
    
    expect(manager.getState()).toBe(LoadingState.DISPOSED);
    expect(manager.isReady()).toBe(false);
  });
});
