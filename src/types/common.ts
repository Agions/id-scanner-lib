/**
 * @file 通用类型定义
 * @description 提供项目通用的类型定义
 * @module types/common
 */

/**
 * 基础结果接口
 */
export interface BaseResult<T = unknown> {
  /** 是否成功 */
  success: boolean;
  /** 结果数据 */
  data?: T;
  /** 错误信息 */
  error?: string;
  /** 错误码 */
  code?: string;
}

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 总数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  pageSize: number;
  /** 是否有下一页 */
  hasMore: boolean;
}

/**
 * 通用配置接口
 */
export interface GenericConfig {
  /** 启用状态 */
  enabled?: boolean;
  /** 调试模式 */
  debug?: boolean;
  /** 超时时间(ms) */
  timeout?: number;
  /** 重试次数 */
  retries?: number;
}

/**
 * 回调函数类型
 */
export type Callback<T = unknown> = (error?: Error, result?: T) => void;

/**
 * 异步回调函数类型
 */
export type AsyncCallback<T = unknown> = (error?: Error, result?: T) => Promise<void>;

/**
 * 可取消的 Promise
 */
export interface CancellablePromise<T> {
  /** Promise 对象 */
  promise: Promise<T>;
  /** 取消函数 */
  cancel: () => void;
}

/**
 * 事件监听器类型
 */
export type EventListener<T = unknown> = (event: T) => void;

/**
 * 生命周期钩子
 */
export interface LifecycleHooks {
  /** 初始化前 */
  onBeforeInit?: () => void | Promise<void>;
  /** 初始化后 */
  onAfterInit?: () => void | Promise<void>;
  /** 销毁前 */
  onBeforeDestroy?: () => void | Promise<void>;
  /** 销毁后 */
  onAfterDestroy?: () => void | Promise<void>;
}

/**
 * 模块状态
 */
export enum ModuleState {
  /** 未初始化 */
  UNINITIALIZED = 'uninitialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 已初始化 */
  INITIALIZED = 'initialized',
  /** 运行中 */
  RUNNING = 'running',
  /** 已暂停 */
  PAUSED = 'paused',
  /** 已停止 */
  STOPPED = 'stopped',
  /** 错误 */
  ERROR = 'error',
  /** 已销毁 */
  DESTROYED = 'destroyed'
}

/**
 * 检测结果基类
 */
export interface DetectionResultBase {
  /** 置信度 (0-1) */
  confidence: number;
  /** 边界框 */
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 时间戳 */
  timestamp: number;
}

/**
 * 图像源类型
 */
export type ImageSource = string | HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData | Blob;

/**
 * 矩形区域
 */
export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 点
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 尺寸
 */
export interface Size {
  width: number;
  height: number;
}

/**
 * 键值对
 */
export interface KeyValuePair<K = string, V = unknown> {
  key: K;
  value: V;
}
