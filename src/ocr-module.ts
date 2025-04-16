/**
 * @file OCR模块入口文件
 * @description 包含身份证OCR识别相关功能
 * @module IDScannerOCR
 * @version 1.0.0
 * @license MIT
 */

import { Camera, CameraOptions } from "./utils/camera"
import { ImageProcessor } from "./utils/image-processing"
import { IDCardInfo, DetectionResult } from "./utils/types"
import {
  IDCardDetector,
  IDCardDetectorOptions,
} from "./id-recognition/id-detector"
import { OCRProcessor } from "./id-recognition/ocr-processor"
import { DataExtractor } from "./id-recognition/data-extractor"

/**
 * OCR模块配置选项
 */
export interface OCRModuleOptions {
  cameraOptions?: CameraOptions
  onIDCardScanned?: (info: IDCardInfo) => void
  onError?: (error: Error) => void
}

/**
 * OCR模块类
 *
 * 提供身份证检测和OCR文字识别功能
 */
export class OCRModule {
  private idDetector: IDCardDetector
  private ocrProcessor: OCRProcessor
  private dataExtractor: DataExtractor
  private camera: Camera
  private isRunning: boolean = false
  private videoElement: HTMLVideoElement | null = null

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(private options: OCRModuleOptions = {}) {
    this.camera = new Camera(options.cameraOptions)
    this.idDetector = new IDCardDetector({
      onDetection: this.handleIDDetection.bind(this),
      onError: this.handleError.bind(this),
    } as IDCardDetectorOptions)
    this.ocrProcessor = new OCRProcessor()
    this.dataExtractor = new DataExtractor()
  }

  /**
   * 初始化OCR引擎
   *
   * @returns Promise<void>
   */
  async initialize(): Promise<void> {
    try {
      await this.ocrProcessor.initialize()
      console.log("OCR engine initialized")
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 启动身份证扫描
   * @param videoElement HTML视频元素
   */
  async startIDCardScanner(videoElement: HTMLVideoElement): Promise<void> {
    if (!this.ocrProcessor) {
      throw new Error("OCR engine not initialized. Call initialize() first.")
    }

    this.videoElement = videoElement
    this.isRunning = true
    await this.camera.start(videoElement)
    this.idDetector.start(videoElement)
  }

  /**
   * 停止扫描
   */
  stop(): void {
    this.isRunning = false
    this.idDetector.stop()
    this.camera.stop()
  }

  /**
   * 处理身份证检测结果
   */
  private async handleIDDetection(result: DetectionResult): Promise<void> {
    if (!this.isRunning) return

    try {
      // 检查 imageData 是否存在
      if (!result.imageData) {
        this.handleError(new Error("无效的图像数据"))
        return
      }

      const idCardInfo = await this.ocrProcessor.processIDCard(result.imageData)
      const extractedInfo = this.dataExtractor.extractAndValidate(idCardInfo)

      if (this.options.onIDCardScanned) {
        this.options.onIDCardScanned(extractedInfo)
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    if (this.options.onError) {
      this.options.onError(error)
    } else {
      console.error("OCRModule error:", error)
    }
  }

  /**
   * 释放资源
   */
  async terminate(): Promise<void> {
    this.stop()
    await this.ocrProcessor.terminate()
  }

  /**
   * 直接处理图像数据中的身份证
   * @param imageData 要处理的图像数据
   * @returns 返回Promise，解析为身份证信息
   */
  async processIDCard(imageData: ImageData): Promise<IDCardInfo> {
    try {
      if (!this.ocrProcessor) {
        throw new Error("OCR engine not initialized. Call initialize() first.")
      }

      // 检查图像数据有效性
      if (
        !imageData ||
        !imageData.data ||
        imageData.width <= 0 ||
        imageData.height <= 0
      ) {
        throw new Error("无效的图像数据")
      }

      // 进行图像预处理，提高识别率
      const processedImage = ImageProcessor.adjustBrightnessContrast(
        imageData,
        5, // 轻微提高亮度
        10 // 适度提高对比度
      )

      // 调用OCR处理器进行文字识别
      const idCardInfo = await this.ocrProcessor.processIDCard(processedImage)
      // 提取和验证身份证信息
      const extractedInfo = this.dataExtractor.extractAndValidate(idCardInfo)

      // 如果有回调，触发回调
      if (this.options.onIDCardScanned) {
        this.options.onIDCardScanned(extractedInfo)
      }

      return extractedInfo
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }
}

// 导出相关类型和工具
export { IDCardDetector } from "./id-recognition/id-detector"
export { OCRProcessor } from "./id-recognition/ocr-processor"
export { DataExtractor } from "./id-recognition/data-extractor"
export { IDCardInfo } from "./utils/types"
