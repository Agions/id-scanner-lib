/**
 * @file 扫描器模块接口
 * @description 定义所有扫描模块共享的核心接口
 * @module interfaces/scanner-module
 */

import { EventEmitter } from '../core/event-emitter';
import { Result } from '../core/result';
import { ModuleConfig } from '../core/config';
import { Module } from '../core/module-manager';

/**
 * 模块状态枚举
 */
export enum ModuleStatus {
  /** 未初始化 */
  NOT_INITIALIZED = 'not_initialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 就绪 */
  READY = 'ready',
  /** 处理中 */
  PROCESSING = 'processing',
  /** 暂停 */
  PAUSED = 'paused',
  /** 错误 */
  ERROR = 'error'
}

/**
 * 模块类型枚举
 */
export enum ModuleType {
  /** 人脸识别模块 */
  FACE = 'face',
  /** 二维码扫描模块 */
  QR = 'qr',
  /** 身份证识别模块 */
  IDCARD = 'idcard',
  /** OCR识别模块 */
  OCR = 'ocr'
}

/**
 * 模块能力接口
 * 描述模块支持的功能
 */
export interface ModuleCapabilities {
  /** 是否支持视频处理 */
  supportsVideo: boolean;
  /** 是否支持图片处理 */
  supportsImage: boolean;
  /** 是否支持批量处理 */
  supportsBatch: boolean;
  /** 是否支持实时处理 */
  supportsRealtime: boolean;
  /** 是否支持Web Worker处理 */
  supportsWebWorker: boolean;
  /** 支持的媒体类型 */
  supportedMediaTypes: string[];
  /** 其他能力 */
  [key: string]: any;
}

/**
 * 模块事件
 */
export enum ModuleEvent {
  /** 初始化开始 */
  INIT_START = 'module:init:start',
  /** 初始化完成 */
  INIT_COMPLETE = 'module:init:complete',
  /** 初始化失败 */
  INIT_ERROR = 'module:init:error',
  /** 处理开始 */
  PROCESS_START = 'module:process:start',
  /** 处理完成 */
  PROCESS_COMPLETE = 'module:process:complete',
  /** 处理失败 */
  PROCESS_ERROR = 'module:process:error',
  /** 处理进度 */
  PROCESS_PROGRESS = 'module:process:progress',
  /** 实时结果 */
  REALTIME_RESULT = 'module:realtime:result',
  /** 状态变更 */
  STATUS_CHANGE = 'module:status:change'
}

/**
 * 模块初始化选项
 */
export interface ModuleInitOptions {
  /** 模块配置 */
  config?: ModuleConfig;
  /** 使用Web Worker */
  useWorker?: boolean;
  /** Web Worker脚本路径 */
  workerPath?: string;
  /** 是否启用调试 */
  debug?: boolean;
  /** 是否绑定摄像头 */
  bindCamera?: boolean;
  /** 目标DOM元素 */
  targetElement?: HTMLElement;
  /** 模型路径 */
  modelPath?: string;
  /** 其他选项 */
  [key: string]: any;
}

/**
 * 扫描器模块接口
 * 定义所有扫描模块必须实现的基础接口
 */
export interface IScannerModule extends EventEmitter, Module {
  /** 模块类型 */
  readonly type: ModuleType;
  
  /** 模块当前状态 */
  readonly status: ModuleStatus;
  
  /** 模块能力 */
  readonly capabilities: ModuleCapabilities;
  
  /**
   * 处理图片
   * @param image 图片源（URL、HTMLImageElement或其他支持的格式）
   * @param options 处理选项
   */
  processImage(image: string | HTMLImageElement | HTMLCanvasElement | ImageData, 
               options?: Record<string, any>): Promise<Result<any>>;
  
  /**
   * 开始实时处理
   * @param videoElement 视频元素，不提供时将使用绑定的摄像头
   * @param options 处理选项
   */
  startRealtime(videoElement?: HTMLVideoElement, options?: Record<string, any>): Promise<Result<boolean>>;
  
  /**
   * 停止实时处理
   */
  stopRealtime(): void;
  
  /**
   * 暂停处理
   */
  pause(): void;
  
  /**
   * 恢复处理
   */
  resume(): Promise<boolean>;
  
  /**
   * 重置模块状态
   */
  reset(): void;
  
  /**
   * 获取模块版本
   */
  getVersion(): string;
  
  /**
   * 获取模块状态
   */
  getStatus(): ModuleStatus;
  
  /**
   * 获取模块配置
   */
  getConfig(): ModuleConfig;
  
  /**
   * 更新模块配置
   * @param config 新配置
   */
  updateConfig(config: Partial<ModuleConfig>): void;
}

