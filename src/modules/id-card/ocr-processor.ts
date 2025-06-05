/**
 * @file OCR处理器
 * @description 提供身份证OCR识别功能
 * @module modules/id-card/ocr-processor
 */

import { EventEmitter } from '../../core/event-emitter';
import { Logger } from '../../core/logger';
import { IDCardType, IDCardInfo } from './types';
import {
  createWorker,
  Worker as TesseractWorker,
  LoggerMessage,
  WorkerOptions,
} from "tesseract.js" // 导入 Worker 和 LoggerMessage 类型
import { ImageProcessor } from "../../utils/image-processing"
import { LRUCache, calculateImageFingerprint } from "../../utils/performance"
import {
  isWorkerSupported,
  createWorker as createCustomWorker,
} from "../../utils/worker" 
import { processOCRInWorker, OCRProcessInput } from "./ocr-worker"
import { Disposable } from "../../utils/resource-manager"

// 自定义日志函数类型，兼容字符串和LoggerMessage
type LoggerFunction = ((message: string | LoggerMessage) => void) | undefined;

/**
 * OCR处理器选项接口
 */
export interface OCRProcessorOptions {
  language?: string
  useWorker?: boolean
  maxImageDimension?: number
  timeout?: number
  brightness?: number // 新增亮度参数
  contrast?: number // 新增对比度参数
  onProgress?: (progress: number) => void
  enableCache?: boolean // 添加启用缓存选项
  cacheSize?: number // 添加缓存大小选项
  logger?: LoggerFunction // 修改为兼容字符串的日志函数类型
}

/**
 * OCR处理器类
 *
 * 使用Tesseract.js实现对身份证图像的OCR文字识别和信息提取功能
 *
 * @example
 * ```typescript
 * // 创建OCR处理器
 * const ocrProcessor = new OCRProcessor();
 *
 * // 初始化OCR引擎
 * await ocrProcessor.initialize();
 *
 * // 处理身份证图像
 * const idInfo = await ocrProcessor.processIDCard(idCardImageData);
 * console.log('识别到的身份证信息:', idInfo);
 *
 * // 使用结束后释放资源
 * await ocrProcessor.terminate();
 * ```
 */
export class OCRProcessor implements Disposable {
  private worker: TesseractWorker | null = null // 使用导入的 TesseractWorker 类型
  private ocrWorker: ReturnType<
    typeof createCustomWorker<
      OCRProcessInput,
      { idCardInfo: IDCardInfo; processingTime: number }
    >
  > | null = null
  private initialized: boolean = false
  private resultCache: LRUCache<string, IDCardInfo>
  private options: OCRProcessorOptions

  /**
   * 创建OCR处理器实例
   *
   * @param options OCR处理器选项
   */
  constructor(options: OCRProcessorOptions = {}) {
    this.options = {
      useWorker: isWorkerSupported(),
      enableCache: true,
      cacheSize: 50,
      maxImageDimension: 1000,
      logger: console.log,
      ...options,
    }

    // 初始化缓存
    this.resultCache = new LRUCache<string, IDCardInfo>(this.options.cacheSize)
  }

  /**
   * 初始化OCR引擎
   *
   * 加载Tesseract OCR引擎和中文简体语言包，并设置适合身份证识别的参数
   *
   * @returns {Promise<void>} 初始化完成的Promise
   */
  async initialize(): Promise<void> {
    if (this.initialized) return

    if (this.options.useWorker) {
      // 使用自定义Worker线程处理OCR
      this.ocrWorker = createCustomWorker<
        OCRProcessInput,
        { idCardInfo: IDCardInfo; processingTime: number }
      >(processOCRInWorker as any) // 使用类型断言解决类型不兼容问题
      this.initialized = true
      this.options.logger?.("OCR Worker 初始化完成")
    } else {
      // 使用主线程处理OCR
      this.worker = createWorker({
        logger: this.options.logger,
      })

      await this.worker.load()
      await this.worker.loadLanguage("chi_sim")
      await this.worker.initialize("chi_sim")
      await this.worker.setParameters({
        tessedit_char_whitelist:
          "0123456789X年月日壹贰叁肆伍陆柒捌玖拾民族汉满回维吾尔藏苗彝壮朝鲜侗瑶白土家哈尼哈萨克傣黎傈僳佤高山拉祜水东乡纳西景颇柯尔克孜达斡尔仫佬羌布朗撒拉毛南仡佬锡伯阿昌普米塔吉克怒乌孜别克俄罗斯鄂温克德昂保安裕固京塔塔尔独龙鄂伦春赫哲门巴珞巴基诺男女住址出生公民身份号码签发机关有效期省市区县乡镇街道号楼单元室ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", // 优化字符白名单，增加常见地址字符，移除部分不常用汉字
      })
      // 增加一些针对性的参数，提高识别率
      await this.worker.setParameters({
        tessedit_pageseg_mode: 7, // PSM_SINGLE_LINE，使用数字而不是字符串
        preserve_interword_spaces: "1", // 保留单词间的空格
      })

      this.initialized = true
      this.options.logger?.("OCR引擎初始化完成")
    }
  }

