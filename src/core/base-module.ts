/**
 * @file 基础模块
 * @description 提供基础模块实现，作为所有功能模块的基类
 * @module core/base-module
 */

import { EventEmitter } from './event-emitter';
import { Logger } from './logger';
import { Module } from './module-manager';
import { VERSION } from '../version';

/**
 * 基础模块类
 * 提供模块的基本功能和生命周期管理
 */
export abstract class BaseModule extends EventEmitter implements Module {
  /** 模块名称 */
  public abstract readonly name: string;
  
  /** 模块版本 */
  public readonly version: string = VERSION;
  
  /** 模块是否已初始化 */
  protected _isInitialized: boolean = false;
  
  /** 日志工具 */
  protected logger: Logger;
  
  /**
   * 构造函数
   */
  constructor() {
    super();
    this.logger = Logger.getInstance();
  }
  
  /**
   * 获取模块是否已初始化
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }
  
  /**
   * 初始化模块
   * 子类必须实现此方法
   */
  public abstract initialize(): Promise<void>;
  
  /**
   * 释放模块资源
   * 子类可以覆盖此方法以添加额外的资源释放逻辑
   */
  public async dispose(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }
    
    this.logger.debug(this.name, '释放模块资源');
    
    // 重置初始化状态
    this._isInitialized = false;
    
    // 删除所有事件监听器
    this.removeAllListeners();
    
    this.logger.debug(this.name, '模块资源已释放');
  }
  
  /**
   * 检查模块是否已初始化，如果未初始化则抛出错误
   */
  protected ensureInitialized(): void {
    if (!this._isInitialized) {
      throw new Error(`模块 ${this.name} 尚未初始化`);
    }
  }
} 