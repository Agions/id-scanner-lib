/**
 * @file 配置管理器
 * @description 提供全局配置管理功能
 * @module core/config
 */

/**
 * 配置管理器
 * 负责存储和管理应用程序的配置
 */
export class ConfigManager {
  /** 单例实例 */
  private static instance: ConfigManager;
  
  /** 配置存储 */
  private config: Record<string, any> = {};
  
  /** 配置变更回调 */
  private changeCallbacks: Map<string, Array<(value: any, oldValue: any) => void>> = new Map();
  
  /**
   * 私有构造函数
   */
  private constructor() {
    // 设置默认配置
    this.config = {
      debug: false,
      logLevel: 'info',
      camera: {
        resolution: {
          width: 1280,
          height: 720
        },
        frameRate: 30,
        facingMode: 'environment'
      },
      performance: {
        useCache: true
      }
    };
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }
  
  /**
   * 获取配置值
   * @param key 配置键，支持点号分隔的路径
   * @param defaultValue 默认值
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(this.config, key);
    return (value !== undefined) ? value : (defaultValue as T);
  }
  
  /**
   * 设置配置值
   * @param key 配置键，支持点号分隔的路径
   * @param value 配置值
   */
  set<T = any>(key: string, value: T): void {
    const oldValue = this.get(key);
    
    // 如果值相同，不做任何事
    if (oldValue === value) {
      return;
    }
    
    this.setNestedValue(this.config, key, value);
    
    // 触发变更回调
    this.triggerChangeCallbacks(key, value, oldValue);
  }
  
  /**
   * 批量更新配置
   * @param config 配置对象
   */
  updateConfig(config: Record<string, any>): void {
    Object.entries(config).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
  
  /**
   * 重置为默认配置
   */
  reset(): void {
    const oldConfig = { ...this.config };
    
    // 重新创建默认配置
    this.config = {
      debug: false,
      logLevel: 'info',
      camera: {
        resolution: {
          width: 1280,
          height: 720
        },
        frameRate: 30,
        facingMode: 'environment'
      },
      performance: {
        useCache: true
      }
    };
    
    // 触发所有回调
    Object.keys(oldConfig).forEach(key => {
      this.triggerChangeCallbacks(key, this.get(key), oldConfig[key]);
    });
  }
  
  /**
   * 注册配置变更回调
   * @param key 配置键
   * @param callback 回调函数
   */
  onConfigChange<T = any>(key: string, callback: (value: T, oldValue: T) => void): void {
    if (!this.changeCallbacks.has(key)) {
      this.changeCallbacks.set(key, []);
    }
    
    this.changeCallbacks.get(key)!.push(callback);
  }
  
  /**
   * 移除配置变更回调
   * @param key 配置键
   * @param callback 特定回调函数，如不提供则移除所有
   */
  offConfigChange<T = any>(key: string, callback?: (value: T, oldValue: T) => void): void {
    if (!this.changeCallbacks.has(key)) {
      return;
    }
    
    if (callback) {
      // 移除特定回调
      const callbacks = this.changeCallbacks.get(key)!;
      const index = callbacks.indexOf(callback as any);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
      
      // 如果没有回调，删除键
      if (callbacks.length === 0) {
        this.changeCallbacks.delete(key);
      }
    } else {
      // 移除所有回调
      this.changeCallbacks.delete(key);
    }
  }
  
  /**
   * 获取嵌套值
   * @param obj 对象
   * @param path 路径
   */
  private getNestedValue(obj: Record<string, any>, path: string): any {
    // 处理根路径
    if (!path) {
      return obj;
    }
    
    // 处理嵌套路径
    const parts = path.split('.');
    let current = obj;
    
    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }
      
      current = current[part];
    }
    
    return current;
  }
  
  /**
   * 设置嵌套值
   * @param obj 对象
   * @param path 路径
   * @param value 值
   */
  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    // 处理根路径
    if (!path) {
      return;
    }
    
    // 处理嵌套路径
    const parts = path.split('.');
    let current = obj;
    
    // 遍历路径，直到倒数第二部分
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      
      // 如果不存在，创建新对象
      if (current[part] === undefined || current[part] === null || typeof current[part] !== 'object') {
        current[part] = {};
      }
      
      current = current[part];
    }
    
    // 设置最终值
    current[parts[parts.length - 1]] = value;
  }
  
  /**
   * 触发变更回调
   * @param key 配置键
   * @param value 新值
   * @param oldValue 旧值
   */
  private triggerChangeCallbacks(key: string, value: any, oldValue: any): void {
    // 触发特定键的回调
    if (this.changeCallbacks.has(key)) {
      const callbacks = this.changeCallbacks.get(key)!;
      callbacks.forEach(callback => {
        try {
          callback(value, oldValue);
        } catch (error) {
          console.error(`Error in config change callback for key ${key}:`, error);
        }
      });
    }
    
    // 触发父路径的回调
    const parts = key.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentKey = parts.join('.');
      
      if (this.changeCallbacks.has(parentKey)) {
        const parentValue = this.get(parentKey);
        this.changeCallbacks.get(parentKey)!.forEach(callback => {
          try {
            callback(parentValue, parentValue);
          } catch (error) {
            console.error(`Error in config change callback for parent key ${parentKey}:`, error);
          }
        });
      }
    }
  }

  /**
   * 检查模块是否启用
   * @param moduleName 模块名称
   */
  public isModuleEnabled(moduleName: string): boolean {
    const key = `modules.${moduleName}.enabled`;
    return this.get(key) ?? false;
  }
}

/**
 * 全局配置接口
 */
export interface GlobalConfig {
  /** 版本号 */
  version: string;
  /** 调试模式 */
  debug: boolean;
  /** 日志级别 */
  logLevel: string;
  /** 摄像头配置 */
  camera: {
    resolution: { width: number; height: number };
    frameRate: number;
    facingMode: string;
  };
  /** 性能配置 */
  performance: {
    useCache: boolean;
  };
  /** 模块配置 */
  modules: {
    face: { enabled: boolean };
    idcard: { enabled: boolean };
    qrcode: { enabled: boolean };
  };
} 

/**
 * 模块配置接口
 * 定义所有模块共享的基础配置属性
 */
export interface ModuleConfig {
  /** 是否启用该模块 */
  enabled: boolean;
  /** 其他模块特定配置 */
  [key: string]: any;
} 