  /**
   * 处理身份证图像并提取信息
   * @param imageData 要处理的身份证图像数据
   * @returns 提取的身份证信息
   */
  async processIDCard(imageData: ImageData): Promise<IDCardInfo> {
    if (!this.initialized) {
      await this.initialize()
    }

    // 计算图像指纹，用于缓存查找
    if (this.options.enableCache) {
      const fingerprint = calculateImageFingerprint(imageData)

      // 检查缓存中是否有结果
      const cachedResult = this.resultCache.get(fingerprint)
      if (cachedResult) {
        this.options.logger?.("使用缓存的OCR结果")
        return cachedResult
      }
    }

    // 调整图像大小以提高性能和准确性
    const downsampledImage = ImageProcessor.resizeImage(
      imageData,
      this.options.maxImageDimension || 1000,
      this.options.maxImageDimension || 1000,
      true // 保持宽高比
    )

    // 提高图像质量以获得更好的OCR结果
    const enhancedImage = ImageProcessor.batchProcess(downsampledImage, {
      brightness:
        this.options.brightness !== undefined ? this.options.brightness : 10, // 调整默认亮度
      contrast:
        this.options.contrast !== undefined ? this.options.contrast : 20, // 调整默认对比度
      sharpen: true, // 默认启用锐化，通常对OCR有益
    })

    // 转换为base64供Tesseract处理
    // 创建一个canvas元素
    const canvas = document.createElement("canvas")
    canvas.width = enhancedImage.width
    canvas.height = enhancedImage.height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("无法创建canvas上下文")
    }

    // 将ImageData绘制到canvas
    ctx.putImageData(enhancedImage, 0, 0)

    // 转换为Base64
    const base64Image = canvas.toDataURL("image/jpeg", 0.7)

