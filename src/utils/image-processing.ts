/**
 * @file 图像处理工具类
 * @description 提供图像预处理功能，用于提高OCR识别率
 * @module ImageProcessor
 * @version 1.3.2
 */

import imageCompression from "browser-image-compression"
import { Point, Rect, ImageProcessingOptions } from './types';

/**
 * 图像处理器配置选项
 */
export interface ImageProcessorOptions {
  brightness?: number // 亮度调整，范围 -100 到 100
  contrast?: number // 对比度调整，范围 -100 到 100
  grayscale?: boolean // 是否转换为灰度图
  invert?: boolean // 是否反转颜色
  blur?: number // 模糊程度 (0-10)
  sharpen?: boolean // 是否锐化
}

/**
 * 图像压缩选项
 */
export interface ImageCompressionOptions {
  maxSizeMB?: number // 图片最大大小，MB
  maxWidthOrHeight?: number // 图片最大宽度或高度
  useWebWorker?: boolean // 是否使用Web Worker处理
  maxIteration?: number // 最大压缩迭代次数
  quality?: number // 输出质量 (0-1)
  fileType?: string // 输出文件类型 ('image/jpeg', 'image/png' 等)
}

/**
 * 图像处理工具类
 *
 * 提供各种图像处理功能，用于优化识别效果
 */
export class ImageProcessor {
  /**
   * 将ImageData转换为Canvas元素
   *
   * @param {ImageData} imageData - 要转换的图像数据
   * @returns {HTMLCanvasElement} 包含图像的Canvas元素
   */
  static imageDataToCanvas(imageData: ImageData): HTMLCanvasElement {
    const canvas = document.createElement("canvas")
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext("2d")

    if (ctx) {
      ctx.putImageData(imageData, 0, 0)
    }

    return canvas
  }

  /**
   * 将Canvas转换为ImageData
   *
   * @param {HTMLCanvasElement} canvas - 要转换的Canvas元素
   * @returns {ImageData|null} Canvas的图像数据，如果获取失败则返回null
   */
  static canvasToImageData(canvas: HTMLCanvasElement): ImageData | null {
    const ctx = canvas.getContext("2d")
    return ctx ? ctx.getImageData(0, 0, canvas.width, canvas.height) : null
  }

