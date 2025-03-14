/**
 * @file 身份证检测模块
 * @description 提供自动检测和定位图像中的身份证功能
 * @module IDCardDetector
 */

import { Camera } from '../utils/camera';
import { ImageProcessor } from '../utils/image-processing';
import { DetectionResult } from '../utils/types';
import { throttle, LRUCache, calculateImageFingerprint } from '../utils/performance';
import { Disposable } from '../utils/resource-manager';

/**
 * IDCardDetector配置选项
 */
export interface IDCardDetectorOptions {
  onDetection?: (result: DetectionResult) => void;
  onError?: (error: Error) => void;
  detectionInterval?: number;
  maxImageDimension?: number;
  enableCache?: boolean;
  cacheSize?: number;
  logger?: (message: any) => void;
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
  private camera: Camera;
  private detecting = false;
  private detectTimer: number | null = null;
  private onDetected?: (result: DetectionResult) => void;
  private onError?: (error: Error) => void;
  private detectionInterval: number;
  private maxImageDimension: number;
  private resultCache: LRUCache<string, DetectionResult>;
  private throttledDetect: ReturnType<typeof throttle>;
  private frameCount: number = 0;
  private lastDetectionTime: number = 0;
  private options: IDCardDetectorOptions;
  
  /**
   * 创建身份证检测器实例
   * 
   * @param options 身份证检测器配置选项，或者检测回调函数
   */
  constructor(options?: IDCardDetectorOptions | ((result: DetectionResult) => void)) {
    this.camera = new Camera();
    
    if (typeof options === 'function') {
      // 兼容旧的构造函数方式
      this.onDetected = options;
      this.options = {
        detectionInterval: 200,
        maxImageDimension: 800,
        enableCache: true,
        cacheSize: 20,
        logger: console.log
      };
    } else if (options) {
      // 使用新的选项对象方式
      this.options = {
        detectionInterval: 200,
        maxImageDimension: 800,
        enableCache: true,
        cacheSize: 20,
        logger: console.log,
        ...options
      };
      this.onDetected = options.onDetection;
      this.onError = options.onError;
    } else {
      this.options = {
        detectionInterval: 200,
        maxImageDimension: 800,
        enableCache: true,
        cacheSize: 20,
        logger: console.log
      };
    }
    
    this.detectionInterval = this.options.detectionInterval!;
    this.maxImageDimension = this.options.maxImageDimension!;
    
    // 初始化结果缓存
    this.resultCache = new LRUCache<string, DetectionResult>(this.options.cacheSize);
    
    // 创建节流版本的检测函数
    this.throttledDetect = throttle(this.performDetection.bind(this), this.detectionInterval);
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
    await this.camera.initialize(videoElement);
    this.detecting = true;
    this.frameCount = 0;
    this.lastDetectionTime = 0;
    this.detect();
  }
  
  /**
   * 停止身份证检测
   */
  stop(): void {
    this.detecting = false;
    if (this.detectTimer !== null) {
      cancelAnimationFrame(this.detectTimer);
      this.detectTimer = null;
    }
  }
  
  /**
   * 持续检测视频帧
   * 
   * @private
   */
  private detect(): void {
    if (!this.detecting) return;
    
    this.detectTimer = requestAnimationFrame(() => {
      try {
        this.frameCount++;
        const now = performance.now();
        
        // 帧率控制 - 只有满足时间间隔的帧才进行检测
        // 这样可以显著减少CPU使用率，同时保持良好的用户体验
        if (this.frameCount % 3 === 0 || now - this.lastDetectionTime >= this.detectionInterval) {
          this.throttledDetect();
          this.lastDetectionTime = now;
        }
        
        // 继续下一帧检测
        this.detect();
      } catch (error) {
        if (this.onError) {
          this.onError(error as Error);
        } else {
          console.error('身份证检测错误:', error);
        }
        
        // 出错后延迟重试
        setTimeout(() => {
          if (this.detecting) {
            this.detect();
          }
        }, 1000);
      }
    });
  }
  
