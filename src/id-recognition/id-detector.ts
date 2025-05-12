/**
 * @file 身份证检测模块
 * @description 提供自动检测和定位图像中的身份证功能
 * @module IDCardDetector
 * @version 1.3.2
 */

import { Camera } from "../utils/camera"
import { ImageProcessor } from "../utils/image-processing"
import { DetectionResult } from "../utils/types"
import {
  throttle,
  LRUCache,
  calculateImageFingerprint,
} from "../utils/performance"
import { Disposable } from "../utils/resource-manager"

/**
 * IDCardDetector配置选项
 */
export interface IDCardDetectorOptions {
  onDetection?: (result: DetectionResult) => void
  onError?: (error: Error) => void
  detectionInterval?: number
  maxImageDimension?: number
  enableCache?: boolean
  cacheSize?: number
  logger?: (message: any) => void
}

/**
 * 身份证检测器类
 *
 * 通过图像处理和计算机视觉技术，实时检测视频流中的身份证，并提取身份证区域
 * 注意：当前实现是简化版，实际项目中建议使用OpenCV.js进行更精确的检测
 *
 * @example
 * ```typescript
 * // 创建身份证检测器
 * const detector = new IDCardDetector((result) => {
 *   if (result.success && result.croppedImage) {
 *     console.log('检测到身份证!');
 *     // 对裁剪出的身份证图像进行处理
 *     processIDCardImage(result.croppedImage);
 *   }
 * });
 *
 * // 启动检测
 * const videoElement = document.getElementById('video') as HTMLVideoElement;
 * await detector.start(videoElement);
 *
 * // 停止检测
 * detector.stop();
 * ```
 */
export class IDCardDetector implements Disposable {
  // 身份证标准宽高比（近似黄金比例）
  private static readonly ID_CARD_ASPECT_RATIO = 1.58 // 标准身份证宽高比
  private camera: Camera
  private detecting = false
  private detectTimer: number | null = null
  private onDetected?: (result: DetectionResult) => void
  private onError?: (error: Error) => void
  private detectionInterval: number
  private maxImageDimension: number
  private resultCache: LRUCache<string, DetectionResult>
  private throttledDetect: ReturnType<typeof throttle>
  private frameCount: number = 0
  private lastDetectionTime: number = 0
  private options: IDCardDetectorOptions

  /**
   * 创建身份证检测器实例
   *
   * @param options 身份证检测器配置选项，或者检测回调函数
   */
  constructor(
    options?: IDCardDetectorOptions | ((result: DetectionResult) => void)
  ) {
    this.camera = new Camera()

    if (typeof options === "function") {
      // 兼容旧的构造函数方式
      this.onDetected = options
      this.options = {
        detectionInterval: 200,
        maxImageDimension: 800,
        enableCache: true,
        cacheSize: 20,
        logger: console.log,
      }
    } else if (options) {
      // 使用新的选项对象方式
      this.options = {
        detectionInterval: 200,
        maxImageDimension: 800,
        enableCache: true,
        cacheSize: 20,
        logger: console.log,
        ...options,
      }
      this.onDetected = options.onDetection
      this.onError = options.onError
    } else {
      this.options = {
        detectionInterval: 200,
        maxImageDimension: 800,
        enableCache: true,
        cacheSize: 20,
        logger: console.log,
      }
    }

    this.detectionInterval = this.options.detectionInterval!
    this.maxImageDimension = this.options.maxImageDimension!

    // 初始化结果缓存
    this.resultCache = new LRUCache<string, DetectionResult>(
      this.options.cacheSize
    )

    // 创建节流版本的检测函数
    this.throttledDetect = throttle(
      this.performDetection.bind(this),
      this.detectionInterval
    )
  }

  /**
   * 启动身份证检测
   *
   * 初始化相机并开始连续检测视频帧中的身份证
   *
   * @param {HTMLVideoElement} videoElement - 用于显示相机画面的video元素
   * @returns {Promise<void>} 启动完成的Promise
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    await this.camera.initialize(videoElement)
    this.detecting = true
    this.frameCount = 0
    this.lastDetectionTime = 0
    this.detect()
  }

  /**
   * 停止身份证检测
   */
  stop(): void {
    this.detecting = false
    if (this.detectTimer !== null) {
      cancelAnimationFrame(this.detectTimer)
      this.detectTimer = null
    }
  }

  /**
   * 持续检测视频帧
   *
   * @private
   */
  private detect(): void {
    if (!this.detecting) return

    this.detectTimer = requestAnimationFrame(() => {
      try {
        this.frameCount++
        const now = performance.now()

        // 帧率控制 - 只有满足时间间隔的帧才进行检测
        // 这样可以显著减少CPU使用率，同时保持良好的用户体验
        if (
          this.frameCount % 3 === 0 ||
          now - this.lastDetectionTime >= this.detectionInterval
        ) {
          this.throttledDetect()
          this.lastDetectionTime = now
        }

        // 继续下一帧检测
        this.detect()
      } catch (error) {
        if (this.onError) {
          this.onError(error as Error)
        } else {
          console.error("身份证检测错误:", error)
        }

        // 出错后延迟重试
        setTimeout(() => {
          if (this.detecting) {
            this.detect()
          }
        }, 1000)
      }
    })
  }

