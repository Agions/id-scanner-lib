/**
 * @file 图像处理工具类
 * @description 提供图像处理相关的辅助功能
 * @module ImageProcessor
 */

/**
 * 图像处理工具类
 * 
 * 提供常用的图像处理功能，如亮度和对比度调整、灰度转换、图像大小调整等。
 * 这些功能可用于增强图像质量，提高OCR和扫描的识别率。
 * 
 * @example
 * ```typescript
 * // 使用图像处理功能增强图像
 * const enhancedImage = ImageProcessor.adjustBrightnessContrast(
 *   originalImageData,
 *   15,  // 增加亮度
 *   25   // 增加对比度
 * );
 * 
 * // 转换为灰度图像
 * const grayImage = ImageProcessor.toGrayscale(originalImageData);
 * ```
 */
export class ImageProcessor {
  /**
   * 将ImageData转换为Canvas元素
   * 
   * @param {ImageData} imageData - 要转换的图像数据
   * @returns {HTMLCanvasElement} 包含图像的Canvas元素
   */
  static imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.putImageData(imageData, 0, 0);
    }
    
    return canvas;
  }
  
  /**
   * 将Canvas转换为ImageData
   * 
   * @param {HTMLCanvasElement} canvas - 要转换的Canvas元素
   * @returns {ImageData|null} Canvas的图像数据，如果获取失败则返回null
   */
  static canvasToImageData(canvas: HTMLCanvasElement): ImageData | null {
    const ctx = canvas.getContext('2d');
    return ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null;
  }
  
  /**
   * 调整图像亮度和对比度
   * 
   * @param {ImageData} imageData - 要处理的图像数据
   * @param {number} [brightness=0] - 亮度调整值，正值增加亮度，负值降低亮度，范围建议为-100到100
   * @param {number} [contrast=0] - 对比度调整值，正值增加对比度，负值降低对比度，范围建议为-100到100
   * @returns {ImageData} 处理后的图像数据
   */
  static adjustBrightnessContrast(imageData: ImageData, brightness: number = 0, contrast: number = 0): ImageData {
    const canvas = this.imageDataToCanvas(imageData);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      // 调整对比度算法
      const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      
      for (let i = 0; i < data.length; i += 4) {
        // 红色
        data[i] = this.truncate(factor * (data[i] - 128) + 128 + brightness);
        // 绿色
        data[i + 1] = this.truncate(factor * (data[i + 1] - 128) + 128 + brightness);
        // 蓝色
        data[i + 2] = this.truncate(factor * (data[i + 2] - 128) + 128 + brightness);
        // Alpha不变
      }
      
      ctx.putImageData(imgData, 0, 0);
      return imgData;
    }
    
    return imageData;
  }
  
  /**
   * 确保值在0-255范围内
   * 
   * @private
   * @param {number} value - 要截断的值
   * @returns {number} 截断后的值，范围为0-255
   */
  private static truncate(value: number): number {
    return Math.min(255, Math.max(0, value));
  }
  
  /**
   * 将彩色图像转换为灰度图像
   * 
   * 灰度转换可以简化图像，提高OCR和条形码识别的准确率
   * 
   * @param {ImageData} imageData - 要转换的彩色图像
   * @returns {ImageData} 转换后的灰度图像
   */
  static toGrayscale(imageData: ImageData): ImageData {
    const canvas = this.imageDataToCanvas(imageData);
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
        data[i] = avg;     // 红色
        data[i + 1] = avg; // 绿色
        data[i + 2] = avg; // 蓝色
        // Alpha不变
      }
      
      ctx.putImageData(imgData, 0, 0);
      return imgData;
    }
    
    return imageData;
  }
  
  /**
   * 调整图像大小
   * 
   * @param {ImageData} imageData - 原图像数据
   * @param {number} newWidth - 新宽度
   * @param {number} newHeight - 新高度
   * @returns {ImageData} 调整大小后的图像数据
   */
  static resize(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const tempCanvas = this.imageDataToCanvas(imageData);
      ctx.drawImage(tempCanvas, 0, 0, imageData.width, imageData.height, 0, 0, newWidth, newHeight);
      return ctx.getImageData(0, 0, newWidth, newHeight);
    }
    
    return imageData;
  }

  /**
   * 降低图像分辨率以提高处理速度
   * 
   * 对于OCR和图像分析，降低分辨率可以在保持识别率的同时大幅提升处理速度
   * 
   * @param {ImageData} imageData - 原图像数据
   * @param {number} [maxDimension=1000] - 目标最大尺寸（宽或高）
   * @returns {ImageData} 处理后的图像数据
   */
  static downsampleForProcessing(imageData: ImageData, maxDimension: number = 1000): ImageData {
    const { width, height } = imageData;
    
    // 如果图像尺寸已经小于或等于目标尺寸，则无需处理
    if (width <= maxDimension && height <= maxDimension) {
      return imageData;
    }
    
    // 计算缩放比例，保持宽高比
    const scale = maxDimension / Math.max(width, height);
    const newWidth = Math.round(width * scale);
    const newHeight = Math.round(height * scale);
    
    // 调整图像大小
    return this.resize(imageData, newWidth, newHeight);
  }

  /**
   * 转换图像为Base64格式，方便在Worker线程中传递
   * 
   * @param {ImageData} imageData - 原图像数据
   * @returns {string} base64编码的图像数据
   */
  static imageDataToBase64(imageData: ImageData): string {
    const canvas = this.imageDataToCanvas(imageData);
    return canvas.toDataURL('image/jpeg', 0.7); // 使用较低质量的JPEG格式减少数据量
  }

  /**
   * 从Base64字符串还原图像数据
   * 
   * @param {string} base64 - base64编码的图像数据
   * @returns {Promise<ImageData>} 还原的图像数据
   */
  static async base64ToImageData(base64: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('无法创建Canvas上下文'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        resolve(imageData);
      };
      
      img.onerror = () => {
        reject(new Error('图像加载失败'));
      };
      
      img.src = base64;
    });
  }

  /**
   * 使用Web Worker并行处理图像
   * 此方法将图像分割为多个部分，并行处理以提高性能
   * 
   * @param {ImageData} imageData - 原图像数据
   * @param {Function} processingFunction - 处理函数，接收ImageData返回ImageData
   * @param {number} [chunks=4] - 分割的块数
   * @returns {Promise<ImageData>} 处理后的图像数据
   */
  static async processImageInParallel(
    imageData: ImageData, 
    processingFunction: (imgData: ImageData) => ImageData,
    chunks: number = 4
  ): Promise<ImageData> {
    // 如果不支持Worker或图像太小，直接处理
    if (typeof Worker === 'undefined' || imageData.width * imageData.height < 100000) {
      return processingFunction(imageData);
    }
    
    // 创建结果canvas
    const resultCanvas = document.createElement('canvas');
    resultCanvas.width = imageData.width;
    resultCanvas.height = imageData.height;
    const resultCtx = resultCanvas.getContext('2d');
    
    if (!resultCtx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    // 根据图像特性确定分割方向和每块大小
    const isWide = imageData.width > imageData.height;
    const chunkSize = Math.floor((isWide ? imageData.width : imageData.height) / chunks);
    
    // 创建Worker处理每个块
    const promises = [];
    
    for (let i = 0; i < chunks; i++) {
      const chunkCanvas = document.createElement('canvas');
      const chunkCtx = chunkCanvas.getContext('2d');
      
      if (!chunkCtx) continue;
      
      let chunkImageData;
      
      if (isWide) {
        // 水平分割
        const startX = i * chunkSize;
        const width = (i === chunks - 1) ? imageData.width - startX : chunkSize;
        
        chunkCanvas.width = width;
        chunkCanvas.height = imageData.height;
        
        // 复制原图像数据到分块
        const tempCanvas = this.imageDataToCanvas(imageData);
        chunkCtx.drawImage(
          tempCanvas, 
          startX, 0, width, imageData.height,
          0, 0, width, imageData.height
        );
        
        chunkImageData = chunkCtx.getImageData(0, 0, width, imageData.height);
      } else {
        // 垂直分割
        const startY = i * chunkSize;
        const height = (i === chunks - 1) ? imageData.height - startY : chunkSize;
        
        chunkCanvas.width = imageData.width;
        chunkCanvas.height = height;
        
        // 复制原图像数据到分块
        const tempCanvas = this.imageDataToCanvas(imageData);
        chunkCtx.drawImage(
          tempCanvas, 
          0, startY, imageData.width, height,
          0, 0, imageData.width, height
        );
        
        chunkImageData = chunkCtx.getImageData(0, 0, imageData.width, height);
      }
      
      // 使用Worker处理
      const workerCode = `
        self.onmessage = function(e) {
          const imageData = e.data.imageData;
          const processingFunction = ${processingFunction.toString()};
          const result = processingFunction(imageData);
          self.postMessage({ result, index: e.data.index }, [result.data.buffer]);
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      const worker = new Worker(workerUrl);
      
      const promise = new Promise<{ result: ImageData, index: number }>((resolve) => {
        worker.onmessage = function(e) {
          resolve(e.data);
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        };
        
        // 传输数据
        worker.postMessage({ 
          imageData: chunkImageData, 
          index: i 
        }, [chunkImageData.data.buffer]);
      });
      
      promises.push(promise);
    }
    
    // 等待所有Worker完成并组合结果
    const results = await Promise.all(promises);
    
    // 按索引排序结果
    results.sort((a, b) => a.index - b.index);
    
    // 将处理后的块绘制到结果canvas
    for (let i = 0; i < results.length; i++) {
      const { result } = results[i];
      const tempCanvas = this.imageDataToCanvas(result);
      
      if (isWide) {
        const startX = i * chunkSize;
        resultCtx.drawImage(tempCanvas, startX, 0);
      } else {
        const startY = i * chunkSize;
        resultCtx.drawImage(tempCanvas, 0, startY);
      }
    }
    
    return resultCtx.getImageData(0, 0, imageData.width, imageData.height);
  }
} 