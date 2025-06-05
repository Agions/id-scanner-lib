/**
 * @file Worker工具
 * @description 提供Web Worker相关的工具函数
 * @module utils/worker
 */

/**
 * 检查是否支持Web Worker
 * @returns 是否支持Web Worker
 */
export function isWorkerSupported(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * 创建Worker
 * @param workerFunction Worker函数
 * @returns Worker实例
 */
export function createWorker<TInput, TOutput>(
  workerFunction: (input: TInput) => TOutput | Promise<TOutput>
): {
  postMessage: (input: TInput) => Promise<TOutput>;
  terminate: () => void;
} {
  // 检查是否支持Web Worker
  if (!isWorkerSupported()) {
    // 回退到主线程执行
    return {
      postMessage: async (input: TInput) => {
        return await Promise.resolve(workerFunction(input));
      },
      terminate: () => {}
    };
  }
  
  // 将函数转换为字符串
  const workerFunctionStr = workerFunction.toString();
  
  // 创建Worker脚本
  const workerScript = `
    // 定义Worker函数
    const workerFunction = ${workerFunctionStr};
    
    // 监听消息
    self.addEventListener('message', async (event) => {
      try {
        const input = event.data;
        const result = await workerFunction(input);
        self.postMessage({ success: true, result });
      } catch (error) {
        self.postMessage({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  `;
  
  // 创建Blob URL
  const blob = new Blob([workerScript], { type: 'application/javascript' });
  const url = URL.createObjectURL(blob);
  
  // 创建Worker
  const worker = new Worker(url);

  // 创建Promise映射
  const promiseMap = new Map<number, {
    resolve: (value: TOutput) => void;
    reject: (reason: any) => void;
  }>();
  
  // 消息计数器
  let messageCounter = 0;
  
  // 监听Worker消息
  worker.addEventListener('message', (event) => {
    const { messageId, success, result, error } = event.data;
    
    // 查找对应的Promise
    const promiseHandlers = promiseMap.get(messageId);
    if (promiseHandlers) {
      if (success) {
        promiseHandlers.resolve(result);
      } else {
        promiseHandlers.reject(new Error(error));
      }
      
      // 删除Promise映射
      promiseMap.delete(messageId);
    }
  });

  // 返回Worker接口
  return {
    postMessage: (input: TInput): Promise<TOutput> => {
      return new Promise<TOutput>((resolve, reject) => {
        // 生成消息ID
        const messageId = messageCounter++;
        
        // 保存Promise处理函数
        promiseMap.set(messageId, { resolve, reject });
        
        // 发送消息到Worker
        worker.postMessage({ messageId, input });
      });
    },
    terminate: () => {
      // 终止Worker
      worker.terminate();
      
      // 释放Blob URL
      URL.revokeObjectURL(url);
      
      // 拒绝所有未完成的Promise
      for (const [, { reject }] of promiseMap) {
        reject(new Error('Worker已终止'));
      }
      
      // 清空Promise映射
      promiseMap.clear();
    }
  };
}

/**
 * 工作线程池
 * 用于管理和重用Worker线程，避免频繁创建和销毁
 */
export class WorkerPool<T, R> {
  private workers: Array<{
    worker: ReturnType<typeof createWorker<T, R>>
    busy: boolean
  }> = []

  /**
   * 创建工作线程池
   *
   * @param workerFunction 要在Worker中执行的函数
   * @param size 池中Worker的数量
   */
  constructor(
    private workerFunction: (data: T) => Promise<R> | R,
    private size: number = navigator.hardwareConcurrency || 4
  ) {
    // 更精确的 workerFunction 类型
    // 预创建Workers
    for (let i = 0; i < size; i++) {
      this.workers.push({
        worker: createWorker<T, R>(workerFunction),
        busy: false,
      })
    }
  }

  /**
   * 获取一个可用的Worker
   *
   * @returns Worker包装对象
   */
  private getAvailableWorker(): ReturnType<typeof createWorker<T, R>> {
    // 找到第一个空闲的Worker
    const availableWorker = this.workers.find((w) => !w.busy)

    if (availableWorker) {
      availableWorker.busy = true
      return availableWorker.worker
    }

    // 如果没有空闲Worker，创建一个新的
    const worker = createWorker<T, R>(this.workerFunction)
    this.workers.push({ worker, busy: true })
    return worker
  }

  /**
   * 执行任务
   *
   * @param data 要处理的数据
   * @returns 处理结果的Promise
   */
  async execute(data: T): Promise<R> {
    const worker = this.getAvailableWorker()

    try {
      const result = await worker.postMessage(data)
      // 标记Worker为空闲
      const workerEntry = this.workers.find((w) => w.worker === worker)
      if (workerEntry) {
        workerEntry.busy = false
      }
      return result
    } catch (error) {
      // 出错时也标记为空闲
      const workerEntry = this.workers.find((w) => w.worker === worker)
      if (workerEntry) {
        workerEntry.busy = false
      }
      throw error
    }
  }

  /**
   * 终止所有Worker
   */
  terminate(): void {
    this.workers.forEach(({ worker }) => {
      worker.terminate()
    })
    this.workers = []
  }
}
