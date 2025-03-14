/**
 * @file Web Worker辅助工具类
 * @description 提供Worker线程管理功能，用于将计算密集型任务移至后台线程
 * @module WorkerUtils
 */

/**
 * 创建Worker线程并处理消息通信
 * 
 * @param workerFunction 要在Worker中执行的函数
 * @returns 返回包含发送消息方法的Worker控制对象
 */
export function createWorker<T, R>(workerFunction: Function): {
  postMessage: (data: T) => Promise<R>;
  terminate: () => void;
} {
  // 将函数转换为字符串，然后创建一个Blob URL
  const workerCode = `
    self.onmessage = async function(e) {
      try {
        const result = await (${workerFunction.toString()})(e.data);
        self.postMessage({ success: true, result });
      } catch (error) {
        self.postMessage({ 
          success: false, 
          error: { message: error.message, stack: error.stack }
        });
      }
    }
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);
  
  // 创建一个映射来存储待解析的Promise
  const promiseMap = new Map<number, {
    resolve: (value: R) => void;
    reject: (reason: any) => void;
  }>();
  
  let messageCounter = 0;
  
  worker.onmessage = (e) => {
    // 释放Blob URL
    if (promiseMap.size === 0) {
      URL.revokeObjectURL(workerUrl);
    }
    
    const { id, success, result, error } = e.data;
    
    const promiseHandlers = promiseMap.get(id);
    if (promiseHandlers) {
      promiseMap.delete(id);
      
      if (success) {
        promiseHandlers.resolve(result);
      } else {
        const workerError = new Error(error.message);
        workerError.stack = error.stack;
        promiseHandlers.reject(workerError);
      }
    }
  };
  
  return {
    postMessage: (data: T): Promise<R> => {
      return new Promise((resolve, reject) => {
        const id = messageCounter++;
        promiseMap.set(id, { resolve, reject });
        worker.postMessage({ id, data });
      });
    },
    terminate: () => {
      worker.terminate();
      promiseMap.clear();
      URL.revokeObjectURL(workerUrl);
    }
  };
}

/**
 * 判断浏览器是否支持Web Workers
 * 
 * @returns 是否支持Web Workers
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * 工作线程池
 * 用于管理和重用Worker线程，避免频繁创建和销毁
 */
export class WorkerPool<T, R> {
  private workers: Array<{
    worker: ReturnType<typeof createWorker<T, R>>;
    busy: boolean;
  }> = [];
  
  /**
   * 创建工作线程池
   * 
   * @param workerFunction 要在Worker中执行的函数
   * @param size 池中Worker的数量
   */
  constructor(private workerFunction: Function, private size: number = navigator.hardwareConcurrency || 4) {
    // 预创建Workers
    for (let i = 0; i < size; i++) {
      this.workers.push({
        worker: createWorker<T, R>(workerFunction),
        busy: false
      });
    }
  }
  
  /**
   * 获取一个可用的Worker
   * 
   * @returns Worker包装对象
   */
  private getAvailableWorker(): ReturnType<typeof createWorker<T, R>> {
    // 找到第一个空闲的Worker
    const availableWorker = this.workers.find(w => !w.busy);
    
    if (availableWorker) {
      availableWorker.busy = true;
      return availableWorker.worker;
    }
    
    // 如果没有空闲Worker，创建一个新的
    const worker = createWorker<T, R>(this.workerFunction);
    this.workers.push({ worker, busy: true });
    return worker;
  }
  
  /**
   * 执行任务
   * 
   * @param data 要处理的数据
   * @returns 处理结果的Promise
   */
  async execute(data: T): Promise<R> {
    const worker = this.getAvailableWorker();
    
    try {
      const result = await worker.postMessage(data);
      // 标记Worker为空闲
      const workerEntry = this.workers.find(w => w.worker === worker);
      if (workerEntry) {
        workerEntry.busy = false;
      }
      return result;
    } catch (error) {
      // 出错时也标记为空闲
      const workerEntry = this.workers.find(w => w.worker === worker);
      if (workerEntry) {
        workerEntry.busy = false;
      }
      throw error;
    }
  }
  
  /**
   * 终止所有Worker
   */
  terminate(): void {
    this.workers.forEach(({ worker }) => {
      worker.terminate();
    });
    this.workers = [];
  }
} 