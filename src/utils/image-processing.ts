/**
 * @file 图像处理工具类
 * @description 提供图像预处理功能，用于提高OCR识别率
 * @module ImageProcessor
 */

import imageCompression from "browser-image-compression"

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
   * 调整图像大小
   *
   * @param imageData 原始图像数据
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @param maintainAspectRatio 是否保持宽高比
   * @returns ImageData 调整大小后的图像数据
   */
  static resizeImage(
    imageData: ImageData,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean = true
  ): ImageData {
    const { width, height } = imageData

    // 如果图像已经小于指定大小，则不需要调整
    if (width <= maxWidth && height <= maxHeight) {
      return imageData
    }

    let newWidth = maxWidth
    let newHeight = maxHeight

    // 计算新的尺寸，保持宽高比
    if (maintainAspectRatio) {
      const ratio = Math.min(maxWidth / width, maxHeight / height)
      newWidth = Math.floor(width * ratio)
      newHeight = Math.floor(height * ratio)
    }

    // 创建用于调整大小的Canvas
    const canvas = document.createElement("canvas")
    canvas.width = newWidth
    canvas.height = newHeight

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("无法创建2D上下文")
    }

    // 创建临时Canvas绘制原始ImageData
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = width
    tempCanvas.height = height

    const tempCtx = tempCanvas.getContext("2d")
    if (!tempCtx) {
      throw new Error("无法创建临时2D上下文")
    }

    tempCtx.putImageData(imageData, 0, 0)

    // 使用缩放平滑算法
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"

    // 绘制调整大小的图像
    ctx.drawImage(tempCanvas, 0, 0, width, height, 0, 0, newWidth, newHeight)

    // 获取新的ImageData
    return ctx.getImageData(0, 0, newWidth, newHeight)
  }
}
