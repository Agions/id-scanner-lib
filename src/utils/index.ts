/**
 * @file 工具集
 * @description 提供通用工具函数
 * @module utils
 */

/**
 * 创建延迟Promise
 * @param ms 延迟毫秒数
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 节流函数
 * @param fn 要节流的函数
 * @param wait 等待时间(ms)
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let lastTime = 0;
  let lastResult: ReturnType<T>;
  
  return function(this: any, ...args: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      lastResult = fn.apply(this, args);
    }
    return lastResult;
  };
}

/**
 * 防抖函数
 * @param fn 要防抖的函数
 * @param wait 等待时间(ms)
 * @param immediate 是否立即执行
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeout: number | null = null;
  
  return function(this: any, ...args: Parameters<T>): void {
    const callNow = immediate && !timeout;
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    
    timeout = window.setTimeout(() => {
      timeout = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, wait);
    
    if (callNow) {
      fn.apply(this, args);
    }
  };
}

/**
 * 格式化字节大小
 * @param bytes 字节数
 * @param decimals 小数位数
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 生成UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 检查浏览器支持的功能
 */
export const browserCapabilities = {
  /**
   * 检查是否支持摄像头
   */
  hasCamera(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  },
  
  /**
   * 检查是否支持WebAssembly
   */
  hasWasm(): boolean {
    return typeof WebAssembly === 'object' && 
      typeof WebAssembly.compile === 'function' &&
      typeof WebAssembly.instantiate === 'function';
  },
  
  /**
   * 检查是否支持WebWorker
   */
  hasWebWorker(): boolean {
    return typeof Worker === 'function';
  },
  
  /**
   * 检查是否支持WebGL
   */
  hasWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(
        window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
    } catch (e) {
      return false;
    }
  },
  
  /**
   * 检查是否支持SharedArrayBuffer
   */
  hasSharedArrayBuffer(): boolean {
    return typeof SharedArrayBuffer === 'function';
  },
  
  /**
   * 检查是否支持特定的功能
   * @param feature 功能名称
   */
  supports(feature: string): boolean {
    switch (feature.toLowerCase()) {
      case 'camera': return this.hasCamera();
      case 'wasm': return this.hasWasm();
      case 'webworker': case 'worker': return this.hasWebWorker();
      case 'webgl': case 'gl': return this.hasWebGL();
      case 'sharedarraybuffer': case 'sab': return this.hasSharedArrayBuffer();
      default: return false;
    }
  }
};

/**
 * 数组分块
 * @param array 要分块的数组
 * @param chunkSize 每块大小
 */
export function chunk<T>(array: T[], chunkSize: number): T[][] {
  if (chunkSize < 1) throw new Error('Chunk size must be greater than 0');
  
  const result: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

/**
 * 安全解析JSON
 * @param text JSON字符串
 * @param fallback 解析失败时的默认值
 */
export function safeParseJSON<T = any>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    return fallback;
  }
}

/**
 * 限制值在指定范围内
 * @param value 要限制的值
 * @param min 最小值
 * @param max 最大值
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 等待加载图片
 * @param url 图片URL
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * 将Blob转换为Base64
 * @param blob Blob对象
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * 将Base64转换为Blob
 * @param base64 Base64字符串
 * @param contentType 内容类型
 */
export function base64ToBlob(base64: string, contentType: string = ''): Blob {
  const byteString = atob(base64.split(',')[1]);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  
  return new Blob([ab], { type: contentType });
}

/**
 * 获取媒体约束
 * @param width 宽度
 * @param height 高度
 * @param facingMode 前后置摄像头
 * @param frameRate 帧率
 */
export function getMediaConstraints(
  width: number = 1280,
  height: number = 720,
  facingMode: 'user' | 'environment' = 'environment',
  frameRate: number = 30
): MediaStreamConstraints {
  return {
    video: {
      width: { ideal: width },
      height: { ideal: height },
      facingMode: { ideal: facingMode },
      frameRate: { ideal: frameRate }
    },
    audio: false
  };
}

/**
 * 检查URL是否有效
 * @param url 要检查的URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * DOM帮助函数
 */
export const dom = {
  /**
   * 创建元素
   * @param tag 标签名
   * @param attributes 属性
   * @param children 子元素
   */
  createElement<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attributes: Record<string, any> = {},
    children: (string | Node)[] = []
  ): HTMLElementTagNameMap[K] {
    const element = document.createElement(tag);
    
    // 设置属性
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'style' && typeof value === 'object') {
        Object.assign(element.style, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        element.addEventListener(key.substring(2).toLowerCase(), value);
      } else if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // 添加子元素
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    
    return element;
  },
  
  /**
   * 查找元素
   * @param selector 选择器
   * @param parent 父元素
   */
  find<E extends Element = Element>(
    selector: string,
    parent: Document | Element = document
  ): E | null {
    return parent.querySelector<E>(selector);
  },
  
  /**
   * 查找所有元素
   * @param selector 选择器
   * @param parent 父元素
   */
  findAll<E extends Element = Element>(
    selector: string,
    parent: Document | Element = document
  ): E[] {
    return Array.from(parent.querySelectorAll<E>(selector));
  },
  
  /**
   * 添加事件监听器
   * @param element 元素
   * @param event 事件名称
   * @param handler 处理函数
   * @param options 选项
   */
  on<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => any,
    options?: AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler as EventListener, options);
  },
  
  /**
   * 移除事件监听器
   * @param element 元素
   * @param event 事件名称
   * @param handler 处理函数
   * @param options 选项
   */
  off<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    event: K,
    handler: (event: HTMLElementEventMap[K]) => any,
    options?: EventListenerOptions
  ): void {
    element.removeEventListener(event, handler as EventListener, options);
  },
  
  /**
   * 设置样式
   * @param element 元素
   * @param styles 样式对象
   */
  setStyles(
    element: HTMLElement,
    styles: Partial<CSSStyleDeclaration>
  ): void {
    Object.assign(element.style, styles);
  },
  
  /**
   * 添加类名
   * @param element 元素
   * @param classNames 类名
   */
  addClass(
    element: HTMLElement,
    ...classNames: string[]
  ): void {
    element.classList.add(...classNames);
  },
  
  /**
   * 移除类名
   * @param element 元素
   * @param classNames 类名
   */
  removeClass(
    element: HTMLElement,
    ...classNames: string[]
  ): void {
    element.classList.remove(...classNames);
  },
  
  /**
   * 判断是否包含类名
   * @param element 元素
   * @param className 类名
   */
  hasClass(
    element: HTMLElement,
    className: string
  ): boolean {
    return element.classList.contains(className);
  }
}; 