/**
 * @file ID扫描识别库UMD格式入口文件
 * @description 专门为UMD格式构建的入口，使用静态导入而非动态导入
 * @module IDScannerLib
 * @version 1.1.0
 * @license MIT
 */

import { Camera, CameraOptions } from "./utils/camera"
import { IDCardInfo, DetectionResult } from "./utils/types"
import type { QRScannerOptions } from "./scanner/qr-scanner"
import type { BarcodeScannerOptions } from "./scanner/barcode-scanner"

// 静态导入所有依赖
import { QRScanner } from "./scanner/qr-scanner"
import { BarcodeScanner } from "./scanner/barcode-scanner"
import {
  IDCardDetector,
  IDCardDetectorOptions,
} from "./id-recognition/id-detector"
import { OCRProcessor } from "./id-recognition/ocr-processor"
import { DataExtractor } from "./id-recognition/data-extractor"
import { ImageProcessor } from "./utils/image-processing"
// 导入IDScannerDemo
import { IDScannerDemo } from "./demo/demo"

/**
 * IDScanner配置选项接口
 */
export interface IDScannerOptions {
  cameraOptions?: CameraOptions
  qrScannerOptions?: QRScannerOptions
  barcodeScannerOptions?: BarcodeScannerOptions
  onQRCodeScanned?: (result: string) => void
  onBarcodeScanned?: (result: string) => void
  onIDCardScanned?: (info: IDCardInfo) => void
  onError?: (error: Error) => void
}

/**
 * IDScanner 主类
 * UMD版本使用静态导入实现
 */
export class IDScanner {
  private camera: Camera
  private qrScanner: QRScanner | null = null
  private barcodeScanner: BarcodeScanner | null = null
  private idDetector: IDCardDetector | null = null
  private ocrProcessor: OCRProcessor | null = null
  private dataExtractor: DataExtractor | null = null
  private scanMode: "qr" | "barcode" | "idcard" = "qr"
  private videoElement: HTMLVideoElement | null = null

  // 添加静态属性IDScannerDemo，使其能被通过IDScanner.IDScannerDemo访问
  static IDScannerDemo = IDScannerDemo

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(private options: IDScannerOptions = {}) {
    this.camera = new Camera(options.cameraOptions)
  }

  /**
   * 初始化模块
   * 根据需要初始化OCR引擎
   */
  async initialize(): Promise<void> {
    try {
      // 初始化OCR模块
      this.ocrProcessor = new OCRProcessor()
      this.dataExtractor = new DataExtractor()
      await this.ocrProcessor.initialize()

      console.log("IDScanner initialized")
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 启动二维码扫描
   * @param videoElement HTML视频元素
   */
  async startQRScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.stop()
    this.videoElement = videoElement
    this.scanMode = "qr"

    try {
      if (!this.qrScanner) {
        this.qrScanner = new QRScanner({
          ...this.options.qrScannerOptions,
          onScan: this.handleQRScan.bind(this),
        })
      }

      await this.camera.start(videoElement)
      this.qrScanner.start(videoElement)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 启动条形码扫描
   * @param videoElement HTML视频元素
   */
  async startBarcodeScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.stop()
    this.videoElement = videoElement
    this.scanMode = "barcode"

    try {
      if (!this.barcodeScanner) {
        this.barcodeScanner = new BarcodeScanner({
          ...this.options.barcodeScannerOptions,
          onScan: this.handleBarcodeScan.bind(this),
        })
      }

      await this.camera.start(videoElement)
      this.barcodeScanner.start(videoElement)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 启动身份证扫描
   * @param videoElement HTML视频元素
   */
  async startIDCardScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.stop()
    this.videoElement = videoElement
    this.scanMode = "idcard"

    try {
      if (!this.ocrProcessor) {
        await this.initialize()
      }

      if (!this.idDetector) {
        this.idDetector = new IDCardDetector({
          onDetection: this.handleIDDetection.bind(this),
          onError: this.handleError.bind(this),
        } as IDCardDetectorOptions)
      }

      await this.camera.start(videoElement)
      this.idDetector.start(videoElement)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 停止扫描
   */
  stop(): void {
    if (this.scanMode === "qr" && this.qrScanner) {
      this.qrScanner.stop()
    } else if (this.scanMode === "barcode" && this.barcodeScanner) {
      this.barcodeScanner.stop()
    } else if (this.scanMode === "idcard" && this.idDetector) {
      this.idDetector.stop()
    }

    this.camera.stop()
  }

  /**
   * 处理二维码扫描结果
   */
  private handleQRScan(result: string): void {
    if (this.options.onQRCodeScanned) {
      this.options.onQRCodeScanned(result)
    }
  }

  /**
   * 处理条形码扫描结果
   */
  private handleBarcodeScan(result: string): void {
    if (this.options.onBarcodeScanned) {
      this.options.onBarcodeScanned(result)
    }
  }

  /**
   * 处理身份证检测结果
   */
  private async handleIDDetection(result: DetectionResult): Promise<void> {
    if (!this.ocrProcessor || !this.dataExtractor) return

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
      console.error("IDScanner error:", error)
    }
  }

  /**
   * 释放资源
   */
  async terminate(): Promise<void> {
    this.stop()

    if (this.ocrProcessor) {
      await this.ocrProcessor.terminate()
      this.ocrProcessor = null
    }

    this.qrScanner = null
    this.barcodeScanner = null
    this.idDetector = null
    this.dataExtractor = null
  }

  /**
   * 处理图片中的二维码
   * @param imageSource 图片源，可以是Image元素、Canvas元素或URL字符串
   * @returns 返回Promise，解析为扫描结果
   */
  async processQRCodeImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | string
  ): Promise<string> {
    try {
      if (!this.qrScanner) {
        this.qrScanner = new QRScanner({
          ...this.options.qrScannerOptions,
          onScan: this.handleQRScan.bind(this),
        })
      }

      // 处理不同类型的图片源
      let imageElement: HTMLImageElement
      if (typeof imageSource === "string") {
        // 如果是URL字符串，创建新的Image元素并加载图片
        imageElement = new Image()
        imageElement.crossOrigin = "anonymous" // 处理跨域图片
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = imageSource
        })
      } else if (imageSource instanceof HTMLImageElement) {
        // 如果已经是Image元素，直接使用
        imageElement = imageSource
      } else if (imageSource instanceof HTMLCanvasElement) {
        // 如果是Canvas元素，创建新的Image元素并从Canvas获取数据
        const dataURL = imageSource.toDataURL()
        imageElement = new Image()
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = dataURL
        })
      } else {
        throw new Error("不支持的图片源类型")
      }

      // 创建Canvas处理图片
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("无法创建Canvas上下文")
      }

