/**
 * @file 模块管理器
 * @description 统一管理库的各功能模块，提供模块的注册、初始化和卸载功能
 * @module core/module-manager
 */

import { Logger } from './logger';
import { EventEmitter } from './event-emitter';
import { VERSION } from '../version';

/**
 * 模块接口
 * 所有功能模块必须实现此接口
 */
export interface Module {
  /** 模块名称 */
  name: string;
  
  /** 模块版本 */
  version: string;
  
  /** 模块是否已初始化 */
  isInitialized: boolean;
  
  /** 初始化模块 */
  initialize(): Promise<void>;
  
  /** 释放模块资源 */
  dispose(): Promise<void>;
}

/**
 * 模块配置接口
 */
export interface ModuleOptions {
  /** 是否启用该模块 */
  enabled?: boolean;
  
  /** 模块特定配置 */
  [key: string]: any;
}

/**
 * 模块管理器类
 * 负责管理所有功能模块的生命周期
 */
export class ModuleManager extends EventEmitter {
  private static instance: ModuleManager;
  private modules: Map<string, Module> = new Map();
  private logger: Logger;
  private initialized = false;
  
  /**
   * 获取模块管理器单例
   */
  public static getInstance(): ModuleManager {
    if (!ModuleManager.instance) {
      ModuleManager.instance = new ModuleManager();
    }
    return ModuleManager.instance;
  }
  
  /**
   * 私有构造函数，确保单例模式
   */
  private constructor() {
    super();
    this.logger = Logger.getInstance();
    this.logger.debug('ModuleManager', `初始化模块管理器 v${VERSION}`);
  }
  
  /**
   * 注册模块
   * @param module 要注册的模块
   * @returns 模块管理器实例，支持链式调用
   */
  public register(module: Module): ModuleManager {
    if (this.modules.has(module.name)) {
      this.logger.warn('ModuleManager', `模块 "${module.name}" 已经注册，将被覆盖`);
    }
    
    this.modules.set(module.name, module);
    this.logger.debug('ModuleManager', `注册模块: ${module.name} v${module.version}`);
    this.emit('module:registered', { name: module.name });
    
    return this;
  }
  
  /**
   * 获取模块
   * @param name 模块名称
   * @returns 模块实例
   */
  public getModule<T extends Module>(name: string): T | undefined {
    return this.modules.get(name) as T | undefined;
  }
  
  /**
   * 初始化所有注册的模块
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    
    this.logger.debug('ModuleManager', '开始初始化所有模块...');
    
    for (const [name, module] of this.modules.entries()) {
      try {
        this.logger.debug('ModuleManager', `初始化模块: ${name}`);
        await module.initialize();
        this.emit('module:initialized', { name });
        this.logger.debug('ModuleManager', `模块 ${name} 初始化完成`);
      } catch (error) {
        this.logger.error('ModuleManager', `模块 ${name} 初始化失败`, error instanceof Error ? error : undefined);
        this.emit('module:error', { name, error });
        throw new Error(`模块 ${name} 初始化失败: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    this.initialized = true;
    this.logger.debug('ModuleManager', '所有模块初始化完成');
    this.emit('modules:initialized');
  }
  
  /**
   * 卸载所有模块并释放资源
   */
  public async dispose(): Promise<void> {
    this.logger.debug('ModuleManager', '开始释放所有模块资源...');
    
    for (const [name, module] of this.modules.entries()) {
      try {
        this.logger.debug('ModuleManager', `释放模块资源: ${name}`);
        await module.dispose();
        this.emit('module:disposed', { name });
      } catch (error) {
        this.logger.error('ModuleManager', `模块 ${name} 资源释放失败`, error instanceof Error ? error : undefined);
        this.emit('module:error', { name, error });
      }
    }
    
    this.modules.clear();
    this.initialized = false;
    this.logger.debug('ModuleManager', '所有模块资源已释放');
    this.emit('modules:disposed');
  }
  
  /**
   * 获取所有已注册的模块名称
   */
  public getRegisteredModules(): string[] {
    return Array.from(this.modules.keys());
  }
  
  /**
   * 检查模块是否已注册
   * @param name 模块名称
   */
  public hasModule(name: string): boolean {
    return this.modules.has(name);
  }
} 