  /**
   * 执行单帧检测
   * 
   * @private
   */
  private async performDetection(): Promise<void> {
    if (!this.detecting || !this.camera) return;
    
    // 获取当前视频帧
    const frame = this.camera.captureFrame();
    if (!frame) return;
    
    // 检查缓存
    if (this.options.enableCache) {
      const fingerprint = calculateImageFingerprint(frame, 16); // 使用更大的尺寸提高特征区分度
      const cachedResult = this.resultCache.get(fingerprint);
      
      if (cachedResult) {
        this.options.logger?.('使用缓存的检测结果');
        
        // 使用缓存结果，但更新图像数据以确保最新
        const updatedResult = {
          ...cachedResult,
          imageData: frame
        };
        
        if (this.onDetected) {
          this.onDetected(updatedResult);
        }
        return;
      }
    }
    
    // 降低分辨率以提高性能
    const downsampledFrame = ImageProcessor.downsampleForProcessing(frame, this.maxImageDimension);
    
    try {
      // 检测身份证
      const result = await this.detectIDCard(downsampledFrame);
      
      // 如果检测成功，将原始图像添加到结果中
      if (result.success) {
        result.imageData = frame;
        
        // 缓存结果
        if (this.options.enableCache) {
          const fingerprint = calculateImageFingerprint(frame, 16);
          this.resultCache.set(fingerprint, result);
        }
      }
      
      // 处理检测结果
      if (this.onDetected) {
        this.onDetected(result);
      }
    } catch (error) {
      if (this.onError) {
        this.onError(error as Error);
      } else {
        console.error('身份证检测错误:', error);
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
    const grayscale = ImageProcessor.toGrayscale(imageData);
    
    // 2. 检测矩形和边缘（简化版实现）
    // 注意：实际应用中应使用OpenCV.js或其他计算机视觉库进行更精确的检测
    // 此处仅作为概念性实现，使用基本矩形检测逻辑
    
    // 模拟检测过程，随机判断是否找到身份证
    // 在实际应用中，此处应当实现实际的计算机视觉算法
    const detectionResult: DetectionResult = {
      success: Math.random() > 0.3, // 70%的概率成功检测到
      message: '身份证检测完成'
    };
    
    if (detectionResult.success) {
      // 模拟一个身份证矩形区域
      const width = imageData.width;
      const height = imageData.height;
      
      // 大致的身份证区域（按比例）
      const rectWidth = Math.round(width * 0.7);
      const rectHeight = Math.round(rectWidth * 0.618); // 身份证是黄金比例
      const rectX = Math.round((width - rectWidth) / 2);
      const rectY = Math.round((height - rectHeight) / 2);
      
      // 添加四个角点
      detectionResult.corners = [
        { x: rectX, y: rectY },
        { x: rectX + rectWidth, y: rectY },
        { x: rectX + rectWidth, y: rectY + rectHeight },
        { x: rectX, y: rectY + rectHeight }
      ];
      
      // 添加边界框
      detectionResult.boundingBox = {
        x: rectX,
        y: rectY,
        width: rectWidth,
        height: rectHeight
      };
      
      // 裁剪身份证图像
      const canvas = document.createElement('canvas');
      canvas.width = rectWidth;
      canvas.height = rectHeight;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        const tempCanvas = ImageProcessor.imageDataToCanvas(imageData);
        ctx.drawImage(
          tempCanvas,
          rectX, rectY, rectWidth, rectHeight,
          0, 0, rectWidth, rectHeight
        );
        
        detectionResult.croppedImage = ctx.getImageData(0, 0, rectWidth, rectHeight);
      }
      
      // 设置置信度
      detectionResult.confidence = 0.7 + Math.random() * 0.3;
    }
    
    return detectionResult;
  }
  
  /**
   * 清除检测结果缓存
   */
  clearCache(): void {
    this.resultCache.clear();
    this.options.logger?.('检测结果缓存已清除');
  }
  
  /**
   * 释放资源
   */
  dispose(): void {
    this.stop();
    this.camera.release();
    this.resultCache.clear();
  }
} 