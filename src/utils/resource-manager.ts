/**
 * @file 资源管理器
 * @description 提供资源管理和释放功能
 * @module utils/resource-manager
 */

/**
 * 可释放资源接口
 */
export interface Disposable {
  /** 释放资源 */
  dispose(): Promise<void> | void;
}

/**
 * 资源管理器类
 * 用于管理和自动释放资源
 */
export class ResourceManager {
  private resources: Disposable[] = [];
  
  /**
   * 注册资源
   * @param resource 可释放资源
   * @returns 资源本身，便于链式调用
   */
  register<T extends Disposable>(resource: T): T {
    this.resources.push(resource);
    return resource;
  }
  
  /**
   * 释放指定资源
   * @param resource 要释放的资源
   * @returns 是否成功释放
   */
  async release(resource: Disposable): Promise<boolean> {
    const index = this.resources.indexOf(resource);
    if (index !== -1) {
      try {
        await resource.dispose();
        this.resources.splice(index, 1);
      return true;
    } catch (error) {
        console.error('释放资源失败:', error);
      return false;
      }
    }
    return false;
  }
  
  /**
   * 释放所有资源
   */
  async releaseAll(): Promise<void> {
    const promises: Promise<void>[] = [];
    
    for (const resource of this.resources) {
      try {
        const result = resource.dispose();
        if (result instanceof Promise) {
          promises.push(result);
        }
      } catch (error) {
        console.error('释放资源失败:', error);
      }
    }
    
    await Promise.all(promises);
    this.resources = [];
  }
  
  /**
   * 获取当前管理的资源数量
   */
  get count(): number {
    return this.resources.length;
    }
  }
  
  /**
 * 创建一个自动释放的资源
 * @param factory 资源工厂函数
 * @param disposeCallback 释放回调函数
 * @returns 创建的资源
 */
export function createDisposable<T>(
  factory: () => T,
  disposeCallback: (resource: T) => Promise<void> | void
): T & Disposable {
  const resource = factory();
  
  // 添加dispose方法
  (resource as any).dispose = async () => {
    await disposeCallback(resource);
  };
  
  return resource as T & Disposable;
}

/**
 * 使用资源并自动释放
 * @param resource 可释放资源
 * @param callback 使用资源的回调函数
 * @returns 回调函数的返回值
 */
export async function using<T extends Disposable, R>(
  resource: T,
  callback: (resource: T) => Promise<R> | R
): Promise<R> {
  try {
    const result = await callback(resource);
    return result;
  } finally {
    await resource.dispose();
  }
} 