/**
 * 基础扫描器结果接口
 */
export interface BaseScannerResult {
  /** 结果ID */
  id: string;
  /** 结果类型 */
  type: string;
  /** 处理时间(毫秒) */
  processingTime: number;
  /** 时间戳 */
  timestamp: number;
  /** 置信度(0-1) */
  confidence: number;
  /** 原始数据 */
  rawData?: any;
}

/**
 * 基础扫描器模块抽象类
 * 提供通用的模块功能实现
 */
export abstract class BaseScannerModule extends EventEmitter implements IScannerModule {
  /** 模块类型 */
  abstract readonly type: ModuleType;
  
  /** 模块当前状态 */
  protected _status: ModuleStatus = ModuleStatus.NOT_INITIALIZED;
  
  /** 模块配置 */
  protected config: ModuleConfig;
  
  /** 模块版本 */
  public readonly version: string = '1.0.0';
  
  /** 是否为调试模式 */
  protected debug: boolean = false;
  
  /** 
   * 构造函数
   * @param config 初始配置
   */
  constructor(config: ModuleConfig = { enabled: true }) {
    super();
    this.config = { ...config };
  }
  
  /**
   * 获取模块状态
   */
  get status(): ModuleStatus {
    return this._status;
  }
  
  /**
   * 设置模块状态
   */
  protected setStatus(status: ModuleStatus): void {
    if (this._status !== status) {
      const oldStatus = this._status;
      this._status = status;
      this.emit(ModuleEvent.STATUS_CHANGE, { oldStatus, newStatus: status });
    }
  }
  
  /**
   * 获取模块能力
   */
  abstract get capabilities(): ModuleCapabilities;
  
  /**
   * 初始化模块
   * @param options 初始化选项
   */
  abstract initialize(options?: ModuleInitOptions): Promise<void>;
  
  /**
   * 处理图片
   * @param image 图片源（URL、HTMLImageElement或其他支持的格式）
   * @param options 处理选项
   */
  abstract processImage(image: string | HTMLImageElement | HTMLCanvasElement | ImageData, 
                      options?: Record<string, any>): Promise<Result<any>>;
  
  /**
   * 开始实时处理
   * @param videoElement 视频元素，不提供时将使用绑定的摄像头
   * @param options 处理选项
   */
  abstract startRealtime(videoElement?: HTMLVideoElement, options?: Record<string, any>): Promise<Result<boolean>>;
  
  /**
   * 停止实时处理
   */
  abstract stopRealtime(): void;
  
  /**
   * 暂停处理
   */
  pause(): void {
    this.checkInitialized();
    
    if (this._status === ModuleStatus.PROCESSING) {
      this.setStatus(ModuleStatus.PAUSED);
      this.emit('paused');
    }
  }
  
  /**
   * 恢复处理
   */
  async resume(): Promise<boolean> {
    this.checkInitialized();
    
    if (this._status === ModuleStatus.PAUSED) {
      this.setStatus(ModuleStatus.PROCESSING);
      this.emit('resumed');
      return true;
    }
    
    return false;
  }
  
  /**
   * 释放模块资源
   */
  abstract dispose(): Promise<void>;
  
  /**
   * 重置模块状态
   */
  reset(): void {
    this.checkInitialized();
    
    // 重置模块状态
    this.setStatus(ModuleStatus.READY);
    this.emit('reset');
  }
  
  /**
   * 获取模块版本
   */
  getVersion(): string {
    return this.version;
  }
  
  /**
   * 获取模块状态
   */
  getStatus(): ModuleStatus {
    return this._status;
  }
  
  /**
   * 获取模块配置
   */
  getConfig(): ModuleConfig {
    return { ...this.config };
  }
  
  /**
   * 更新模块配置
   * @param config 新配置
   */
  updateConfig(config: Partial<ModuleConfig>): void {
    Object.assign(this.config, config);
    this.emit('config:updated', { config: this.config });
  }
  
  /**
   * 检查模块是否已初始化
   */
  protected checkInitialized(): void {
    if (this._status === ModuleStatus.NOT_INITIALIZED || this._status === ModuleStatus.INITIALIZING) {
      throw new Error(`Module ${this.type} is not initialized`);
    }
  }
  
  /**
   * 检查模块是否就绪
   */
  protected checkReady(): void {
    this.checkInitialized();
    
    if (this._status !== ModuleStatus.READY) {
      throw new Error(`Module ${this.type} is not ready`);
    }
  }
  
  /**
   * 获取模块名称
   */
  get name(): string {
    return this.type;
  }
  
  /**
   * 获取模块是否已初始化
   */
  get isInitialized(): boolean {
    return this._status !== ModuleStatus.NOT_INITIALIZED;
  }
} 