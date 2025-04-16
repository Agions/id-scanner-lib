/**
 * @file ID扫描识别库主入口文件
 * @description 提供身份证识别与二维码、条形码扫描功能的纯前端TypeScript库
 * @module IDScannerLib
 * @version 1.0.0
 * @license MIT
 */

import { Camera, CameraOptions } from "./utils/camera"
import { IDCardInfo, DetectionResult } from "./utils/types"
import {
  ImageProcessor,
  ImageProcessorOptions,
  ImageCompressionOptions,
} from "./utils/image-processing"

// 先只导入类型定义，不导入实际实现
import type { QRScannerOptions } from "./scanner/qr-scanner"
import type { BarcodeScannerOptions } from "./scanner/barcode-scanner"

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
  onImageProcessed?: (processedImage: ImageData | File) => void
  onError?: (error: Error) => void
}

/**
 * IDScanner 主类
 *
 * 整合二维码、条形码扫描和身份证识别功能，提供统一的接口
 * 使用动态导入实现按需加载
 */
export class IDScanner {
  private camera: Camera
  private scanMode: "qr" | "barcode" | "idcard" = "qr"
  private videoElement: HTMLVideoElement | null = null

  // 延迟加载的模块
  private qrModule: any = null
  private ocrModule: any = null

  // 模块加载状态
  private isQRModuleLoaded: boolean = false
  private isOCRModuleLoaded: boolean = false

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
      // 预加载OCR模块但不初始化
      if (!this.isOCRModuleLoaded) {
        // 动态导入OCR模块
        const OCRModule = await import("./ocr-module").then((m) => m.OCRModule)
        this.ocrModule = new OCRModule({
          cameraOptions: this.options.cameraOptions,
          onIDCardScanned: this.options.onIDCardScanned,
          onError: this.options.onError,
        })
        this.isOCRModuleLoaded = true

        // 初始化OCR模块
        await this.ocrModule.initialize()
      }

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
      // 动态加载二维码模块
      if (!this.isQRModuleLoaded) {
        const ScannerModule = await import("./qr-module").then(
          (m) => m.ScannerModule
        )
        this.qrModule = new ScannerModule({
          cameraOptions: this.options.cameraOptions,
          qrScannerOptions: this.options.qrScannerOptions,
          barcodeScannerOptions: this.options.barcodeScannerOptions,
          onQRCodeScanned: this.options.onQRCodeScanned,
          onBarcodeScanned: this.options.onBarcodeScanned,
          onError: this.options.onError,
        })
        this.isQRModuleLoaded = true
      }

      await this.qrModule.startQRScanner(videoElement)
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
      // 动态加载二维码模块
      if (!this.isQRModuleLoaded) {
        const ScannerModule = await import("./qr-module").then(
          (m) => m.ScannerModule
        )
        this.qrModule = new ScannerModule({
          cameraOptions: this.options.cameraOptions,
          qrScannerOptions: this.options.qrScannerOptions,
          barcodeScannerOptions: this.options.barcodeScannerOptions,
          onQRCodeScanned: this.options.onQRCodeScanned,
          onBarcodeScanned: this.options.onBarcodeScanned,
          onError: this.options.onError,
        })
        this.isQRModuleLoaded = true
      }

      await this.qrModule.startBarcodeScanner(videoElement)
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
      // 检查OCR模块是否已加载，若未加载则自动初始化
      if (!this.isOCRModuleLoaded) {
        await this.initialize()
      }