  /**
   * 执行单帧检测
   *
   * @private
   */
  private async performDetection(): Promise<void> {
    if (!this.detecting || !this.camera) return

    // 获取当前视频帧
    const frame = this.camera.captureFrame()
    if (!frame) return

    // 检查缓存
    if (this.options.enableCache) {
      const fingerprint = calculateImageFingerprint(frame, 16) // 使用更大的尺寸提高特征区分度
      const cachedResult = this.resultCache.get(fingerprint)

      if (cachedResult) {
        this.options.logger?.("使用缓存的检测结果")

        // 使用缓存结果，但更新图像数据以确保最新
        const updatedResult = {
          ...cachedResult,
          imageData: frame,
        }

        if (this.onDetected) {
          this.onDetected(updatedResult)
        }
        return
      }
    }

    // 降低分辨率以提高性能
    const downsampledFrame = ImageProcessor.resizeImage(
      frame,
      this.maxImageDimension,
      this.maxImageDimension
    )

    try {
      // 检测身份证
      const result = await this.detectIDCard(downsampledFrame)

      // 如果检测成功，将原始图像添加到结果中
      if (result.success) {
        result.imageData = frame

        // 缓存结果
        if (this.options.enableCache) {
          const fingerprint = calculateImageFingerprint(frame, 16)
          this.resultCache.set(fingerprint, result)
        }
      }

      // 处理检测结果
      if (this.onDetected) {
        this.onDetected(result)
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error)
      } else {
        console.error("身份证检测错误:", error)
      }
    }
  }

  /**
   * 检测图像中的身份证
   *
   * @private
   * @param {ImageData} imageData - 要分析的图像数据
   * @returns {Promise<DetectionResult>} 检测结果
   */
  private async detectIDCard(imageData: ImageData): Promise<DetectionResult> {
    // 1. 图像预处理
    const grayscale = ImageProcessor.toGrayscale(imageData)
    
    // 2. 使用Sobel边缘检测算法检测边缘
    const edgeData = ImageProcessor.detectEdges(grayscale)
    
    // 3. 检测矩形和边缘
    // 使用基于边缘的矩形检测
    const rectangles = this.detectRectangles(edgeData)
    
    // 4. 评估检测结果 - 检查是否找到了合适的矩形
    const idCardRect = this.findIdCardRectangle(rectangles, imageData.width, imageData.height)
    
    const detectionResult: DetectionResult = {
      success: idCardRect !== null,
      message: idCardRect ? "身份证检测成功" : "未检测到身份证",
    }

    if (detectionResult.success && idCardRect) {
      // 使用检测到的身份证矩形区域
      const width = imageData.width
      const height = imageData.height
      
      // 使用实际检测到的身份证区域
      const rectWidth = idCardRect.width
      const rectHeight = idCardRect.height
      const rectX = idCardRect.x
      const rectY = idCardRect.y

      // 添加四个角点
      detectionResult.corners = [
        { x: rectX, y: rectY },
        { x: rectX + rectWidth, y: rectY },
        { x: rectX + rectWidth, y: rectY + rectHeight },
        { x: rectX, y: rectY + rectHeight },
      ]

      // 添加边界框
      detectionResult.boundingBox = {
        x: rectX,
        y: rectY,
        width: rectWidth,
        height: rectHeight,
      }

      // 裁剪身份证图像
      const canvas = document.createElement("canvas")
      canvas.width = rectWidth
      canvas.height = rectHeight
      const ctx = canvas.getContext("2d")

      if (ctx) {
        const tempCanvas = ImageProcessor.imageDataToCanvas(imageData)
        ctx.drawImage(
          tempCanvas,
          rectX,
          rectY,
          rectWidth,
          rectHeight,
          0,
          0,
          rectWidth,
          rectHeight
        )

        detectionResult.croppedImage = ctx.getImageData(
          0,
          0,
          rectWidth,
          rectHeight
        )
      }

      // 设置置信度 - 基于边缘强度和矩形形状评分
      detectionResult.confidence = this.calculateConfidence(idCardRect, edgeData)
    }

    return detectionResult
  }

  /**
   * 清除检测结果缓存
   */
  clearCache(): void {
    this.resultCache.clear()
    this.options.logger?.("检测结果缓存已清除")
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.stop()
    this.camera.release()
    this.resultCache.clear()
  }
  
  /**
   * 从边缘图像中检测矩形
   * @param edgeData 边缘检测后的图像数据
   * @returns 检测到的矩形数组
   */
  private detectRectangles(edgeData: ImageData): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
  }> {
    const width = edgeData.width;
    const height = edgeData.height;
    const minSize = Math.min(width, height) * 0.2; // 最小矩形尺寸
    const rectangles = [];
    
    // 使用积分图像加速边缘密度计算
    const integralImg = new Uint32Array(width * height);
    
    // 计算积分图像
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const pixel = (edgeData.data[idx * 4] > 128) ? 1 : 0; // 边缘为白色
        
        // 计算积分图
        const above = y > 0 ? integralImg[(y - 1) * width + x] : 0;
        const left = x > 0 ? integralImg[y * width + (x - 1)] : 0;
        const diagonal = (x > 0 && y > 0) ? integralImg[(y - 1) * width + (x - 1)] : 0;
        
        integralImg[idx] = pixel + above + left - diagonal;
      }
    }
    
    // 滑动窗口检测矩形
    for (let h = minSize; h < height * 0.9; h += Math.max(2, Math.floor(h * 0.05))) {
      // 计算当前高度下,按照标准身份证比例的宽度
      const w = Math.round(h * IDCardDetector.ID_CARD_ASPECT_RATIO);
      if (w > width * 0.9) continue;
      
      for (let y = 0; y < height - h; y += Math.max(2, Math.floor(h * 0.1))) {
        for (let x = 0; x < width - w; x += Math.max(2, Math.floor(w * 0.1))) {
          // 计算矩形区域内的边缘密度
          const edgeCount = this.calculateRectSum(integralImg, x, y, w, h, width);
          const avgEdgeDensity = edgeCount / (w * h);
          
          // 计算矩形边界的边缘密度
          const perimeterEdgeCount = this.calculateRectPerimeter(integralImg, x, y, w, h, width);
          const perimeterLength = 2 * (w + h);
          const perimeterDensity = perimeterEdgeCount / perimeterLength;
          
          // 矩形得分 - 边界边缘密度高且内部适中
          const rectScore = perimeterDensity * 0.7 + (0.3 - Math.abs(0.15 - avgEdgeDensity)) * 0.3;
          
          if (rectScore > 0.4) { // 阈值可根据实际项目调整
            rectangles.push({
              x, 
              y, 
              width: w, 
              height: h,
              confidence: rectScore
            });
          }
        }
      }
    }
    
    // 按得分排序
    return rectangles.sort((a, b) => b.confidence - a.confidence);
  }
  
  /**
   * 使用积分图计算矩形区域内的总和
   */
  private calculateRectSum(integral: Uint32Array, x: number, y: number, w: number, h: number, stride: number): number {
    const x2 = Math.min(x + w - 1, stride - 1);
    const y2 = Math.min(y + h - 1, integral.length / stride - 1);
    
    const topLeft = (x > 0 && y > 0) ? integral[(y - 1) * stride + (x - 1)] : 0;
    const topRight = y > 0 ? integral[(y - 1) * stride + x2] : 0;
    const bottomLeft = x > 0 ? integral[y2 * stride + (x - 1)] : 0;
    const bottomRight = integral[y2 * stride + x2];
    
    return bottomRight - topRight - bottomLeft + topLeft;
  }
  
  /**
   * 计算矩形周长上的边缘点数量
   */
  private calculateRectPerimeter(integral: Uint32Array, x: number, y: number, w: number, h: number, stride: number): number {
    // 上边缘
    const topEdgeSum = this.calculateRectSum(integral, x, y, w, 1, stride);
    // 下边缘
    const bottomEdgeSum = this.calculateRectSum(integral, x, y + h - 1, w, 1, stride);
    // 左边缘
    const leftEdgeSum = this.calculateRectSum(integral, x, y, 1, h, stride);
    // 右边缘
    const rightEdgeSum = this.calculateRectSum(integral, x + w - 1, y, 1, h, stride);
    
    return topEdgeSum + bottomEdgeSum + leftEdgeSum + rightEdgeSum;
  }
  
  /**
   * 从检测到的矩形中找出最可能是身份证的矩形
   */
  private findIdCardRectangle(rectangles: Array<{x: number; y: number; width: number; height: number; confidence: number}>, imageWidth: number, imageHeight: number): {x: number; y: number; width: number; height: number; confidence: number} | null {
    if (rectangles.length === 0) return null;
    
    // 筛选符合身份证宽高比的矩形
    const filteredRects = rectangles.filter(rect => {
      const aspectRatio = rect.width / rect.height;
      return Math.abs(aspectRatio - IDCardDetector.ID_CARD_ASPECT_RATIO) < 0.2; // 允许20%的误差
    });
    
    if (filteredRects.length === 0) return null;
    
    // 返回得分最高的矩形
    return filteredRects[0];
  }
  
  /**
   * 计算身份证检测的置信度
   */
  private calculateConfidence(rect: {x: number; y: number; width: number; height: number; confidence: number} | null, edgeData: ImageData): number {
    if (!rect) return 0;
    
    // 基本得分来自矩形检测
    let score = rect.confidence;
    
    // 额外因素：矩形大小相对于图像
    const relativeSize = (rect.width * rect.height) / (edgeData.width * edgeData.height);
    if (relativeSize > 0.1 && relativeSize < 0.7) {
      score += 0.1; // 身份证通常占据图像的合理比例
    }
    
    // 范围限制在0-1之间
    return Math.min(Math.max(score, 0), 1);
  }
}
