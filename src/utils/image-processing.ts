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
} 