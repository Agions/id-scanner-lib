/**
 * @file 资源管理器
 * @description 提供资源加载、缓存和释放功能
 * @module core/resource-manager
 */

import { ConfigManager } from './config';
import { Logger } from './logger';
import { ResourceLoadError } from './errors';
import { EventEmitter } from './event-emitter';
import { Result } from './result';

/**
 * 资源类型枚举
 */
export enum ResourceType {
  MODEL = 'model',        // 模型文件
  WASM = 'wasm',          // WebAssembly文件
  IMAGE = 'image',        // 图片文件
  JSON = 'json',          // JSON文件
  TEXT = 'text',          // 文本文件
  ARRAYBUFFER = 'buffer', // 二进制数据
  WORKER = 'worker',      // Web Worker脚本
  OTHER = 'other'         // 其他资源
}

/**
 * 资源接口
 */
export interface Resource<T = any> {
  /** 资源ID */
  id: string;
  /** 资源类型 */
  type: ResourceType;
  /** 资源URL或数据 */
  url: string;
  /** 是否已加载 */
  loaded: boolean;
  /** 加载的数据 */
  data?: T;
  /** 上次使用时间戳 */
  lastUsed: number;
  /** 是否为永久资源（不自动释放） */
  permanent: boolean;
  /** 获取资源大小（如果可计算） */
  getSize(): number;
}

/**
 * 资源加载选项
 */
export interface ResourceLoadOptions {
  /** 是否缓存 */
  cache?: boolean;
  /** 是否为永久资源（不自动释放） */
  permanent?: boolean;
  /** 资源类型（自动推断） */
  type?: ResourceType;
  /** 加载超时(ms) */
  timeout?: number;
  /** 是否替换现有资源 */
  forceReload?: boolean;
  /** 是否使用凭证 */
  credentials?: RequestCredentials;
  /** 自定义请求头 */
  headers?: Record<string, string>;
}

/**
 * 资源统计信息
 */
export interface ResourceStats {
  /** 总资源数 */
  totalCount: number;
  /** 总内存使用(字节) */
  totalSize: number;
  /** 各类型资源数 */
  byType: Record<ResourceType, number>;
  /** 各类型资源大小(字节) */
  sizeByType: Record<ResourceType, number>;
}

/**
 * 资源管理器事件
 */
export enum ResourceManagerEvent {
  /** 资源加载开始 */
  LOAD_START = 'resource:load:start',
  /** 资源加载成功 */
  LOAD_SUCCESS = 'resource:load:success',
  /** 资源加载失败 */
  LOAD_ERROR = 'resource:load:error',
  /** 资源加载进度 */
  LOAD_PROGRESS = 'resource:load:progress',
  /** 资源被释放 */
  RESOURCE_RELEASED = 'resource:released',
  /** 资源统计更新 */
  STATS_UPDATED = 'resource:stats:updated'
}

/**
 * 资源管理器
 * 提供统一的资源加载、缓存和管理功能
 */
export class ResourceManager extends EventEmitter {
  /** 单例实例 */
  private static instance: ResourceManager;
  /** 资源映射表 */
  private resources: Map<string, Resource> = new Map();
  /** 配置管理器 */
  private config: ConfigManager;
  /** 日志记录器 */
  private logger: Logger;
  /** 缓存清理计时器ID */
  private cleanupTimerId: number | null = null;
  /** 默认基础路径 */
  private basePath: string = '';
  /** 加载中的资源请求 */
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private initialized: boolean = false;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    super();
    this.config = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
    
    // 初始化资源清理定时器
    this.setupCleanupTimer();
    
