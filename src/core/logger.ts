/**
 * @file 日志系统
 * @description 提供统一的日志记录与管理功能
 * @module core/logger
 */

import { ConfigManager } from './config';

/**
 * 日志级别枚举
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * 日志条目接口
 */
export interface LogEntry {
  /** 日志级别 */
  level: LogLevel;
  /** 日志标签 */
  tag: string;
  /** 日志消息 */
  message: string;
  /** 时间戳 */
  timestamp: number;
  /** 额外数据 */
  data?: any;
  /** 错误 */
  error?: Error;
}

/**
 * 日志处理器接口
 */
export interface LogHandler {
  /**
   * 处理日志条目
   * @param entry 日志条目
   */
  handle(entry: LogEntry): void;
}

/**
 * 控制台日志处理器
 * 将日志输出到浏览器控制台
 */
export class ConsoleLogHandler implements LogHandler {
  /**
   * 处理日志条目
   * @param entry 日志条目
   */
  handle(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.tag}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.message, entry.error || '');
        break;
      case LogLevel.INFO:
        console.info(prefix, entry.message, entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.message, entry.error || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.message, entry.error || '');
        break;
      default:
        // 输出什么也不做
    }
  }
}

/**
 * 内存日志处理器
 * 将日志保存在内存中，用于后续分析或显示
 */
export class MemoryLogHandler implements LogHandler {
  /** 日志条目数组 */
  private entries: LogEntry[] = [];
  /** 最大日志条目数 */
  private maxEntries: number;
  
  /**
   * 构造函数
   * @param maxEntries 最大日志条目数，默认为1000
   */
  constructor(maxEntries: number = 1000) {
    this.maxEntries = maxEntries;
  }
  
  /**
   * 处理日志条目
   * @param entry 日志条目
   */
  handle(entry: LogEntry): void {
    this.entries.push(entry);
    
    // 如果超过最大条目数，移除最老的
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }
  
  /**
   * 获取所有日志条目
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }
  
  /**
   * 根据级别过滤日志条目
   * @param level 日志级别
   */
  getEntriesByLevel(level: LogLevel): LogEntry[] {
    return this.entries.filter(entry => entry.level === level);
  }
  
  /**
   * 根据标签过滤日志条目
   * @param tag 日志标签
   */
  getEntriesByTag(tag: string): LogEntry[] {
    return this.entries.filter(entry => entry.tag === tag);
  }
  
  /**
   * 清空日志
   */
  clear(): void {
    this.entries = [];
  }
}

/**
 * 远程日志处理器
 * 将日志发送到远程服务器
 */
export class RemoteLogHandler implements LogHandler {
  /** 远程服务器URL */
  private endpoint: string;
  /** 批量发送的队列 */
  private queue: LogEntry[] = [];
  /** 最大队列长度 */
  private maxQueueSize: number;
  /** 发送间隔(毫秒) */
  private flushInterval: number;
  /** 定时发送的计时器ID */
  private timerId: number | null = null;
  
  /**
   * 构造函数
   * @param endpoint 远程服务器URL
   * @param maxQueueSize 最大队列长度，默认为100
   * @param flushInterval 发送间隔(毫秒)，默认为5000
   */
  constructor(endpoint: string, maxQueueSize: number = 100, flushInterval: number = 5000) {
    this.endpoint = endpoint;
    this.maxQueueSize = maxQueueSize;
    this.flushInterval = flushInterval;
    
    // 设置定时发送
    this.startTimer();
    
    // 页面卸载前尝试发送剩余日志
    window.addEventListener('beforeunload', () => {
      this.flush();
    });
  }
  
  /**
   * 处理日志条目
   * @param entry 日志条目
   */
  handle(entry: LogEntry): void {
    // 只处理INFO以上级别的日志
    if (entry.level >= LogLevel.INFO) {
      this.queue.push(entry);
      
      // 如果队列满了，立即发送
      if (this.queue.length >= this.maxQueueSize) {
        this.flush();
      }
    }
  }
  