      // 设置Canvas尺寸与图片相同
      canvas.width = imageElement.naturalWidth
      canvas.height = imageElement.naturalHeight
      ctx.drawImage(imageElement, 0, 0)

      // 获取图像数据并处理
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return new Promise((resolve, reject) => {
        try {
          const result = this.qrScanner?.processImageData(imageData)
          if (result) {
            resolve(result)
          } else {
            reject(new Error("未检测到二维码"))
          }
        } catch (error) {
          reject(error)
        }
      })
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 处理图片中的条形码
   * @param imageSource 图片源，可以是Image元素、Canvas元素或URL字符串
   * @returns 返回Promise，解析为扫描结果
   */
  async processBarcodeImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | string
  ): Promise<string> {
    try {
      if (!this.barcodeScanner) {
        this.barcodeScanner = new BarcodeScanner({
          ...this.options.barcodeScannerOptions,
          onScan: this.handleBarcodeScan.bind(this),
        })
      }

      // 处理不同类型的图片源
      let imageElement: HTMLImageElement
      if (typeof imageSource === "string") {
        // 如果是URL字符串，创建新的Image元素并加载图片
        imageElement = new Image()
        imageElement.crossOrigin = "anonymous" // 处理跨域图片
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = imageSource
        })
      } else if (imageSource instanceof HTMLImageElement) {
        // 如果已经是Image元素，直接使用
        imageElement = imageSource
      } else if (imageSource instanceof HTMLCanvasElement) {
        // 如果是Canvas元素，创建新的Image元素并从Canvas获取数据
        const dataURL = imageSource.toDataURL()
        imageElement = new Image()
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = dataURL
        })
      } else {
        throw new Error("不支持的图片源类型")
      }

      // 创建Canvas处理图片
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("无法创建Canvas上下文")
      }

      // 设置Canvas尺寸与图片相同
      canvas.width = imageElement.naturalWidth
      canvas.height = imageElement.naturalHeight
      ctx.drawImage(imageElement, 0, 0)

      // 获取图像数据并处理
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      return new Promise((resolve, reject) => {
        try {
          const result = this.barcodeScanner?.processImageData(imageData)
          if (result) {
            resolve(result)
          } else {
            reject(new Error("未检测到条形码"))
          }
        } catch (error) {
          reject(error)
        }
      })
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 处理图片中的身份证
   * @param imageSource 图片源，可以是Image元素、Canvas元素或URL字符串
   * @returns 返回Promise，解析为身份证信息
   */
  async processIDCardImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | string
  ): Promise<IDCardInfo> {
    try {
      if (!this.ocrProcessor || !this.dataExtractor) {
        await this.initialize()
      }

      // 处理不同类型的图片源
      let imageElement: HTMLImageElement
      if (typeof imageSource === "string") {
        // 如果是URL字符串，创建新的Image元素并加载图片
        imageElement = new Image()
        imageElement.crossOrigin = "anonymous" // 处理跨域图片
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = imageSource
        })
      } else if (imageSource instanceof HTMLImageElement) {
        // 如果已经是Image元素，直接使用
        imageElement = imageSource
      } else if (imageSource instanceof HTMLCanvasElement) {
        // 如果是Canvas元素，创建新的Image元素并从Canvas获取数据
        const dataURL = imageSource.toDataURL()
        imageElement = new Image()
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = dataURL
        })
      } else {
        throw new Error("不支持的图片源类型")
      }

      // 创建Canvas处理图片
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        throw new Error("无法创建Canvas上下文")
      }

      // 设置Canvas尺寸与图片相同
      canvas.width = imageElement.naturalWidth
      canvas.height = imageElement.naturalHeight
      ctx.drawImage(imageElement, 0, 0)

      // 获取图像数据并处理
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 调用OCR处理器处理身份证图像
      const ocrResult = await this.ocrProcessor!.processIDCard(imageData)
      const extractedInfo = this.dataExtractor!.extractAndValidate(ocrResult)

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

// 导出核心类型
export { IDCardInfo } from "./utils/types"
export { CameraOptions } from "./utils/camera"
export {
  QRScanner,
  BarcodeScanner,
  IDCardDetector,
  OCRProcessor,
  DataExtractor,
  ImageProcessor,
}
// 导出IDScannerDemo类
export { IDScannerDemo }
