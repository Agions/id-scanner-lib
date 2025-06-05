/**
 * @file 插件管理器
 * @description 提供插件的注册、初始化和管理功能
 * @module core/plugin-manager
 */

import { EventEmitter } from 'events';
import { Logger } from './logger';
import { ConfigManager } from './config';
import { IDScannerError } from './errors';

/**
 * 插件优先级枚举
 */
export enum PluginPriority {
  /** 高优先级，最先初始化和激活 */
  HIGH = 'high',
  /** 中等优先级 */
  NORMAL = 'normal',
  /** 低优先级，最后初始化和激活 */
  LOW = 'low'
}

/**
 * 插件状态枚举
 */
export enum PluginStatus {
  /** 已注册 */
  REGISTERED = 'registered',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 已初始化 */
  INITIALIZED = 'initialized',
  /** 激活中 */
  ACTIVATING = 'activating',
  /** 已激活 */
  ACTIVE = 'active',
  /** 已停用 */
  INACTIVE = 'inactive',
  /** 错误状态 */
  ERROR = 'error'
}

/**
 * 插件接口
 */
export interface Plugin {
  /** 插件ID */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description?: string;
  /** 插件优先级 */
  priority?: PluginPriority;
  /** 依赖的插件ID列表 */
  dependencies?: string[];
  /** 初始化方法 */
  initialize?: (api: PluginAPI) => Promise<void>;
  /** 激活方法 */
  activate?: (api: PluginAPI) => Promise<void>;
  /** 停用方法 */
  deactivate?: (api: PluginAPI) => Promise<void>;
}

/**
 * 插件API接口
 * 提供给插件使用的API
 */
export interface PluginAPI {
  /** 日志记录器 */
  logger: Logger;
  /** 配置管理器 */
  config: ConfigManager;
  /** 事件发射器 */
  eventBus: EventEmitter;
  /** 获取插件 */
  getPlugin: (id: string) => Plugin | undefined;
  /** 获取所有插件 */
  getAllPlugins: () => Map<string, Plugin>;
}

/**
 * 插件管理器
 * 提供插件的注册、初始化和管理功能
 */
export class PluginManager extends EventEmitter {
  /** 单例实例 */
  private static instance: PluginManager;
  
  /** 日志记录器 */
  private logger: Logger;
  
  /** 配置管理器 */
  private config: ConfigManager;
  
  /** 插件映射表 */
  private plugins: Map<string, Plugin> = new Map();
  
  /** 插件状态 */
  private pluginStatus: Map<string, PluginStatus> = new Map();
  
  /** 插件API */
  private pluginAPI: PluginAPI;
  
  /** 初始化状态 */
  private initialized: boolean = false;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    super();
    
    this.logger = Logger.getInstance();
    this.config = ConfigManager.getInstance();
    
