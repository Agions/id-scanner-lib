/**
 * @file 加载状态管理
 * @description 提供模块加载状态跟踪功能
 * @module core/loading-state
 */

import { EventEmitter } from './event-emitter';

/**
 * 加载状态类型
 */
export enum LoadingState {
  /** 空闲 */
  IDLE = 'idle',
  /** 加载中 */
  LOADING = 'loading',
  /** 就绪 */
  READY = 'ready',
  /** 错误 */
  ERROR = 'error',
  /** 已释放 */
  DISPOSED = 'disposed'
}

/**
 * 加载进度信息
 */
export interface LoadingProgress {
  /** 当前状态 */
  state: LoadingState;
  /** 已加载的模型 */
  loadedModels: string[];
  /** 正在加载的模型 */
  loadingModel?: string;
  /** 进度百分比 (0-100) */
  progress: number;
  /** 错误信息 */
  error?: string;
}

/**
 * 加载状态管理器
 * 用于跟踪和管理模块的加载状态
 */
export class LoadingStateManager extends EventEmitter {
  private state: LoadingState = LoadingState.IDLE;
  private loadedModels: Set<string> = new Set();
  private loadingModel?: string;
  private totalModels: number = 0;
  private error?: string;

  /**
   * 开始加载
   * @param totalModels 总模型数
   */
  startLoading(totalModels: number): void {
    this.totalModels = totalModels;
    this.state = LoadingState.LOADING;
    this.error = undefined;
    this.emit('stateChange', this.getProgress());
  }

  /**
   * 模型开始加载
   * @param modelName 模型名称
   */
  startModelLoading(modelName: string): void {
    this.loadingModel = modelName;
    this.emit('progress', this.getProgress());
  }

  /**
   * 模型加载完成
   * @param modelName 模型名称
   */
  completeModelLoading(modelName: string): void {
    this.loadedModels.add(modelName);
    this.loadingModel = undefined;
    this.emit('progress', this.getProgress());
  }

  /**
   * 加载完成
   */
  complete(): void {
    this.state = LoadingState.READY;
    this.totalModels = 0;
    this.emit('stateChange', this.getProgress());
  }

  /**
   * 加载失败
   * @param error 错误信息
   */
  fail(error: string): void {
    this.state = LoadingState.ERROR;
    this.error = error;
    this.emit('error', { error, progress: this.getProgress() });
  }

  /**
   * 释放
   */
  dispose(): void {
    this.state = LoadingState.DISPOSED;
    this.loadedModels.clear();
    this.totalModels = 0;
    this.error = undefined;
    this.emit('stateChange', this.getProgress());
  }

  /**
   * 获取当前进度
   */
  getProgress(): LoadingProgress {
    const progress = this.totalModels > 0 
      ? Math.round((this.loadedModels.size / this.totalModels) * 100) 
      : 0;

    return {
      state: this.state,
      loadedModels: Array.from(this.loadedModels),
      loadingModel: this.loadingModel,
      progress,
      error: this.error
    };
  }

  /**
   * 获取当前状态
   */
  getState(): LoadingState {
    return this.state;
  }

  /**
   * 是否已就绪
   */
  isReady(): boolean {
    return this.state === LoadingState.READY;
  }

  /**
   * 是否有错误
   */
  hasError(): boolean {
    return this.state === LoadingState.ERROR;
  }
}

/**
 * 创建加载状态管理器
 */
export function createLoadingStateManager(): LoadingStateManager {
  return new LoadingStateManager();
}
