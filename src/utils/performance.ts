/**
 * @file 性能优化工具类
 * @description 提供节流、防抖、缓存等性能优化功能
 * @module PerformanceUtils
 */

/**
 * 节流函数：限制函数在一定时间内只能执行一次
 * 
 * @param fn 需要节流的函数
 * @param delay 延迟时间（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = delay - (now - lastCall);
    
    if (remaining <= 0) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      fn.apply(this, args);
    } else if (!timeoutId) {
      timeoutId = window.setTimeout(() => {
        lastCall = Date.now();
        timeoutId = null;
        fn.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 防抖函数：函数在最后一次调用后延迟指定时间执行
 * 
 * @param fn 需要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T, 
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  
  return function(this: any, ...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      fn.apply(this, args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * LRU缓存类 - 使用最近最少使用策略的缓存实现
 */
export class LRUCache<K, V> {
  private cache = new Map<K, V>();
  
  /**
   * 构造LRU缓存
   * @param maxSize 缓存最大容量
   */
  constructor(private maxSize: number = 100) {}
  
  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存值或undefined
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    
    // 获取值
    const value = this.cache.get(key)!;
    
    // 将项移至最新位置（删除后重新添加）
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }
  
  /**
   * 设置缓存项
   * @param key 缓存键
   * @param value 缓存值
   */
  set(key: K, value: V): void {
    // 如果键已存在，需要先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    
    // 如果缓存已满，移除最老的项
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    
    // 添加新项
    this.cache.set(key, value);
  }
  
  /**
   * 删除缓存项
   * @param key 缓存键
   * @returns 是否成功删除
   */
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * 获取当前缓存大小
   */
  get size(): number {
    return this.cache.size;
  }
  
  /**
   * 检查键是否存在
   * @param key 缓存键
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }
}

/**
 * 图像指纹计算函数 - 用于检测相同或相似图像
 * 
 * @param imageData 图像数据
 * @param size 指纹尺寸（默认8x8）
 * @returns 图像指纹字符串
 */
export function calculateImageFingerprint(imageData: ImageData, size: number = 8): string {
  // 1. 缩小图像到指定尺寸
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }
  
  // 创建一个临时canvas来绘制原始imageData
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = imageData.width;
  tempCanvas.height = imageData.height;
  const tempCtx = tempCanvas.getContext('2d');
  
  if (!tempCtx) {
    return '';
  }
  
  tempCtx.putImageData(imageData, 0, 0);
  
  // 缩小到目标尺寸
  ctx.drawImage(tempCanvas, 0, 0, imageData.width, imageData.height, 0, 0, size, size);
  
  // 2. 转换为灰度
  const smallImgData = ctx.getImageData(0, 0, size, size);
  const grayValues = [];
  
  for (let i = 0; i < smallImgData.data.length; i += 4) {
    const r = smallImgData.data[i];
    const g = smallImgData.data[i + 1];
    const b = smallImgData.data[i + 2];
    // 转为灰度: 0.299r + 0.587g + 0.114b
    const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    grayValues.push(gray);
  }
  
  // 3. 计算平均值
  const avg = grayValues.reduce((sum, val) => sum + val, 0) / grayValues.length;
  
  // 4. 比较每个像素与平均值，生成二进制指纹
  let fingerprint = '';
  for (const gray of grayValues) {
    fingerprint += gray >= avg ? '1' : '0';
  }
  
  return fingerprint;
} 