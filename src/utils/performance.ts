/**
 * @file 性能优化工具
 * @description 提供性能优化相关的工具函数
 * @module utils/performance
 */

/**
 * LRU缓存实现
 */
export class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  /**
   * 构造函数
   * @param capacity 缓存容量
   */
  constructor(capacity: number = 100) {
    this.capacity = capacity;
    this.cache = new Map<K, V>();
  }

  /**
   * 获取缓存项
   * @param key 键
   * @returns 值，如果不存在则返回undefined
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    // 获取值
    const value = this.cache.get(key)!;
    
    // 删除旧位置
    this.cache.delete(key);

    // 添加到最新位置
    this.cache.set(key, value);

    return value;
  }

  /**
   * 设置缓存项
   * @param key 键
   * @param value 值
   */
  set(key: K, value: V): void {
    // 如果已存在，先删除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果缓存已满，删除最旧的项
    else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value as K);
    }

    // 添加新项
    this.cache.set(key, value);
  }
  
  /**
   * 检查键是否存在
   * @param key 键
   * @returns 是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 删除缓存项
   * @param key 键
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
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取所有键
   */
  keys(): IterableIterator<K> {
    return this.cache.keys();
  }
  
  /**
   * 获取所有值
   */
  values(): IterableIterator<V> {
    return this.cache.values();
  }
  
  /**
   * 获取所有项
   */
  entries(): IterableIterator<[K, V]> {
    return this.cache.entries();
  }
}

/**
 * 计算图像指纹
 * @param imageData 图像数据
 * @returns 图像指纹
 */
export function calculateImageFingerprint(imageData: ImageData): string {
  const { width, height, data } = imageData;
  
  // 缩小图像以加快计算速度
  const scale = Math.min(1, 32 / Math.max(width, height));
  const scaledWidth = Math.max(8, Math.floor(width * scale));
  const scaledHeight = Math.max(8, Math.floor(height * scale));
  
  // 创建缩小的图像
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建Canvas上下文');
  }
  
  // 设置canvas尺寸
  canvas.width = scaledWidth;
  canvas.height = scaledHeight;

  // 创建临时canvas存储原始ImageData
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d');

  if (!tempCtx) {
    throw new Error('无法创建临时Canvas上下文');
  }

  tempCanvas.width = width;
  tempCanvas.height = height;
  tempCtx.putImageData(imageData, 0, 0);
  
  // 绘制缩小的图像
  ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, scaledWidth, scaledHeight);
  
  // 获取缩小的图像数据
  const scaledImageData = ctx.getImageData(0, 0, scaledWidth, scaledHeight);
  
  // 计算灰度值
  const grayValues = new Uint8Array(scaledWidth * scaledHeight);

  for (let i = 0; i < scaledWidth * scaledHeight; i++) {
    const idx = i * 4;
    grayValues[i] = Math.round(
      0.299 * scaledImageData.data[idx] +
      0.587 * scaledImageData.data[idx + 1] +
      0.114 * scaledImageData.data[idx + 2]
    );
  }
  
  // 计算平均值
  let sum = 0;
  for (let i = 0; i < grayValues.length; i++) {
    sum += grayValues[i];
  }
  const avg = sum / grayValues.length;
  
  // 计算哈希值
  let hash = '';
  for (let i = 0; i < grayValues.length; i++) {
    hash += grayValues[i] >= avg ? '1' : '0';
  }
  
  return hash;
  }

/**
 * 防抖函数
 * @param func 要执行的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖处理后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const later = () => {
      timeout = null;
      func.apply(this, args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(later, wait) as unknown as number;
  };
}

/**
 * 节流函数
 * @param func 要执行的函数
 * @param limit 时间限制（毫秒）
 * @returns 节流处理后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  let lastFunc: number | null = null;
  let lastRan: number | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      if (lastFunc !== null) {
        clearTimeout(lastFunc);
      }
      
      lastFunc = window.setTimeout(() => {
        if (lastRan !== null && Date.now() - lastRan >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, limit - (lastRan !== null ? Date.now() - lastRan : 0)) as unknown as number;
    }
  };
}