    // 创建插件API
    this.pluginAPI = {
      logger: this.logger,
      config: this.config,
      eventBus: this,
      getPlugin: this.getPlugin.bind(this),
      getAllPlugins: this.getAllPlugins.bind(this)
    };
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }
  
  /**
   * 初始化插件管理器
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      this.logger.debug('PluginManager', '插件管理器已初始化');
      return;
    }
    
    this.logger.debug('PluginManager', '初始化插件管理器');
    
    this.initialized = true;
    this.emit('manager:initialized', {});
  }
  
  /**
   * 注册插件
   * @param plugin 插件
   */
  public registerPlugin(plugin: Plugin): void {
    if (!plugin.id) {
      throw new Error('插件ID不能为空');
    }
    
    if (this.plugins.has(plugin.id)) {
      this.logger.warn('PluginManager', `插件已注册: ${plugin.id}`);
      return;
    }
    
    // 设置默认优先级
    if (!plugin.priority) {
      plugin.priority = PluginPriority.NORMAL;
    }
    
    this.plugins.set(plugin.id, plugin);
    this.pluginStatus.set(plugin.id, PluginStatus.REGISTERED);
    
    this.logger.info('PluginManager', `注册插件: ${plugin.name} (${plugin.id}) v${plugin.version}`);
    this.emit('plugin:registered', { plugin });
  }
  
  /**
   * 卸载插件
   * @param id 插件ID
   */
  public unregisterPlugin(id: string): boolean {
    if (!this.plugins.has(id)) {
      return false;
    }
    
    // 如果插件处于激活状态，先停用
    if (this.pluginStatus.get(id) === PluginStatus.ACTIVE) {
      this.deactivatePlugin(id);
    }
    
    const plugin = this.plugins.get(id)!;
    this.plugins.delete(id);
    this.pluginStatus.delete(id);
    
    this.logger.info('PluginManager', `卸载插件: ${plugin.name} (${id})`);
    this.emit('plugin:unregistered', { plugin });
    
    return true;
  }
  
  /**
   * 初始化插件
   * @param id 插件ID
   */
  public async initializePlugin(id: string): Promise<boolean> {
    if (!this.plugins.has(id)) {
      this.logger.warn('PluginManager', `初始化失败: 插件不存在 ${id}`);
      return false;
    }
    
    const plugin = this.plugins.get(id)!;
    const status = this.pluginStatus.get(id)!;
    
    if (status === PluginStatus.INITIALIZED || status === PluginStatus.ACTIVE) {
      this.logger.debug('PluginManager', `插件已初始化: ${id}`);
      return true;
    }
    
    if (status === PluginStatus.INITIALIZING) {
      this.logger.warn('PluginManager', `插件正在初始化中: ${id}`);
      return false;
    }
    
    // 检查依赖
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      for (const depId of plugin.dependencies) {
        if (!this.plugins.has(depId)) {
          this.logger.error('PluginManager', `初始化失败: 依赖的插件不存在 ${depId}`);
          this.pluginStatus.set(id, PluginStatus.ERROR);
          return false;
        }
        
        // 初始化依赖插件
        const depStatus = this.pluginStatus.get(depId);
        if (depStatus !== PluginStatus.INITIALIZED && depStatus !== PluginStatus.ACTIVE) {
          const success = await this.initializePlugin(depId);
          if (!success) {
            this.logger.error('PluginManager', `初始化失败: 依赖的插件初始化失败 ${depId}`);
            this.pluginStatus.set(id, PluginStatus.ERROR);
            return false;
          }
        }
      }
    }
    
    this.pluginStatus.set(id, PluginStatus.INITIALIZING);
    this.emit('plugin:initializing', { plugin });
    
    try {
      if (plugin.initialize) {
        await plugin.initialize(this.pluginAPI);
      }
      
      this.pluginStatus.set(id, PluginStatus.INITIALIZED);
      this.logger.debug('PluginManager', `插件初始化成功: ${plugin.name} (${id})`);
      this.emit('plugin:initialized', { plugin });
      
      return true;
    } catch (error) {
      this.pluginStatus.set(id, PluginStatus.ERROR);
      this.logger.error('PluginManager', `插件初始化失败: ${id}`, error as Error);
      this.emit('plugin:error', { plugin, error });
      
      return false;
    }
  }
  
  /**
   * 激活插件
   * @param id 插件ID
   */
  public async activatePlugin(id: string): Promise<boolean> {
    if (!this.plugins.has(id)) {
      this.logger.warn('PluginManager', `激活失败: 插件不存在 ${id}`);
      return false;
    }
    
    const plugin = this.plugins.get(id)!;
    const status = this.pluginStatus.get(id)!;
    
    if (status === PluginStatus.ACTIVE) {
      this.logger.debug('PluginManager', `插件已激活: ${id}`);
      return true;
    }
    
    if (status === PluginStatus.ACTIVATING) {
      this.logger.warn('PluginManager', `插件正在激活中: ${id}`);
      return false;
    }
    
    if (status !== PluginStatus.INITIALIZED) {
      // 尝试初始化插件
      const success = await this.initializePlugin(id);
      if (!success) {
        this.logger.error('PluginManager', `激活失败: 插件初始化失败 ${id}`);
        return false;
      }
    }
    
    // 激活依赖插件
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      for (const depId of plugin.dependencies) {
        const depStatus = this.pluginStatus.get(depId);
        if (depStatus !== PluginStatus.ACTIVE) {
          const success = await this.activatePlugin(depId);
          if (!success) {
            this.logger.error('PluginManager', `激活失败: 依赖的插件激活失败 ${depId}`);
            return false;
          }
        }
      }
    }
    
    this.pluginStatus.set(id, PluginStatus.ACTIVATING);
    this.emit('plugin:activating', { plugin });
    
    try {
      if (plugin.activate) {
        await plugin.activate(this.pluginAPI);
      }
      
      this.pluginStatus.set(id, PluginStatus.ACTIVE);
      this.logger.info('PluginManager', `插件激活成功: ${plugin.name} (${id})`);
      this.emit('plugin:activated', { plugin });
      
      return true;
    } catch (error) {
      this.pluginStatus.set(id, PluginStatus.ERROR);
      this.logger.error('PluginManager', `插件激活失败: ${id}`, error as Error);
      this.emit('plugin:error', { plugin, error });
      
      return false;
    }
  }
  
  /**
   * 停用插件
   * @param id 插件ID
   */
  public async deactivatePlugin(id: string): Promise<boolean> {
    if (!this.plugins.has(id)) {
      this.logger.warn('PluginManager', `停用失败: 插件不存在 ${id}`);
      return false;
    }
    
    const plugin = this.plugins.get(id)!;
    const status = this.pluginStatus.get(id)!;
    
    if (status !== PluginStatus.ACTIVE) {
      this.logger.debug('PluginManager', `插件未激活: ${id}`);
      return true;
    }
    
    // 检查依赖关系：如果有其他激活的插件依赖于此插件，则不能停用
    for (const [pluginId, p] of this.plugins.entries()) {
      if (p.dependencies && p.dependencies.includes(id) && this.pluginStatus.get(pluginId) === PluginStatus.ACTIVE) {
        this.logger.warn('PluginManager', `停用失败: 插件 ${pluginId} 依赖于此插件`);
        return false;
      }
    }
    
    this.emit('plugin:deactivating', { plugin });
    
    try {
      if (plugin.deactivate) {
        await plugin.deactivate(this.pluginAPI);
      }
      
      this.pluginStatus.set(id, PluginStatus.INACTIVE);
      this.logger.info('PluginManager', `插件停用成功: ${plugin.name} (${id})`);
      this.emit('plugin:deactivated', { plugin });
      
      return true;
    } catch (error) {
      this.pluginStatus.set(id, PluginStatus.ERROR);
      this.logger.error('PluginManager', `插件停用失败: ${id}`, error as Error);
      this.emit('plugin:error', { plugin, error });
      
      return false;
    }
  }
  
  /**
   * 获取插件
   * @param id 插件ID
   */
  public getPlugin(id: string): Plugin | undefined {
    return this.plugins.get(id);
  }
  
  /**
   * 获取所有插件
   */
  public getAllPlugins(): Map<string, Plugin> {
    return new Map(this.plugins);
  }
  
  /**
   * 获取插件状态
   * @param id 插件ID
   */
  public getPluginStatus(id: string): PluginStatus | undefined {
    return this.pluginStatus.get(id);
  }
  
  /**
   * 按优先级获取插件
   * @param priority 优先级
   */
  public getPluginsByPriority(priority: PluginPriority): Plugin[] {
    return Array.from(this.plugins.values())
      .filter(plugin => plugin.priority === priority);
  }
  
  /**
   * 获取按优先级排序的所有插件
   */
  public getSortedPlugins(): Plugin[] {
    const high = this.getPluginsByPriority(PluginPriority.HIGH);
    const normal = this.getPluginsByPriority(PluginPriority.NORMAL);
    const low = this.getPluginsByPriority(PluginPriority.LOW);
    
    return [...high, ...normal, ...low];
  }
} 