    // 页面卸载时尝试释放资源
    window.addEventListener('beforeunload', () => {
      if (this.config.get('autoReleaseResources', true)) {
        this.releaseAll();
      }
    });
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }
  
  /**
   * 设置基础路径
   * @param path 基础路径
   */
  setBasePath(path: string): void {
    if (path && !path.endsWith('/')) {
      path += '/';
    }
    this.basePath = path;
  }
  
  /**
   * 获取资源完整URL
   */
  private getFullUrl(url: string): string {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    return this.basePath + url;
  }
  
  /**
   * 从URL推断资源类型
   */
  private inferResourceType(url: string): ResourceType {
    if (url.startsWith('data:')) {
      const mimeType = url.split(',')[0].split(':')[1].split(';')[0];
      if (mimeType.startsWith('image/')) return ResourceType.IMAGE;
      if (mimeType === 'application/json') return ResourceType.JSON;
      if (mimeType === 'text/plain') return ResourceType.TEXT;
      return ResourceType.OTHER;
    }
    
    // 获取文件扩展名
    const ext = url.split('?')[0].split('#')[0].split('.').pop()?.toLowerCase() || '';
    
    switch (ext) {
      case 'json': return ResourceType.JSON;
      case 'png': case 'jpg': case 'jpeg': case 'gif': case 'webp': case 'bmp': case 'svg':
        return ResourceType.IMAGE;
      case 'wasm': case 'wat': 
        return ResourceType.WASM;
      case 'txt': case 'md': case 'csv': case 'tsv': case 'html': case 'xml': case 'css': case 'js': 
        return ResourceType.TEXT;
      case 'bin': case 'dat': 
        return ResourceType.ARRAYBUFFER;
      default:
        return ResourceType.OTHER;
    }
  }
  
  /**
   * 加载资源
   * @param id 资源ID
   * @param url 资源URL
   * @param options 加载选项
   */
  async load<T = any>(id: string, url: string, options: ResourceLoadOptions = {}): Promise<Result<T>> {
    const { 
      cache = true,
      permanent = false,
      type = this.inferResourceType(url),
      timeout = 30000,
      forceReload = false,
      credentials = 'same-origin',
      headers = {}
    } = options;
    
    const fullUrl = this.getFullUrl(url);
    
    // 检查资源是否已存在
    if (!forceReload && this.resources.has(id)) {
      const resource = this.resources.get(id)!;
      resource.lastUsed = Date.now();
      
      if (resource.loaded && resource.data !== undefined) {
        this.logger.debug('ResourceManager', `Resource ${id} loaded from cache`);
        return Result.success(resource.data as T);
      }
    }
    
    // 检查是否在加载队列中
    if (this.pendingRequests.has(id)) {
      try {
        const data = await this.pendingRequests.get(id)!;
        return Result.success(data as T);
      } catch (error) {
        return Result.failure(new ResourceLoadError(id, (error as Error).message));
      }
    }
    
    // 开始加载资源
    this.emit(ResourceManagerEvent.LOAD_START, { id, url: fullUrl });
    
    let loadPromise: Promise<any>;
    
    switch (type) {
      case ResourceType.IMAGE:
        loadPromise = this.loadImage(fullUrl);
        break;
      case ResourceType.JSON:
        loadPromise = this.loadJson(fullUrl, { credentials, headers });
        break;
      case ResourceType.TEXT:
        loadPromise = this.loadText(fullUrl, { credentials, headers });
        break;
      case ResourceType.ARRAYBUFFER:
        loadPromise = this.loadArrayBuffer(fullUrl, { credentials, headers });
        break;
      case ResourceType.WASM:
        loadPromise = this.loadWasm(fullUrl, { credentials, headers });
        break;
      default:
        loadPromise = this.loadGeneric(fullUrl, type, { credentials, headers });
    }
    
    // 添加超时处理
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timerId = setTimeout(() => {
        reject(new Error(`Resource ${id} load timeout after ${timeout}ms`));
      }, timeout);
      
      // 请求完成后清除计时器
      loadPromise.then(() => clearTimeout(timerId), () => clearTimeout(timerId));
    });
    
    // 添加到加载队列
    const racePromise = Promise.race([loadPromise, timeoutPromise]);
    this.pendingRequests.set(id, racePromise);
    
    try {
      const data = await racePromise;
      
      // 创建或更新资源
      const resource: Resource<T> = {
        id,
        type,
        url: fullUrl,
        loaded: true,
        data,
        lastUsed: Date.now(),
        permanent,
        getSize: () => this.calculateResourceSize(data, type)
      };
      
      if (cache) {
        this.resources.set(id, resource);
      }
      
      this.emit(ResourceManagerEvent.LOAD_SUCCESS, { id, resource });
      this.updateStats();
      
      return Result.success(data);
    } catch (error) {
      const errorMessage = (error as Error).message || String(error);
      this.logger.error('ResourceManager', `Failed to load resource ${id}: ${errorMessage}`);
      
      this.emit(ResourceManagerEvent.LOAD_ERROR, { id, error });
      
      return Result.failure(new ResourceLoadError(id, errorMessage));
    } finally {
      this.pendingRequests.delete(id);
    }
  }
  
  /**
   * 加载图片资源
   */
  private loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      
      image.crossOrigin = 'anonymous';
      image.src = url;
    });
  }
  
  /**
   * 加载JSON资源
   */
  private async loadJson(url: string, options: RequestInit): Promise<any> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
  
  /**
   * 加载文本资源
   */
  private async loadText(url: string, options: RequestInit): Promise<string> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return response.text();
  }
  
  /**
   * 加载二进制数据
   */
  private async loadArrayBuffer(url: string, options: RequestInit): Promise<ArrayBuffer> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    return response.arrayBuffer();
  }
  
  /**
   * 加载WebAssembly模块
   */
  private async loadWasm(url: string, options: RequestInit): Promise<WebAssembly.Module> {
    const buffer = await this.loadArrayBuffer(url, options);
    return WebAssembly.compile(buffer);
  }
  
  /**
   * 加载通用资源
   */
  private async loadGeneric(url: string, type: ResourceType, options: RequestInit): Promise<any> {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    // 根据响应类型决定如何处理数据
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      return response.text();
    } else {
      return response.arrayBuffer();
    }
  }
  
  /**
   * 预加载多个资源
   * @param resources 资源配置数组，每项包含id和url
   */
  async preload(resources: Array<{ id: string; url: string; options?: ResourceLoadOptions }>): Promise<Result<Record<string, any>>> {
    const results: Record<string, any> = {};
    const errors: Array<{ id: string; error: Error }> = [];
    
    // 并行加载所有资源
    const promises = resources.map(async ({ id, url, options }) => {
      const result = await this.load(id, url, options);
      
      if (result.isSuccess() && result.data !== undefined) {
        results[id] = result.data;
      } else if (result.isFailure() && result.error) {
        errors.push({ id, error: result.error });
      }
    });
    
    await Promise.all(promises);
    
    // 如果有错误，返回失败结果
    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.id}: ${e.error.message}`).join('; ');
      return Result.failure(
        new ResourceLoadError('multiple', `Failed to load resources: ${errorMessages}`),
        { 
          successfulLoads: results, 
          failedLoads: errors.map(e => e.id) 
        }
      );
    }
    
    return Result.success(results);
  }
  
  /**
   * 获取资源
   * @param id 资源ID
   */
  get<T = any>(id: string): T | undefined {
    const resource = this.resources.get(id);
    
    if (resource) {
      resource.lastUsed = Date.now();
      return resource.data as T;
    }
    
    return undefined;
  }
  
  /**
   * 检查资源是否存在
   * @param id 资源ID
   */
  has(id: string): boolean {
    return this.resources.has(id);
  }
  
  /**
   * 获取资源
   * 如果不存在，则使用工厂函数创建并缓存
   * 
   * @param id 资源ID
   * @param factory 资源工厂函数
   * @param type 资源类型
   * @param permanent 是否永久保留
   */
  getOrCreate<T = any>(
    id: string,
    factory: () => T | Promise<T>,
    type: ResourceType = ResourceType.OTHER,
    permanent: boolean = false
  ): Promise<T> {
    // 检查资源是否已存在
    if (this.resources.has(id)) {
      const resource = this.resources.get(id)!;
      resource.lastUsed = Date.now();
      return Promise.resolve(resource.data as T);
    }
    
    // 检查是否在加载队列中
    if (this.pendingRequests.has(id)) {
      return this.pendingRequests.get(id) as Promise<T>;
    }
    
    // 创建资源
    const createPromise = Promise.resolve().then(async () => {
      try {
        const data = await factory();
        
        // 创建或更新资源
        const resource: Resource<T> = {
          id,
          type,
          url: '',
          loaded: true,
          data,
          lastUsed: Date.now(),
          permanent,
          getSize: () => this.calculateResourceSize(data, type)
        };
        
        this.resources.set(id, resource);
        this.emit(ResourceManagerEvent.LOAD_SUCCESS, { id, resource });
        this.updateStats();
        
        return data;
      } catch (error) {
        this.logger.error('ResourceManager', `Failed to create resource ${id}: ${error}`);
        this.emit(ResourceManagerEvent.LOAD_ERROR, { id, error });
        throw error;
      } finally {
        this.pendingRequests.delete(id);
      }
    });
    
    // 添加到加载队列
    this.pendingRequests.set(id, createPromise);
    
    return createPromise;
  }
  
  /**
   * 释放资源
   * @param id 资源ID
   */
  release(id: string): boolean {
    if (!this.resources.has(id)) {
      return false;
    }
    
    const resource = this.resources.get(id)!;
    
    // 执行特定类型的清理
    this.cleanupResource(resource);
    
    // 从映射中删除
    this.resources.delete(id);
    
    this.emit(ResourceManagerEvent.RESOURCE_RELEASED, { id });
    this.updateStats();
    
    this.logger.debug('ResourceManager', `Released resource ${id}`);
    return true;
  }
  
  /**
   * 释放资源组
   * @param pattern 资源ID匹配模式，可以是字符串前缀或正则表达式
   */
  releaseGroup(pattern: string | RegExp): number {
    let count = 0;
    
    for (const [id, resource] of this.resources.entries()) {
      // 如果是永久资源则跳过
      if (resource.permanent) continue;
      
      let matches = false;
      if (typeof pattern === 'string') {
        matches = id.startsWith(pattern);
      } else {
        matches = pattern.test(id);
      }
      
      if (matches && this.release(id)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * 释放所有非永久资源
   */
  releaseAll(): number {
    let count = 0;
    
    for (const id of this.resources.keys()) {
      const resource = this.resources.get(id)!;
      
      // 跳过永久资源
      if (resource.permanent) continue;
      
      if (this.release(id)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * 释放过期资源
   * @param maxAge 最大闲置时间(毫秒)
   */
  releaseExpired(maxAge: number): number {
    const now = Date.now();
    let count = 0;
    
    for (const [id, resource] of this.resources.entries()) {
      // 跳过永久资源
      if (resource.permanent) continue;
      
      // 检查是否过期
      const age = now - resource.lastUsed;
      if (age > maxAge && this.release(id)) {
        count++;
      }
    }
    
    return count;
  }
  
  /**
   * 计算资源大小
   * @param data 资源数据
   * @param type 资源类型
   */
  private calculateResourceSize(data: any, type: ResourceType): number {
    if (!data) return 0;
    
    switch (type) {
      case ResourceType.IMAGE:
        // 粗略估计图像大小
        if (data instanceof HTMLImageElement) {
          return data.width * data.height * 4; // 假设4字节/像素 (RGBA)
        }
        break;
      case ResourceType.ARRAYBUFFER:
        return (data as ArrayBuffer).byteLength;
      case ResourceType.TEXT:
        return (data as string).length * 2; // 假设2字节/字符
      case ResourceType.JSON:
        return JSON.stringify(data).length * 2; // 假设2字节/字符
      default:
        // 尝试推断大小
        if (data.byteLength) {
          return data.byteLength;
        }
        if (typeof data === 'string') {
          return data.length * 2;
        }
        if (typeof data === 'object') {
          return JSON.stringify(data).length * 2;
        }
    }
    
    // 无法计算的资源返回0
    return 0;
  }
  
  /**
   * 清理特定资源
   * @param resource 资源对象
   */
  private cleanupResource(resource: Resource): void {
    if (!resource.data) return;
    
    switch (resource.type) {
      case ResourceType.IMAGE:
        // 释放图像
        if (resource.data instanceof HTMLImageElement) {
          // 将src设置为空白图像可以帮助浏览器释放内存
          (resource.data as HTMLImageElement).src = '';
        }
        break;
    }
    
    // 移除资源数据引用
    resource.data = undefined;
  }
  
  /**
   * 设置资源清理定时器
   */
  private setupCleanupTimer(): void {
    const interval = 60000; // 每分钟检查一次
    
    this.cleanupTimerId = window.setInterval(() => {
      // 检查缓存设置
      if (!this.config.get('performance.useCache', true)) {
        // 如果禁用缓存，释放所有非永久资源
        this.releaseAll();
        return;
      }
      
      // 默认10分钟不使用自动释放
      const maxAge = 10 * 60 * 1000;
      this.releaseExpired(maxAge);
    }, interval);
  }
  
  /**
   * 获取资源统计信息
   */
  getStats(): ResourceStats {
    const stats: ResourceStats = {
      totalCount: 0,
      totalSize: 0,
      byType: {} as Record<ResourceType, number>,
      sizeByType: {} as Record<ResourceType, number>
    };
    
    // 初始化类型计数器
    Object.values(ResourceType).forEach(type => {
      stats.byType[type] = 0;
      stats.sizeByType[type] = 0;
    });
    
    // 统计资源
    for (const resource of this.resources.values()) {
      stats.totalCount++;
      
      const size = resource.getSize();
      stats.totalSize += size;
      
      stats.byType[resource.type]++;
      stats.sizeByType[resource.type] += size;
    }
    
    return stats;
  }
  
  /**
   * 更新并发布资源统计信息
   */
  private updateStats(): void {
    const stats = this.getStats();
    this.emit(ResourceManagerEvent.STATS_UPDATED, stats);
  }

  /**
   * 初始化资源管理器
   * @param options 初始化选项
   */
  public async initialize(options?: {
    basePath?: string;
    preloadResources?: Array<{ id: string; url: string; type?: ResourceType }>;
  }): Promise<void> {
    if (this.initialized) {
      this.logger.debug('ResourceManager', '资源管理器已初始化');
      return;
    }

    this.logger.debug('ResourceManager', '初始化资源管理器');

    // 设置基础路径
    if (options?.basePath) {
      this.setBasePath(options.basePath);
    }

    // 预加载资源
    if (options?.preloadResources) {
      const loadPromises = options.preloadResources.map(resource => {
        const loadOptions: ResourceLoadOptions = {};
        if (resource.type) {
          loadOptions.type = resource.type;
        }
        return this.load(resource.id, resource.url, loadOptions);
      });
      await Promise.all(loadPromises);
    }

    this.initialized = true;
    this.emit('manager:initialized', {});
    this.logger.debug('ResourceManager', '资源管理器初始化完成');
  }
} 