      await this.ocrModule.startIDCardScanner(videoElement)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 停止扫描
   */
  stop(): void {
    if (this.scanMode === "qr" || this.scanMode === "barcode") {
      if (this.qrModule) {
        this.qrModule.stop()
      }
    } else if (this.scanMode === "idcard") {
      if (this.ocrModule) {
        this.ocrModule.stop()
      }
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

    // 释放OCR资源
    if (this.isOCRModuleLoaded && this.ocrModule) {
      await this.ocrModule.terminate()
      this.ocrModule = null
      this.isOCRModuleLoaded = false
    }

    // 释放QR扫描资源
    if (this.isQRModuleLoaded && this.qrModule) {
      this.qrModule = null
      this.isQRModuleLoaded = false
    }
  }

  /**
   * 处理图片中的二维码
   * @param imageSource 图片源，可以是Image元素、Canvas元素或URL字符串
   * @returns 返回Promise，解析为扫描结果
   */
  async processQRCodeImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | string | File
  ): Promise<string> {
    try {
      // 动态加载二维码模块
      if (!this.isQRModuleLoaded) {
        const ScannerModule = await import("./qr-module").then(
          (m) => m.ScannerModule
        )
        this.qrModule = new ScannerModule({
          qrScannerOptions: this.options.qrScannerOptions,
          onQRCodeScanned: this.options.onQRCodeScanned,
          onError: this.options.onError,
        })
        this.isQRModuleLoaded = true
      }

      // 处理不同类型的图片源
      let imageElement: HTMLImageElement

      if (imageSource instanceof File) {
        // 如果是File对象，创建新的Image元素并加载图片
        imageElement = new Image()
        imageElement.crossOrigin = "anonymous" // 处理跨域图片
        const url = URL.createObjectURL(imageSource)
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = url
        })
        // 使用后释放URL对象
        URL.revokeObjectURL(url)
      } else if (typeof imageSource === "string") {
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
        // 如果是Canvas元素，创建Image并从Canvas获取数据
        imageElement = new Image()
        imageElement.src = imageSource.toDataURL()
        await new Promise((resolve) => {
          imageElement.onload = resolve
        })
      } else {
        throw new Error("不支持的图片源类型")
      }

