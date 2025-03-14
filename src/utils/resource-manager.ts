/**
 * @file 资源管理器
 * @description 提供资源自动管理功能，防止内存泄漏
 * @module ResourceManager
 */

/**
 * 可释放资源接口
 */
export interface Disposable {
  dispose: () => void | Promise<void>;
}

/**
 * 资源管理器
 * 
 * 用于管理和自动释放资源，防止内存泄漏
 */
export class ResourceManager {
  private resources: Map<string, Disposable> = new Map();
  private disposeTimeouts: Map<string, number> = new Map();
  private autoDisposeDelay: number;
  
  /**
   * 创建资源管理器
   * @param autoDisposeDelay 自动释放延迟时间（毫秒），默认5分钟
   */
  constructor(autoDisposeDelay: number = 5 * 60 * 1000) {
    this.autoDisposeDelay = autoDisposeDelay;
    
    // 添加页面卸载事件监听，确保在页面关闭时释放所有资源
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.disposeAll();
      });
    }
  }
  
  /**
   * 注册资源
   * 
   * @param id 资源标识符
   * @param resource 可释放资源
   * @param autoDispose 是否自动释放
   * @returns 注册的资源
   */
  register<T extends Disposable>(id: string, resource: T, autoDispose: boolean = true): T {
    // 如果已存在同ID资源，先释放它
    if (this.resources.has(id)) {
      this.dispose(id);
    }
    
    this.resources.set(id, resource);
    
    // 如果启用自动释放，设置定时器
    if (autoDispose) {
      this.resetDisposeTimeout(id);
    }
    
    return resource;
  }
  
  /**
   * 重置资源自动释放定时器
   * 
   * @param id 资源标识符
   */
  resetDisposeTimeout(id: string): void {
    // 取消现有定时器
    if (this.disposeTimeouts.has(id)) {
      window.clearTimeout(this.disposeTimeouts.get(id)!);
    }
    
    // 设置新定时器
    const timeoutId = window.setTimeout(() => {
      this.dispose(id);
    }, this.autoDisposeDelay);
    
    this.disposeTimeouts.set(id, timeoutId);
  }
  
  /**
   * 获取资源
   * 
   * @param id 资源标识符
   * @returns 资源对象或undefined
   */
  get<T extends Disposable>(id: string): T | undefined {
    const resource = this.resources.get(id) as T | undefined;
    
    // 重置自动释放定时器（仅当资源存在且有定时器时）
    if (resource && this.disposeTimeouts.has(id)) {
      this.resetDisposeTimeout(id);
    }
    
    return resource;
  }
  
  /**
   * 释放单个资源
   * 
   * @param id 资源标识符
   * @returns 是否成功释放
   */
  async dispose(id: string): Promise<boolean> {
    if (!this.resources.has(id)) {
      return false;
    }
    
    // 取消定时器
    if (this.disposeTimeouts.has(id)) {
      window.clearTimeout(this.disposeTimeouts.get(id)!);
      this.disposeTimeouts.delete(id);
    }
    
    // 释放资源
    try {
      const resource = this.resources.get(id)!;
      const result = resource.dispose();
      
      // 处理可能的Promise结果
      if (result instanceof Promise) {
        await result;
      }
      
      this.resources.delete(id);
      return true;
    } catch (error) {
      console.error(`释放资源 ${id} 时发生错误:`, error);
      // 尽管出错，仍然从管理器中移除
      this.resources.delete(id);
      return false;
    }
  }
  
  /**
   * 释放所有资源
   */
  async disposeAll(): Promise<void> {
    // 取消所有定时器
    for (const timeoutId of this.disposeTimeouts.values()) {
      window.clearTimeout(timeoutId);
    }
    this.disposeTimeouts.clear();
    
    // 并行释放所有资源
    const disposePromises = [];
    
    for (const [id, resource] of this.resources.entries()) {
      try {
        const result = resource.dispose();
        if (result instanceof Promise) {
          disposePromises.push(result);
        }
      } catch (error) {
        console.error(`释放资源 ${id} 时发生错误:`, error);
      }
    }
    
    // 等待所有异步释放完成
    if (disposePromises.length > 0) {
      await Promise.all(disposePromises);
    }
    
    this.resources.clear();
  }
  
  /**
   * 释放不活跃资源
   * 
   * @param maxAge 资源最大年龄（毫秒）
   */
  disposeInactive(maxAge: number): void {
    const now = Date.now();
    
    for (const [id, timeoutId] of this.disposeTimeouts.entries()) {
      // 计算资源年龄：自动释放延迟时间 - 剩余时间
      const remainingTime = this.getRemainingTime(timeoutId);
      const age = this.autoDisposeDelay - remainingTime;
      
      if (age > maxAge) {
        this.dispose(id);
      }
    }
  }
  
  /**
   * 获取定时器剩余时间
   * 
   * @param timeoutId 定时器ID
   * @returns 剩余时间（毫秒）
   */
  private getRemainingTime(timeoutId: number): number {
    // 注意：这是一个近似实现，因为JavaScript没有提供获取setTimeout剩余时间的API
    // 可以在实际应用中使用更精确的测量方法
    return 0; // 实际应用中应返回真实的剩余时间
  }
} 