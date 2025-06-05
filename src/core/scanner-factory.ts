/**
 * @file 扫描器工厂
 * @description 提供统一的组件创建和访问接口
 * @module core/scanner-factory
 */

import { ConfigManager, GlobalConfig } from './config';
import { Logger } from './logger';
import { ResourceManager } from './resource-manager';
import { EventEmitter } from './event-emitter';
import { InitializationError } from './errors';

/**
 * 扫描器初始化选项
 */
export interface ScannerFactoryOptions {
  /** 配置选项 */
  config?: Partial<GlobalConfig>;
  /** 资源基础路径 */
  resourceBasePath?: string;
  /** 调试模式 */
  debug?: boolean;
  /** 自动初始化模块 */
  autoInitModules?: boolean;
}

/**
 * 扫描器工厂
 * 作为整个库的核心入口点，管理组件生命周期并提供统一接口
 */
export class ScannerFactory extends EventEmitter {
  /** 单例实例 */
  private static instance: ScannerFactory;
  /** 配置管理器 */
  private readonly config: ConfigManager;
  /** 日志记录器 */
  private readonly logger: Logger;
  /** 资源管理器 */
  private readonly resources: ResourceManager;
  /** 是否已初始化 */
  private initialized: boolean = false;
  /** 初始化锁，防止多次调用 */
  private initializing: boolean = false;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    super();
    this.config = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
    this.resources = ResourceManager.getInstance();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): ScannerFactory {
    if (!ScannerFactory.instance) {
      ScannerFactory.instance = new ScannerFactory();
    }
    return ScannerFactory.instance;
  }
  
  /**
   * 初始化扫描器工厂
   * @param options 初始化选项
   */
  async initialize(options: ScannerFactoryOptions = {}): Promise<boolean> {
    // 防止重复初始化
    if (this.initialized) {
      this.logger.warn('ScannerFactory', 'Already initialized');
      return true;
    }
    
    if (this.initializing) {
      this.logger.warn('ScannerFactory', 'Initialization already in progress');
      return false;
    }
    
    this.initializing = true;
    
    try {
      const { 
        config = {}, 
        resourceBasePath = '', 
        debug = false,
        autoInitModules = true
      } = options;
      
      // 应用配置
      if (debug) {
        config.debug = true;
      }
      
      this.config.updateConfig(config);
      
      // 设置资源基础路径
      if (resourceBasePath) {
        this.resources.setBasePath(resourceBasePath);
      }
      
      // 记录初始化日志
      this.logger.info('ScannerFactory', 'Initializing ID Scanner Library', {
        version: '1.4.0',
        debug: this.config.get('debug', false)
      });
      
      // 如果启用了自动初始化模块，则加载相应模块
      if (autoInitModules) {
        await this.initEnabledModules();
      }
      
      this.initialized = true;
      this.initializing = false;
      
      this.emit('initialized', { success: true });
      this.logger.info('ScannerFactory', 'ID Scanner Library initialized successfully');
      
      return true;
    } catch (error) {
      this.initializing = false;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('ScannerFactory', `Initialization failed: ${errorMessage}`, error);
      
      this.emit('initialized', { success: false, error });
      
      throw new InitializationError(
        '扫描器初始化失败', 
        errorMessage
      );
    }
  }
  
  /**
   * 初始化已启用的模块
   */
  private async initEnabledModules(): Promise<void> {
    const enabledModules = [];
    
    // 检查每个模块的启用状态
    if (this.config.isModuleEnabled('face')) {
      enabledModules.push(this.initFaceModule());
    }
    
    if (this.config.isModuleEnabled('qr')) {
      enabledModules.push(this.initQRModule());
    }
    
    if (this.config.isModuleEnabled('idcard')) {
      enabledModules.push(this.initIDCardModule());
    }
    
    if (this.config.isModuleEnabled('ocr')) {
      enabledModules.push(this.initOCRModule());
    }
    
    // 并行初始化所有启用的模块
    if (enabledModules.length > 0) {
      await Promise.all(enabledModules);
    }
  }
  
  /**
   * 初始化人脸识别模块
   */
  private async initFaceModule(): Promise<void> {
    this.logger.info('ScannerFactory', 'Initializing Face module');
    // 实际初始化代码将在模块实现中完成
  }
  
  /**
   * 初始化二维码扫描模块
   */
  private async initQRModule(): Promise<void> {
    this.logger.info('ScannerFactory', 'Initializing QR Code module');
    // 实际初始化代码将在模块实现中完成
  }
  
  /**
   * 初始化身份证扫描模块
   */
  private async initIDCardModule(): Promise<void> {
    this.logger.info('ScannerFactory', 'Initializing ID Card module');
    // 实际初始化代码将在模块实现中完成
  }
  
  /**
   * 初始化OCR模块
   */
  private async initOCRModule(): Promise<void> {
    this.logger.info('ScannerFactory', 'Initializing OCR module');
    // 实际初始化代码将在模块实现中完成
  }
  
  /**
   * 销毁实例，释放资源
   */
  destroy(): void {
    if (!this.initialized) return;
    
    this.logger.info('ScannerFactory', 'Destroying ID Scanner Library');
    
    // 释放所有资源
    this.resources.releaseAll();
    
    this.initialized = false;
    this.emit('destroyed');
  }
  
  /**
   * 获取配置管理器
   */
  getConfig(): ConfigManager {
    return this.config;
  }
  
  /**
   * 获取日志记录器
   */
  getLogger(): Logger {
    return this.logger;
  }
  
  /**
   * 获取资源管理器
   */
  getResources(): ResourceManager {
    return this.resources;
  }
  
  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized;
  }
} 