  /**
   * 发送队列中的日志
   */
  flush(): void {
    if (this.queue.length === 0) return;
    
    const entriesToSend = [...this.queue];
    this.queue = [];
    
    try {
      fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(entriesToSend),
        // 不等待响应，避免阻塞
        keepalive: true
      }).catch(err => {
        console.error('Failed to send logs to remote server:', err);
        // 失败时把日志放回队列，但防止无限增长
        if (this.queue.length < this.maxQueueSize) {
          this.queue = [...entriesToSend.slice(0, this.maxQueueSize - this.queue.length), ...this.queue];
        }
      });
    } catch (error) {
      console.error('Error sending logs:', error);
    }
  }
  
  /**
   * 开始定时发送
   */
  startTimer(): void {
    if (this.timerId !== null) return;
    
    this.timerId = window.setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }
  
  /**
   * 停止定时发送
   */
  stopTimer(): void {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

/**
 * 日志管理类
 * 中央日志管理器，提供统一的日志记录接口
 */
export class Logger {
  /** 单例实例 */
  private static instance: Logger;
  /** 配置管理器 */
  private config: ConfigManager;
  /** 日志处理器 */
  private handlers: LogHandler[] = [];
  /** 默认标签 */
  private defaultTag: string = 'IDScanner';
  /** 日志级别 */
  private logLevel: LogLevel = LogLevel.INFO;
  
  /**
   * 私有构造函数，防止直接实例化
   */
  private constructor() {
    this.config = ConfigManager.getInstance();
    
    // 默认添加控制台处理器
    this.addHandler(new ConsoleLogHandler());
    
    // 监听配置变化
    this.config.onConfigChange('logLevel', (level: LogLevel) => {
      this.debug('Logger', `Log level changed to ${level}`);
    });
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }
  
  /**
   * 添加日志处理器
   * @param handler 日志处理器
   */
  addHandler(handler: LogHandler): void {
    this.handlers.push(handler);
  }
  
  /**
   * 移除日志处理器
   * @param handler 要移除的处理器
   */
  removeHandler(handler: LogHandler): void {
    const index = this.handlers.indexOf(handler);
    if (index !== -1) {
      this.handlers.splice(index, 1);
    }
  }
  
  /**
   * 移除所有处理器
   */
  clearHandlers(): void {
    this.handlers = [];
  }
  
  /**
   * 设置默认标签
   * @param tag 默认标签
   */
  setDefaultTag(tag: string): void {
    this.defaultTag = tag;
  }
  
  /**
   * 记录调试级别日志
   * @param tag 标签
   * @param message 消息
   * @param error 错误
   */
  debug(tag: string, message: string, error?: Error): void {
    this.log(LogLevel.DEBUG, tag, message, error);
  }
  
  /**
   * 记录信息级别日志
   * @param tag 标签
   * @param message 消息
   * @param error 错误
   */
  info(tag: string, message: string, error?: Error): void {
    this.log(LogLevel.INFO, tag, message, error);
  }
  
  /**
   * 记录警告级别日志
   * @param tag 标签
   * @param message 消息
   * @param error 错误
   */
  warn(tag: string, message: string, error?: Error): void {
    this.log(LogLevel.WARN, tag, message, error);
  }
  
  /**
   * 记录错误级别日志
   * @param tag 标签
   * @param message 消息
   * @param error 错误
   */
  error(tag: string, message: string, error?: Error): void {
    this.log(LogLevel.ERROR, tag, message, error);
  }
  
  /**
   * 创建标记了特定标签的日志记录器
   * @param tag 标签
   */
  getTaggedLogger(tag: string): TaggedLogger {
    return new TaggedLogger(this, tag);
  }
  
  /**
   * 记录日志
   * @param level 日志级别
   * @param tag 标签
   * @param message 消息
   * @param error 错误
   */
  private log(level: LogLevel, tag: string, message: string, error?: Error): void {
    // 检查日志级别
    const levelValue = this.getLevelValue(level);
    const currentLevelValue = this.getLevelValue(this.logLevel);
    
    if (levelValue < currentLevelValue) {
      return;
    }
    
    // 创建日志条目
    const entry: LogEntry = {
      timestamp: Date.now(),
      level: level,
      tag: tag || this.defaultTag,
      message,
      error
    };
    
    // 分发到所有处理程序
    for (const handler of this.handlers) {
      try {
        handler.handle(entry);
      } catch (handlerError) {
        console.error(`[Logger] 处理程序错误:`, handlerError);
      }
    }
    
    // 如果没有处理程序，使用控制台
    if (this.handlers.length === 0) {
      this.consoleOutput(entry);
    }
  }

  /**
   * 控制台输出
   * @param entry 日志条目
   */
  private consoleOutput(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${entry.level.toUpperCase()}] [${entry.tag}]`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(`${prefix} ${entry.message}`, entry.error || '');
        break;
      case LogLevel.INFO:
        console.info(`${prefix} ${entry.message}`, entry.error || '');
        break;
      case LogLevel.WARN:
        console.warn(`${prefix} ${entry.message}`, entry.error || '');
        break;
      case LogLevel.ERROR:
        console.error(`${prefix} ${entry.message}`, entry.error || '');
        break;
    }
  }

  /**
   * 获取日志级别值
   * @param level 日志级别
   */
  private getLevelValue(level: LogLevel): number {
    switch (level) {
      case LogLevel.DEBUG:
        return 0;
      case LogLevel.INFO:
        return 1;
      case LogLevel.WARN:
        return 2;
      case LogLevel.ERROR:
        return 3;
      default:
        return 1; // 默认INFO级别
    }
  }

  /**
   * 设置日志级别
   * @param level 日志级别
   */
  public setLevel(level: LogLevel | string): void {
    if (typeof level === 'string') {
      switch (level) {
        case 'debug':
          this.logLevel = LogLevel.DEBUG;
          break;
        case 'info':
          this.logLevel = LogLevel.INFO;
          break;
        case 'warn':
          this.logLevel = LogLevel.WARN;
          break;
        case 'error':
          this.logLevel = LogLevel.ERROR;
          break;
        default:
          this.logLevel = LogLevel.INFO;
      }
    } else {
      this.logLevel = level;
    }
    
    this.debug('Logger', `日志级别已设置为 ${this.logLevel}`);
  }

  /**
   * 获取当前日志级别
   * @returns 当前日志级别
   */
  public getLevel(): LogLevel {
    return this.logLevel;
  }
}

/**
 * 带标签的日志记录器
 * 提供特定标签的简易日志接口
 */
export class TaggedLogger {
  /** 所属的主日志记录器 */
  private logger: Logger;
  /** 标签 */
  private tag: string;
  
  /**
   * 构造函数
   * @param logger 所属的主日志记录器
   * @param tag 标签
   */
  constructor(logger: Logger, tag: string) {
    this.logger = logger;
    this.tag = tag;
  }
  
  /**
   * 记录调试级别日志
   * @param message 消息
   * @param error 错误
   */
  debug(message: string, error?: Error): void {
    this.logger.debug(this.tag, message, error);
  }
  
  /**
   * 记录信息级别日志
   * @param message 消息
   * @param error 错误
   */
  info(message: string, error?: Error): void {
    this.logger.info(this.tag, message, error);
  }
  
  /**
   * 记录警告级别日志
   * @param message 消息
   * @param error 错误
   */
  warn(message: string, error?: Error): void {
    this.logger.warn(this.tag, message, error);
  }
  
  /**
   * 记录错误级别日志
   * @param message 消息
   * @param error 错误
   */
  error(message: string, error?: Error): void {
    this.logger.error(this.tag, message, error);
  }
}

/**
 * 日志级别枚举
 */