    // OCR识别
    try {
      let idCardInfo: IDCardInfo

      if (this.options.useWorker && this.ocrWorker) {
        // 使用Worker线程处理
        const result = await this.ocrWorker.postMessage({
          imageBase64: base64Image,
          // 不传递函数对象，避免DataCloneError
          tessWorkerOptions: {},
        })

        idCardInfo = result.idCardInfo
        this.options.logger?.(
          `OCR处理完成，用时: ${result.processingTime.toFixed(2)}ms`
        )
      } else {
        // 使用主线程处理
        const startTime = performance.now()

        // 转换ImageData为Canvas
        const canvas = ImageProcessor.imageDataToCanvas(enhancedImage)

        // 确保worker已初始化
        if (!this.worker) {
          throw new Error("OCR引擎未初始化");
        }

        const { data } = (await this.worker.recognize(canvas)) as {
          data: { text: string }
        }

        // 解析身份证信息
        idCardInfo = this.parseIDCardText(data.text)

        const processingTime = performance.now() - startTime
        this.options.logger?.(
          `OCR处理完成，用时: ${processingTime.toFixed(2)}ms`
        )
      }

      // 缓存结果
      if (this.options.enableCache) {
        const fingerprint = calculateImageFingerprint(imageData)
        this.resultCache.set(fingerprint, idCardInfo)
      }

      return idCardInfo
    } catch (error) {
      // 改进错误处理
      const errorMessage = error instanceof Error 
        ? error.message 
        : typeof error === 'object' 
          ? JSON.stringify(error) 
          : String(error);
      
      this.options.logger?.(`OCR识别错误: ${errorMessage}`);
      
      // 返回空对象，避免完全失败
      return {} as IDCardInfo
    }
  }

  /**
   * 解析身份证文本信息
   *
   * 从OCR识别到的文本中提取结构化的身份证信息
   *
   * @private
   * @param {string} text - OCR识别到的文本
   * @returns {IDCardInfo} 提取到的身份证信息对象
   */
  /**
   * 格式化日期字符串为标准格式 (YYYY-MM-DD)
   * @param dateStr 原始日期字符串
   * @returns 格式化后的日期字符串
   */
  private formatDateString(dateStr: string): string {
    // 先尝试提取年月日
    const dateMatch = dateStr.match(
      /(\d{4})[-\.\u5e74\s]*(\d{1,2})[-\.\u6708\s]*(\d{1,2})[日]*/
    )
    if (dateMatch) {
      const year = dateMatch[1]
      const month = dateMatch[2].padStart(2, "0")
      const day = dateMatch[3].padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    // 如果是纯数字格式如 20220101
    if (/^\d{8}$/.test(dateStr)) {
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)
      return `${year}-${month}-${day}`
    }

    // 如果无法格式化，返回原始字符串
    return dateStr
  }

  /**
   * 验证身份证号是否符合规则
   * @param idNumber 身份证号
   * @returns 是否有效
   */
  private validateIDNumber(idNumber: string): boolean {
    // 基本验证，校验位有效性和长度
    if (!idNumber || idNumber.length !== 18) {
      return false
    }

    // 检查格式，前17位必须为数字，最后一位可以是数字或'X'
    const pattern = /^\d{17}[\dX]$/
    if (!pattern.test(idNumber)) {
      return false
    }

    // 检查日期部分
    const year = parseInt(idNumber.substr(6, 4))
    const month = parseInt(idNumber.substr(10, 2))
    const day = parseInt(idNumber.substr(12, 2))

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return false
    }

    // 更详细的检查可以添加校验位的验证等逻辑...

    return true
  }

  private parseIDCardText(text: string): IDCardInfo {
    const info: IDCardInfo = {}

    // 预处理文本，清除多余空白
    const processedText = text.replace(/\s+/g, " ").trim()

    // 拆分为行，并过滤空行
    const lines = processedText.split("\n").filter((line) => line.trim())

    // 解析身份证号码 - 多种模式匹配
    // 1. 普通18位身份证号模式
    const idNumberRegex = /(\d{17}[\dX])/
    // 2. 带前缀的模式
    const idNumberWithPrefixRegex = /公民身份号码[\s\:]*(\d{17}[\dX])/

    // 尝试所有模式
    let idNumber = null
    const basicMatch = processedText.match(idNumberRegex)
    const prefixMatch = processedText.match(idNumberWithPrefixRegex)

    if (prefixMatch && prefixMatch[1]) {
      idNumber = prefixMatch[1] // 首选带前缀的匹配，因为最可靠
    } else if (basicMatch && basicMatch[1]) {
      idNumber = basicMatch[1] // 其次是常规匹配
    }

    if (idNumber) {
      info.idNumber = idNumber
    }

    // 解析姓名 - 使用多种策略
    // 1. 直接匹配姓名标签近的内容
    const nameWithLabelRegex = /姓名[\s\:]*([一-龥]{2,4})/
    const nameMatch = processedText.match(nameWithLabelRegex)

    // 2. 分析行文本寻找姓名
    if (nameMatch && nameMatch[1]) {
      info.name = nameMatch[1].trim()
    } else {
      // 备用方案：查找短行且内容全是汉字
      for (const line of lines) {
        if (
          line.length >= 2 &&
          line.length <= 5 &&
          /^[一-龥]+$/.test(line) &&
          !/性别|民族|住址|公民|签发|有效/.test(line)
        ) {
          info.name = line.trim()
          break
        }
      }
    }

    // 解析性别和民族 - 多种模式匹配
    // 1. 标准格式匹配
    const genderAndNationalityRegex =
      /性别[\s\:]*([男女])[\s ]*民族[\s\:]*([一-龥]+族)/
    const genderNationalityMatch = processedText.match(
      genderAndNationalityRegex
    )

    // 2. 只匹配性别
    const genderOnlyRegex = /性别[\s\:]*([男女])/
    const genderOnlyMatch = processedText.match(genderOnlyRegex)

    // 3. 只匹配民族
    const nationalityOnlyRegex = /民族[\s\:]*([一-龥]+族)/
    const nationalityOnlyMatch = processedText.match(nationalityOnlyRegex)

    if (genderNationalityMatch) {
      info.gender = genderNationalityMatch[1]
      info.nationality = genderNationalityMatch[2]
    } else {
      // 分开获取
      if (genderOnlyMatch) info.gender = genderOnlyMatch[1]
      if (nationalityOnlyMatch) info.nationality = nationalityOnlyMatch[1]
    }

    // 解析出生日期 - 支持多种格式
    // 1. 标准格式：YYYY年MM月DD日
    const birthDateRegex1 = /出生[\s\:]*(\d{4})年(\d{1,2})月(\d{1,2})[日号]/
    // 2. 美式日期格式：YYYY-MM-DD或YYYY/MM/DD
    const birthDateRegex2 = /出生[\s\:]*(\d{4})[-\/\.](\d{1,2})[-\/\.](\d{1,2})/
    // 3. 带前缀的格式
    const birthDateRegex3 =
      /出生日期[\s\:]*(\d{4})[-\/\.\u5e74](\d{1,2})[-\/\.\u6708](\d{1,2})[日号]?/

    let birthDateMatch =
      processedText.match(birthDateRegex1) ||
      processedText.match(birthDateRegex2) ||
      processedText.match(birthDateRegex3)

    // 4. 从身份证号码中提取出生日期（如果上述方法失败）
    if (!birthDateMatch && info.idNumber && info.idNumber.length === 18) {
      const year = info.idNumber.substring(6, 10)
      const month = info.idNumber.substring(10, 12)
      const day = info.idNumber.substring(12, 14)
      info.birthDate = `${year}-${month}-${day}`
    } else if (birthDateMatch) {
      // 确保月份和日期是两位数
      const year = birthDateMatch[1]
      const month = birthDateMatch[2].padStart(2, "0")
      const day = birthDateMatch[3].padStart(2, "0")
      info.birthDate = `${year}-${month}-${day}`
    }

    // 解析地址 - 改进的正则匹配
    // 1. 常规模式
    const addressRegex1 = /住址[\s\:]*([\s\S]*?)(?=公民身份|出生|性别|签发)/
    // 2. 更宽松的模式
    const addressRegex2 = /住址[\s\:]*([一-龥a-zA-Z0-9\s\.\-]+)/

    const addressMatch =
      processedText.match(addressRegex1) || processedText.match(addressRegex2)

    if (addressMatch && addressMatch[1]) {
      // 清理地址中的常见错误和多余空格
      info.address = addressMatch[1]
        .replace(/\s+/g, "")
        .replace(/\n/g, "")
        .trim()

      // 限制地址长度并判断地址合理性
      if (info.address.length > 70) {
        info.address = info.address.substring(0, 70)
      }

      // 确保地址是合理的（不仅仅包含符号或数字）
      if (!/[一-龥]/.test(info.address)) {
        info.address = "" // 如果没有中文字符，可能不是有效地址
      }
    }

    // 解析签发机关
    const authorityRegex1 =
      /签发机关[\s\:]*([\s\S]*?)(?=有效|公民|出生|\d{8}|$)/
    const authorityRegex2 = /签发机关[\s\:]*([一-龥\s]+)/

    const authorityMatch =
      processedText.match(authorityRegex1) ||
      processedText.match(authorityRegex2)

    if (authorityMatch && authorityMatch[1]) {
      info.issuingAuthority = authorityMatch[1]
        .replace(/\s+/g, "")
        .replace(/\n/g, "")
        .trim()
    }

    // 解析有效期限 - 支持多种格式
    // 1. 常规格式：YYYY.MM.DD-YYYY.MM.DD
    const validPeriodRegex1 =
      /有效期限[\s\:]*(\d{4}[-\.\u5e74\s]\d{1,2}[-\.\u6708\s]\d{1,2}[日\s]*)[-\s]*(至|-)[-\s]*(\d{4}[-\.\u5e74\s]\d{1,2}[-\.\u6708\s]\d{1,2}[日]*|[永久长期]*)/
    // 2. 简化格式：YYYYMMDD-YYYYMMDD
    const validPeriodRegex2 =
      /有效期限[\s\:]*(\d{8})[-\s]*(至|-)[-\s]*(\d{8}|[永久长期]*)/

    const validPeriodMatch =
      processedText.match(validPeriodRegex1) ||
      processedText.match(validPeriodRegex2)

    if (validPeriodMatch) {
      // 格式化为统一的有效期限形式
      if (validPeriodMatch[1] && validPeriodMatch[3]) {
        const startDate = this.formatDateString(validPeriodMatch[1])
        const endDate = /\d/.test(validPeriodMatch[3])
          ? this.formatDateString(validPeriodMatch[3])
          : "长期有效"

        info.validPeriod = `${startDate}-${endDate}`
      } else {
        info.validPeriod = validPeriodMatch[0].replace("有效期限", "").trim()
      }
    }

    return info
  }

  /**
   * 清除结果缓存
   */
  clearCache(): void {
    this.resultCache.clear()
    this.options.logger?.("OCR结果缓存已清除")
  }

  /**
   * 终止OCR引擎并释放资源
   *
   * @returns {Promise<void>} 终止完成的Promise
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
    }

    if (this.ocrWorker) {
      this.ocrWorker.terminate()
      this.ocrWorker = null
    }

    this.initialized = false
    this.options.logger?.("OCR引擎已终止")
  }

  /**
   * 释放资源
   */
  dispose(): Promise<void> {
    return this.terminate()
  }
}