      // 获取图像数据
      const canvas = document.createElement("canvas")
      canvas.width = imageElement.naturalWidth
      canvas.height = imageElement.naturalHeight
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("无法创建Canvas上下文")
      }

      ctx.drawImage(imageElement, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 使用QR模块处理图像
      return this.qrModule.processQRCodeImage(imageData)
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
    imageSource: HTMLImageElement | HTMLCanvasElement | string | File
  ): Promise<string> {
    try {
      // 动态加载二维码模块
      if (!this.isQRModuleLoaded) {
        const ScannerModule = await import("./qr-module").then(
          (m) => m.ScannerModule
        )
        this.qrModule = new ScannerModule({
          barcodeScannerOptions: this.options.barcodeScannerOptions,
          onBarcodeScanned: this.options.onBarcodeScanned,
          onError: this.options.onError,
        })
        this.isQRModuleLoaded = true
      }

      // 处理不同类型的图片源
      let imageElement: HTMLImageElement

      if (imageSource instanceof File) {
        // 如果是File对象，创建新的Image元素并加载图片
        imageElement = new Image()
        imageElement.crossOrigin = "anonymous" // 处理跨域图片
        const url = URL.createObjectURL(imageSource)
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = url
        })
        // 使用后释放URL对象
        URL.revokeObjectURL(url)
      } else if (typeof imageSource === "string") {
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
        // 如果是Canvas元素，创建Image并从Canvas获取数据
        imageElement = new Image()
        imageElement.src = imageSource.toDataURL()
        await new Promise((resolve) => {
          imageElement.onload = resolve
        })
      } else {
        throw new Error("不支持的图片源类型")
      }

      // 获取图像数据
      const canvas = document.createElement("canvas")
      canvas.width = imageElement.naturalWidth
      canvas.height = imageElement.naturalHeight
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("无法创建Canvas上下文")
      }

      ctx.drawImage(imageElement, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 使用Barcode模块处理图像
      return this.qrModule.processBarcodeImage(imageData)
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
    imageSource: HTMLImageElement | HTMLCanvasElement | string | File
  ): Promise<IDCardInfo> {
    try {
      // 检查OCR模块是否已加载，若未加载则自动初始化
      if (!this.isOCRModuleLoaded) {
        await this.initialize()
      }

      // 处理不同类型的图片源
      let imageElement: HTMLImageElement

      if (imageSource instanceof File) {
        // 如果是File对象，先进行压缩
        const compressedFile = await ImageProcessor.compressImage(imageSource, {
          maxSizeMB: 2, // 最大2MB
          maxWidthOrHeight: 1800, // 最大尺寸
          useWebWorker: true,
        })

        // 创建新的Image元素并加载图片
        imageElement = new Image()
        imageElement.crossOrigin = "anonymous" // 处理跨域图片
        const url = URL.createObjectURL(compressedFile)
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = url
        })
        // 使用后释放URL对象
        URL.revokeObjectURL(url)
      } else if (typeof imageSource === "string") {
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
        // 如果是Canvas元素，创建Image并从Canvas获取数据
        imageElement = new Image()
        imageElement.src = imageSource.toDataURL()
        await new Promise((resolve) => {
          imageElement.onload = resolve
        })
      } else {
        throw new Error("不支持的图片源类型")
      }

      // 获取图像数据
      const canvas = document.createElement("canvas")
      canvas.width = imageElement.naturalWidth
      canvas.height = imageElement.naturalHeight
      const ctx = canvas.getContext("2d")

      if (!ctx) {
        throw new Error("无法创建Canvas上下文")
      }

      ctx.drawImage(imageElement, 0, 0)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      // 对图像进行预处理，提高识别率
      const enhancedImageData = ImageProcessor.batchProcess(imageData, {
        brightness: 10,
        contrast: 15,
        sharpen: true,
      })

      // 使用OCR模块处理图像
      return this.ocrModule.processIDCard(enhancedImageData)
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 批量处理图像
   * @param imageSource 图片源，可以是Image元素、Canvas元素、URL字符串或File对象
   * @param options 图像处理选项
   * @param outputFormat 输出格式，'imagedata'或'file'
   * @returns 返回Promise，解析为处理后的ImageData或File
   */
  async processImage(
    imageSource: HTMLImageElement | HTMLCanvasElement | string | File,
    options: ImageProcessorOptions = {},
    outputFormat: "imagedata" | "file" = "imagedata"
  ): Promise<ImageData | File> {
    try {
      // 处理不同类型的图片源
      let imageData: ImageData

      if (imageSource instanceof File) {
        // 如果是File对象，先进行压缩
        const compressedFile = await ImageProcessor.compressImage(imageSource, {
          maxSizeMB: 2, // 最大2MB
          maxWidthOrHeight: 1920, // 最大尺寸
          useWebWorker: true,
        })

        // 从File创建ImageData
        imageData = await ImageProcessor.createImageDataFromFile(compressedFile)
      } else if (typeof imageSource === "string") {
        // 如果是URL字符串，创建新的Image元素并加载图片
        const imageElement = new Image()
        imageElement.crossOrigin = "anonymous" // 处理跨域图片
        await new Promise((resolve, reject) => {
          imageElement.onload = resolve
          imageElement.onerror = reject
          imageElement.src = imageSource
        })

        // 获取图像数据
        const canvas = document.createElement("canvas")
        canvas.width = imageElement.naturalWidth
        canvas.height = imageElement.naturalHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          throw new Error("无法创建Canvas上下文")
        }

        ctx.drawImage(imageElement, 0, 0)
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      } else if (imageSource instanceof HTMLImageElement) {
        // 如果是Image元素，从它创建ImageData
        const canvas = document.createElement("canvas")
        canvas.width = imageSource.naturalWidth
        canvas.height = imageSource.naturalHeight
        const ctx = canvas.getContext("2d")

        if (!ctx) {
          throw new Error("无法创建Canvas上下文")
        }

        ctx.drawImage(imageSource, 0, 0)
        imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      } else if (imageSource instanceof HTMLCanvasElement) {
        // 如果是Canvas元素，直接获取其ImageData
        const ctx = imageSource.getContext("2d")

        if (!ctx) {
          throw new Error("无法获取Canvas上下文")
        }

        imageData = ctx.getImageData(
          0,
          0,
          imageSource.width,
          imageSource.height
        )
      } else {
        throw new Error("不支持的图片源类型")
      }

      // 进行图像处理
      const processedImageData = ImageProcessor.batchProcess(imageData, options)

      // 根据需要的输出格式返回结果
      if (outputFormat === "file") {
        // 将ImageData转换为File
        const file = await ImageProcessor.imageDataToFile(
          processedImageData,
          "processed_image.jpg",
          "image/jpeg",
          0.85
        )

        // 触发回调
        if (this.options.onImageProcessed) {
          this.options.onImageProcessed(file)
        }

        return file
      } else {
        // 触发回调
        if (this.options.onImageProcessed) {
          this.options.onImageProcessed(processedImageData)
        }

        return processedImageData
      }
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }

  /**
   * 压缩图片
   * @param file 要压缩的图片文件
   * @param options 压缩选项
   * @returns 返回Promise，解析为压缩后的文件
   */
  async compressImage(
    file: File,
    options?: ImageCompressionOptions
  ): Promise<File> {
    try {
      return await ImageProcessor.compressImage(file, options)
    } catch (error) {
      this.handleError(error as Error)
      throw error
    }
  }
}

// 导出工具类和类型
export { Camera, CameraOptions } from "./utils/camera"
export {
  ImageProcessor,
  ImageProcessorOptions,
  ImageCompressionOptions,
} from "./utils/image-processing"
export { IDCardInfo, DetectionResult } from "./utils/types"