  /**
   * 调整图像亮度和对比度
   *
   * @param imageData 原始图像数据
   * @param brightness 亮度调整值 (-100到100)
   * @param contrast 对比度调整值 (-100到100)
   * @returns 处理后的图像数据
   */
  static adjustBrightnessContrast(
    imageData: ImageData,
    brightness: number = 0,
    contrast: number = 0
  ): ImageData {
    // 将亮度和对比度范围限制在 -100 到 100 之间
    brightness = Math.max(-100, Math.min(100, brightness))
    contrast = Math.max(-100, Math.min(100, contrast))

    // 将范围转换为适合计算的值
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast))
    const briAdjust = (brightness / 100) * 255

    const data = imageData.data
    const length = data.length

    for (let i = 0; i < length; i += 4) {
      // 分别处理 RGB 三个通道
      for (let j = 0; j < 3; j++) {
        // 应用亮度和对比度调整公式
        const newValue = factor * (data[i + j] + briAdjust - 128) + 128
        data[i + j] = Math.max(0, Math.min(255, newValue))
      }
      // Alpha 通道保持不变
    }

    return imageData
  }

  /**
   * 将图像转换为灰度图
   *
   * @param imageData 原始图像数据
   * @returns 灰度图像数据
   */
  static toGrayscale(imageData: ImageData): ImageData {
    const data = imageData.data
    const length = data.length

    for (let i = 0; i < length; i += 4) {
      // 使用加权平均法将 RGB 转换为灰度值
      const gray = data[i] * 0.3 + data[i + 1] * 0.59 + data[i + 2] * 0.11
      data[i] = data[i + 1] = data[i + 2] = gray
    }

    return imageData
  }

  /**
   * 锐化图像
   *
   * @param imageData 原始图像数据
   * @param amount 锐化程度，默认为2
   * @returns 锐化后的图像数据
   */
  static sharpen(imageData: ImageData, amount: number = 2): ImageData {
    if (!imageData || !imageData.data) return imageData

    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    const outputData = new Uint8ClampedArray(data.length)

    // 锐化卷积核
    const kernel = [
      0,
      -amount,
      0,
      -amount,
      1 + 4 * amount,
      -amount,
      0,
      -amount,
      0,
    ]

    // 应用卷积
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const pos = (y * width + x) * 4

        // 对每个通道应用卷积
        for (let c = 0; c < 3; c++) {
          let val = 0
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const kernelPos = (ky + 1) * 3 + (kx + 1)
              const dataPos = ((y + ky) * width + (x + kx)) * 4 + c
              val += data[dataPos] * kernel[kernelPos]
            }
          }
          outputData[pos + c] = Math.max(0, Math.min(255, val))
        }
        outputData[pos + 3] = data[pos + 3] // 保持透明度不变
      }
    }

    // 处理边缘像素
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          const pos = (y * width + x) * 4
          outputData[pos] = data[pos]
          outputData[pos + 1] = data[pos + 1]
          outputData[pos + 2] = data[pos + 2]
          outputData[pos + 3] = data[pos + 3]
        }
      }
    }

    // 创建新的ImageData对象
    return new ImageData(outputData, width, height)
  }

  /**
   * 对图像应用阈值操作，增强对比度
   *
   * @param imageData 原始图像数据
   * @param threshold 阈值 (0-255)
   * @returns 处理后的图像数据
   */
  static threshold(imageData: ImageData, threshold: number = 128): ImageData {
    // 先转换为灰度图
    const grayscaleImage = this.toGrayscale(
      new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      )
    )

    const data = grayscaleImage.data
    const length = data.length

    for (let i = 0; i < length; i += 4) {
      // 二值化处理
      const value = data[i] < threshold ? 0 : 255
      data[i] = data[i + 1] = data[i + 2] = value
    }

    return grayscaleImage
  }

  /**
   * 将图像转换为黑白图像（二值化）
   *
   * @param imageData 原始图像数据
   * @returns 二值化后的图像数据
   */
  static toBinaryImage(imageData: ImageData): ImageData {
    // 先转换为灰度图
    const grayscaleImage = this.toGrayscale(
      new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      )
    )

    // 使用OTSU算法自动确定阈值
    const threshold = this.getOtsuThreshold(grayscaleImage)

    return this.threshold(grayscaleImage, threshold)
  }

  /**
   * 使用OTSU算法计算最佳阈值
   *
   * @param imageData 灰度图像数据
   * @returns 最佳阈值
   */
  private static getOtsuThreshold(imageData: ImageData): number {
    const data = imageData.data
    const histogram = new Array(256).fill(0)

    // 统计灰度直方图
    for (let i = 0; i < data.length; i += 4) {
      histogram[data[i]]++
    }

    const total = imageData.width * imageData.height
    let sum = 0

    // 计算总灰度值和
    for (let i = 0; i < 256; i++) {
      sum += i * histogram[i]
    }

    let sumB = 0
    let wB = 0
    let wF = 0
    let maxVariance = 0
    let threshold = 0

    // 遍历所有可能的阈值，找到最大类间方差
    for (let t = 0; t < 256; t++) {
      wB += histogram[t] // 背景权重
      if (wB === 0) continue

      wF = total - wB // 前景权重
      if (wF === 0) break

      sumB += t * histogram[t]

      const mB = sumB / wB // 背景平均灰度
      const mF = (sum - sumB) / wF // 前景平均灰度

      // 计算类间方差
      const variance = wB * wF * (mB - mF) * (mB - mF)

      if (variance > maxVariance) {
        maxVariance = variance
        threshold = t
      }
    }

    return threshold
  }

  /**
   * 批量应用图像处理
   *
   * @param imageData 原始图像数据
   * @param options 处理选项
   * @returns 处理后的图像数据
   */
  static batchProcess(
    imageData: ImageData,
    options: ImageProcessorOptions
  ): ImageData {
    let processedImage = new ImageData(
      new Uint8ClampedArray(imageData.data),
      imageData.width,
      imageData.height
    )

    // 应用亮度和对比度调整
    if (options.brightness !== undefined || options.contrast !== undefined) {
      processedImage = this.adjustBrightnessContrast(
        processedImage,
        options.brightness || 0,
        options.contrast || 0
      )
    }

    // 应用灰度转换
    if (options.grayscale) {
      processedImage = this.toGrayscale(processedImage)
    }

    // 应用锐化
    if (options.sharpen) {
      processedImage = this.sharpen(processedImage)
    }

    // 应用颜色反转
    if (options.invert) {
      const data = processedImage.data
      for (let i = 0; i < data.length; i += 4) {
        // 反转RGB值
        data[i] = 255 - data[i]
        data[i + 1] = 255 - data[i + 1]
        data[i + 2] = 255 - data[i + 2]
        // Alpha通道保持不变
      }
    }

    return processedImage
  }

  /**
   * 压缩图片文件
   *
   * @param file 图片文件
   * @param options 压缩选项
   * @returns Promise<File> 压缩后的文件
   */
  static async compressImage(
    file: File,
    options?: ImageCompressionOptions
  ): Promise<File> {
    const defaultOptions = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      quality: 0.8,
      fileType: file.type || "image/jpeg",
    }

    const compressOptions = { ...defaultOptions, ...options }

    try {
      return await imageCompression(file, compressOptions)
    } catch (error) {
      console.error("图片压缩失败:", error)
      return file // 如果压缩失败，返回原始文件
    }
  }

  /**
   * 从图片文件创建ImageData
   *
   * @param file 图片文件
   * @returns Promise<ImageData>
   */
  static async createImageDataFromFile(file: File): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image()
        const url = URL.createObjectURL(file)

        img.onload = () => {
          try {
            // 创建canvas元素
            const canvas = document.createElement("canvas")
            const ctx = canvas.getContext("2d")

            if (!ctx) {
              reject(new Error("无法创建2D上下文"))
              return
            }

            canvas.width = img.width
            canvas.height = img.height

            // 绘制图片到canvas
            ctx.drawImage(img, 0, 0)

            // 获取图像数据
            const imageData = ctx.getImageData(
              0,
              0,
              canvas.width,
              canvas.height
            )

            // 释放资源
            URL.revokeObjectURL(url)

            resolve(imageData)
          } catch (e) {
            reject(e)
          }
        }

        img.onerror = () => {
          URL.revokeObjectURL(url)
          reject(new Error("图片加载失败"))
        }

        img.src = url
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 将ImageData转换为File对象
   *
   * @param imageData ImageData对象
   * @param fileName 输出文件名
   * @param fileType 输出文件类型
   * @param quality 图片质量 (0-1)
   * @returns Promise<File>
   */
  static async imageDataToFile(
    imageData: ImageData,
    fileName: string = "image.jpg",
    fileType: string = "image/jpeg",
    quality: number = 0.8
  ): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas")
        canvas.width = imageData.width
        canvas.height = imageData.height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("无法创建2D上下文"))
          return
        }

        ctx.putImageData(imageData, 0, 0)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("无法创建图片Blob"))
              return
            }
            const file = new File([blob], fileName, { type: fileType })
            resolve(file)
          },
          fileType,
          quality
        )
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * 将图像调整到指定大小
   * @param image 输入图像
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @param keepAspectRatio 是否保持宽高比
   * @returns 调整后的图像
   */
  public static resizeImage(
    image: ImageData | HTMLImageElement | HTMLCanvasElement,
    maxWidth: number,
    maxHeight: number,
    keepAspectRatio: boolean = true
  ): ImageData {
    // 创建canvas元素
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }
    
    // 获取图像尺寸
    let width: number;
    let height: number;
    
    if (image instanceof ImageData) {
      width = image.width;
      height = image.height;
    } else {
      width = image.width;
      height = image.height;
    }
    
    // 计算调整后的尺寸
    let newWidth = width;
    let newHeight = height;
    
    if (keepAspectRatio) {
      if (width > height) {
        if (width > maxWidth) {
          newHeight = Math.round(height * (maxWidth / width));
          newWidth = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          newWidth = Math.round(width * (maxHeight / height));
          newHeight = maxHeight;
        }
      }
    } else {
      newWidth = Math.min(width, maxWidth);
      newHeight = Math.min(height, maxHeight);
    }
    
    // 设置canvas尺寸
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // 绘制调整后的图像
    if (image instanceof ImageData) {
      // 创建临时canvas存储ImageData
      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      
    if (!tempCtx) {
        throw new Error('无法创建临时Canvas上下文');
    }

      tempCanvas.width = image.width;
      tempCanvas.height = image.height;
      tempCtx.putImageData(image, 0, 0);
      
      // 绘制调整后的图像
      ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight);
    } else {
      ctx.drawImage(image, 0, 0, width, height, 0, 0, newWidth, newHeight);
    }

    // 返回调整后的ImageData
    return ctx.getImageData(0, 0, newWidth, newHeight);
  }
  
  /**
   * 边缘检测算法，用于识别图像中的边缘
   * 基于Sobel算子实现
   * 
   * @param imageData 原始图像数据，应已转为灰度图
   * @param threshold 边缘阈值，默认为30
   * @returns 检测到边缘的图像数据
   */
  static detectEdges(imageData: ImageData, threshold: number = 30): ImageData {
    // 确保输入图像是灰度图
    const grayscaleImage = this.toGrayscale(
      new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      )
    );
    
    const width = grayscaleImage.width;
    const height = grayscaleImage.height;
    const inputData = grayscaleImage.data;
    const outputData = new Uint8ClampedArray(inputData.length);
    
    // Sobel算子 - 水平和垂直方向
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    // 对每个像素应用Sobel算子
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        // 应用卷积
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelPos = ((y + ky) * width + (x + kx)) * 4;
            const pixelVal = inputData[pixelPos]; // 灰度值
            
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            gx += pixelVal * sobelX[kernelIdx];
            gy += pixelVal * sobelY[kernelIdx];
          }
        }
        
        // 计算梯度强度
        let magnitude = Math.sqrt(gx * gx + gy * gy);
        
        // 应用阈值
        magnitude = magnitude > threshold ? 255 : 0;
        
        // 设置输出像素
        const pos = (y * width + x) * 4;
        outputData[pos] = outputData[pos + 1] = outputData[pos + 2] = magnitude;
        outputData[pos + 3] = 255; // 透明度保持完全不透明
      }
    }
    
    // 处理边缘像素
    for (let i = 0; i < width * 4; i++) {
      // 顶部和底部行
      outputData[i] = 0;
      outputData[(height - 1) * width * 4 + i] = 0;
    }
    
    for (let i = 0; i < height; i++) {
      // 左右两侧列
      const leftPos = i * width * 4;
      const rightPos = (i * width + width - 1) * 4;
      
      for (let j = 0; j < 4; j++) {
        outputData[leftPos + j] = 0;
        outputData[rightPos + j] = 0;
      }
    }
    
    return new ImageData(outputData, width, height);
  }
  
  /**
   * 卡尼-德里奇边缘检测
   * 相比Sobel更精确的边缘检测算法
   * 
   * @param imageData 灰度图像数据
   * @param lowThreshold 低阈值
   * @param highThreshold 高阈值
   * @returns 边缘检测结果
   */
  static cannyEdgeDetection(
    imageData: ImageData, 
    lowThreshold: number = 20, 
    highThreshold: number = 50
  ): ImageData {
    const grayscaleImage = this.toGrayscale(
      new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      )
    );
    
    // 1. 高斯模糊
    const blurredImage = this.gaussianBlur(grayscaleImage, 1.5);
    
    // 2. 使用Sobel算子计算梯度
    const { gradientMagnitude, gradientDirection } = this.computeGradients(blurredImage);
    
    // 3. 非极大值抛弃
    const nonMaxSuppressed = this.nonMaxSuppression(gradientMagnitude, gradientDirection, blurredImage.width, blurredImage.height);
    
    // 4. 双阈值处理
    const thresholdResult = this.hysteresisThresholding(
      nonMaxSuppressed, 
      blurredImage.width, 
      blurredImage.height, 
      lowThreshold, 
      highThreshold
    );
    
    // 创建输出图像
    const outputData = new Uint8ClampedArray(imageData.data.length);
    
    // 将结果转换为ImageData
    for (let i = 0; i < thresholdResult.length; i++) {
      const pos = i * 4;
      const value = thresholdResult[i] ? 255 : 0;
      outputData[pos] = outputData[pos + 1] = outputData[pos + 2] = value;
      outputData[pos + 3] = 255;
    }
    
    return new ImageData(outputData, blurredImage.width, blurredImage.height);
  }
  
  /**
   * 高斯模糊
   */
  private static gaussianBlur(imageData: ImageData, sigma: number = 1.5): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const inputData = imageData.data;
    const outputData = new Uint8ClampedArray(inputData.length);
    
    // 生成高斯核
    const kernelSize = Math.max(3, Math.floor(sigma * 3) * 2 + 1);
    const halfKernel = Math.floor(kernelSize / 2);
    const kernel = this.generateGaussianKernel(kernelSize, sigma);
    
    // 应用高斯核
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        let sum = 0;
        let weightSum = 0;
        
        for (let ky = -halfKernel; ky <= halfKernel; ky++) {
          for (let kx = -halfKernel; kx <= halfKernel; kx++) {
            const pixelY = Math.min(Math.max(y + ky, 0), height - 1);
            const pixelX = Math.min(Math.max(x + kx, 0), width - 1);
            const pixelPos = (pixelY * width + pixelX) * 4;
            
            const kernelY = ky + halfKernel;
            const kernelX = kx + halfKernel;
            const weight = kernel[kernelY * kernelSize + kernelX];
            
            sum += inputData[pixelPos] * weight;
            weightSum += weight;
          }
        }
        
        const pos = (y * width + x) * 4;
        const value = Math.round(sum / weightSum);
        outputData[pos] = outputData[pos + 1] = outputData[pos + 2] = value;
        outputData[pos + 3] = 255;
      }
    }
    
    return new ImageData(outputData, width, height);
  }
  
  /**
   * 生成高斯核
   */
  private static generateGaussianKernel(size: number, sigma: number): number[] {
    const kernel = new Array(size * size);
    const center = Math.floor(size / 2);
    let sum = 0;
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const distance = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        const value = Math.exp(-(distance ** 2) / (2 * sigma ** 2));
        
        kernel[y * size + x] = value;
        sum += value;
      }
    }
    
    // 归一化
    for (let i = 0; i < kernel.length; i++) {
      kernel[i] /= sum;
    }
    
    return kernel;
  }
  
  /**
   * 计算梯度强度和方向
   */
  private static computeGradients(imageData: ImageData): { 
    gradientMagnitude: number[], 
    gradientDirection: number[] 
  } {
    const width = imageData.width;
    const height = imageData.height;
    const inputData = imageData.data;
    
    const gradientMagnitude = new Array(width * height);
    const gradientDirection = new Array(width * height);
    
    // Sobel算子
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0;
        let gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelPos = ((y + ky) * width + (x + kx)) * 4;
            const pixelVal = inputData[pixelPos];
            
            const kernelIdx = (ky + 1) * 3 + (kx + 1);
            gx += pixelVal * sobelX[kernelIdx];
            gy += pixelVal * sobelY[kernelIdx];
          }
        }
        
        const idx = y * width + x;
        gradientMagnitude[idx] = Math.sqrt(gx * gx + gy * gy);
        gradientDirection[idx] = Math.atan2(gy, gx);
      }
    }
    
    // 处理边界
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (y === 0 || y === height - 1 || x === 0 || x === width - 1) {
          const idx = y * width + x;
          gradientMagnitude[idx] = 0;
          gradientDirection[idx] = 0;
        }
      }
    }
    
    return { gradientMagnitude, gradientDirection };
  }
  
  /**
   * 非极大值抛弃
   */
  private static nonMaxSuppression(
    gradientMagnitude: number[], 
    gradientDirection: number[], 
    width: number, 
    height: number
  ): number[] {
    const result = new Array(width * height).fill(0);
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x;
        const magnitude = gradientMagnitude[idx];
        const direction = gradientDirection[idx];
        
        // 将方向转化为角度
        const degrees = (direction * 180 / Math.PI + 180) % 180;
        
        // 获取相邻像素索引
        let neighbor1Idx, neighbor2Idx;
        
        // 将方向量化为四个方向: 0°, 45°, 90°, 135°
        if ((degrees >= 0 && degrees < 22.5) || (degrees >= 157.5 && degrees <= 180)) {
          // 水平方向
          neighbor1Idx = idx - 1;
          neighbor2Idx = idx + 1;
        } else if (degrees >= 22.5 && degrees < 67.5) {
          // 45度方向
          neighbor1Idx = (y - 1) * width + (x + 1);
          neighbor2Idx = (y + 1) * width + (x - 1);
        } else if (degrees >= 67.5 && degrees < 112.5) {
          // 垂直方向
          neighbor1Idx = (y - 1) * width + x;
          neighbor2Idx = (y + 1) * width + x;
        } else {
          // 135度方向
          neighbor1Idx = (y - 1) * width + (x - 1);
          neighbor2Idx = (y + 1) * width + (x + 1);
        }
        
        // 检查当前像素是否是最大值
        if (magnitude >= gradientMagnitude[neighbor1Idx] && 
            magnitude >= gradientMagnitude[neighbor2Idx]) {
          result[idx] = magnitude;
        }
      }
    }
    
    return result;
  }
  
  /**
   * 双阈值处理
   */
  private static hysteresisThresholding(
    nonMaxSuppressed: number[], 
    width: number, 
    height: number, 
    lowThreshold: number, 
    highThreshold: number
  ): boolean[] {
    const result = new Array(width * height).fill(false);
    const visited = new Array(width * height).fill(false);
    const stack = [];
    
    // 标记强边缘点
    for (let i = 0; i < nonMaxSuppressed.length; i++) {
      if (nonMaxSuppressed[i] >= highThreshold) {
        result[i] = true;
        stack.push(i);
        visited[i] = true;
      }
    }
    
    // 使用深度优先搜索连接弱边缘
    const dx = [-1, 0, 1, -1, 1, -1, 0, 1];
    const dy = [-1, -1, -1, 0, 0, 1, 1, 1];
    
    while (stack.length > 0) {
      const currentIdx: number = stack.pop()!;
      const currentX: number = currentIdx % width;
      const currentY: number = Math.floor(currentIdx / width);
      
      // 检查88个相邻方向
      for (let i = 0; i < 8; i++) {
        const newX: number = currentX + dx[i];
        const newY: number = currentY + dy[i];
        
        if (newX >= 0 && newX < width && newY >= 0 && newY < height) {
          const newIdx: number = newY * width + newX;
          
          if (!visited[newIdx] && nonMaxSuppressed[newIdx] >= lowThreshold) {
            result[newIdx] = true;
            stack.push(newIdx);
            visited[newIdx] = true;
          }
        }
      }
    }
    
    return result;
  }
}