// 为了向后兼容，我们创建一个演示类
export class IDScannerDemo {
  private scanner: IDScanner
  private currentMode: "qr" | "idcard" = "qr"
  private videoElement: HTMLVideoElement
  private resultElement: HTMLElement

  /**
   * 创建演示类实例
   * @param videoElementId 视频元素ID
   * @param resultElementId 结果显示元素ID
   * @param switchButtonId 切换按钮ID
   * @param imageInputId 图片输入元素ID
   */
  constructor(
    videoElementId: string,
    resultElementId: string,
    switchButtonId?: string,
    imageInputId?: string
  ) {
    this.videoElement = document.getElementById(
      videoElementId
    ) as HTMLVideoElement
    this.resultElement = document.getElementById(resultElementId) as HTMLElement

    // 创建扫描器实例
    this.scanner = new IDScanner({
      onQRCodeScanned: (result) => this.handleScanResult(result),
      onIDCardScanned: (info) => this.handleIDCardResult(info),
      onError: (error) => this.handleError(error),
    })

    // 设置切换按钮事件
    if (switchButtonId) {
      const switchButton = document.getElementById(switchButtonId)
      if (switchButton) {
        switchButton.addEventListener("click", () => this.toggleMode())
      }
    }

    // 设置图片输入事件
    if (imageInputId) {
      const imageInput = document.getElementById(
        imageInputId
      ) as HTMLInputElement
      if (imageInput) {
        imageInput.addEventListener("change", (e) => this.handleImageInput(e))
      }
    }
  }

  /**
   * 初始化扫描器
   */
  async initialize(): Promise<void> {
    try {
      // 初始化身份证识别引擎
      await this.scanner.initialize()

      // 默认启动二维码扫描
      await this.startQRMode()
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 切换扫描模式
   */
  async toggleMode(): Promise<void> {
    try {
      this.scanner.stop()

      if (this.currentMode === "qr") {
        this.currentMode = "idcard"
        await this.startIDCardMode()
      } else {
        this.currentMode = "qr"
        await this.startQRMode()
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 启动二维码扫描模式
   */
  private async startQRMode(): Promise<void> {
    try {
      this.updateResultDisplay("等待扫描二维码...")
      await this.scanner.startQRScanner(this.videoElement)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 启动身份证扫描模式
   */
  private async startIDCardMode(): Promise<void> {
    try {
      this.updateResultDisplay("等待扫描身份证...")
      await this.scanner.startIDCardScanner(this.videoElement)
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 处理图片输入
   */
  private async handleImageInput(event: Event): Promise<void> {
    try {
      const input = event.target as HTMLInputElement

      if (!input.files || input.files.length === 0) {
        return
      }

      const file = input.files[0]
      this.updateResultDisplay("正在处理图片...")

      // 根据当前模式处理图片
      if (this.currentMode === "qr") {
        const result = await this.scanner.processQRCodeImage(file)
        this.handleScanResult(result)
      } else {
        const info = await this.scanner.processIDCardImage(file)
        this.handleIDCardResult(info)
      }
    } catch (error) {
      this.handleError(error as Error)
    }
  }

  /**
   * 处理扫描结果
   */
  private handleScanResult(result: string): void {
    this.updateResultDisplay(`
      <h3>扫描结果:</h3>
      <p>${result}</p>
    `)
  }

  /**
   * 处理身份证识别结果
   */
  private handleIDCardResult(info: IDCardInfo): void {
    // 格式化显示身份证信息
    const infoHtml = Object.entries(info)
      .filter(([key, value]) => value) // 过滤掉空值
      .map(([key, value]) => {
        // 转换键名为中文显示
        const keyMap: { [key: string]: string } = {
          name: "姓名",
          gender: "性别",
          nationality: "民族",
          birthDate: "出生日期",
          address: "地址",
          idNumber: "身份证号",
          issuingAuthority: "签发机关",
          validPeriod: "有效期限",
        }

        const displayKey = keyMap[key] || key
        return `<div><strong>${displayKey}:</strong> ${value}</div>`
      })
      .join("")

    this.updateResultDisplay(`
      <h3>身份证信息:</h3>
      ${infoHtml}
    `)
  }

  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    console.error("识别错误:", error)
    this.updateResultDisplay(`
      <div class="error">
        <h3>错误:</h3>
        <p>${error.message}</p>
      </div>
    `)
  }

  /**
   * 更新结果显示
   */
  private updateResultDisplay(html: string): void {
    if (this.resultElement) {
      this.resultElement.innerHTML = html
    }
  }

  /**
   * 停止扫描
   */
  stop(): void {
    this.scanner.stop()
  }
}
