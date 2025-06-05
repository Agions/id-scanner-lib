/**
 * @file 身份证模块入口
 * @description 提供身份证识别和验证功能的模块入口
 * @module modules/id-card
 */

import { BaseModule } from '../../core/base-module';
import { IDCardDetector } from './id-card-detector';
import { OCRProcessor } from './ocr-processor';
import { AntiFakeDetector } from './anti-fake-detector';
import { IDCardInfo, IDCardType, IDCardModuleOptions, IDCardVerificationResult } from './types';

/**
 * 身份证识别模块
 * 提供身份证检测、OCR识别、防伪检测等功能
 */
export class IDCardModule extends BaseModule {
  /** 模块名称 */
  public readonly name: string = 'id-card';
  
  /** 模块配置 */
  private options: IDCardModuleOptions;
  
  /** 身份证检测器 */
  private detector: IDCardDetector;
  
  /** OCR处理器 */
  private ocrProcessor?: OCRProcessor;
  
  /** 防伪检测器 */
  private antiFakeDetector?: AntiFakeDetector;
  
  /** 最后一次检测结果 */
  private lastDetectionResult?: IDCardInfo;
  
  /**
   * 构造函数
   * @param options 模块配置选项
   */
  constructor(options: IDCardModuleOptions = {}) {
    super();
    
    this.options = {
      enabled: true,
      detector: {
        minConfidence: 0.7,
        enableOCR: true,
        enableAntiFake: false,
        ...options.detector
      },
      ocr: {
        useWorker: true,
        maxImageDimension: 1000,
        brightness: 10,
        contrast: 20,
        ...options.ocr
      },
      antiFake: {
        sensitivity: 0.8,
        minConfidence: 0.7,
        ...options.antiFake
      },
      ...options
    };
    
    // 创建检测器
    this.detector = new IDCardDetector({
      minConfidence: this.options.detector?.minConfidence,
      enableEdgeDetection: true,
      returnImage: true
    });
  }
  
  /**
   * 初始化模块
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }
    
    this.logger.debug(this.name, '初始化身份证模块');
    
    try {
      // 初始化检测器
      await this.detector.initialize();
      
      // 如果启用OCR，初始化OCR处理器
      if (this.options.detector?.enableOCR) {
        this.ocrProcessor = new OCRProcessor({
          useWorker: this.options.ocr?.useWorker,
          maxImageDimension: this.options.ocr?.maxImageDimension,
          brightness: this.options.ocr?.brightness,
          contrast: this.options.ocr?.contrast
        });
        
        await this.ocrProcessor.initialize();
      }
      
      // 如果启用防伪检测，初始化防伪检测器
      if (this.options.detector?.enableAntiFake) {
        this.antiFakeDetector = new AntiFakeDetector({
          sensitivity: this.options.antiFake?.sensitivity
        });
        
        // AntiFakeDetector 不需要初始化
      }
      
      this._isInitialized = true;
      this.emit('initialized');
      this.logger.debug(this.name, '身份证模块初始化完成');
    } catch (error) {
      this.logger.error(this.name, '身份证模块初始化失败', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`身份证模块初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 识别身份证图像
   * @param image 图像源
   * @returns 识别结果
   */
  public async recognize(
    image: ImageData | HTMLImageElement | HTMLCanvasElement
  ): Promise<IDCardInfo> {
    this.ensureInitialized();
    
    try {
      // 检测身份证
      const detectionResult = await this.detector.processImage(image);
      
      if (!detectionResult.isSuccess() || !detectionResult.data) {
        throw new Error('未检测到身份证');
      }
      
      // 创建结果对象
      const idCardInfo: IDCardInfo = {
        type: detectionResult.data.type || IDCardType.FRONT,
        confidence: detectionResult.data.confidence
      };
      
      // 如果启用OCR且OCR处理器已初始化
      if (this.options.detector?.enableOCR && this.ocrProcessor) {
        // 裁剪并处理图像
        const processedImage = detectionResult.data.image || this.convertToImageData(image);
        
        // 识别文本信息
        const ocrResult = await this.ocrProcessor.processIDCard(processedImage);
        
        // 合并OCR结果
        Object.assign(idCardInfo, ocrResult);
      }
      
      // 如果启用防伪检测且防伪检测器已初始化
      if (this.options.detector?.enableAntiFake && this.antiFakeDetector) {
        const processedImage = this.convertToImageData(image);
        const antiFakeResult = await this.antiFakeDetector.detect(processedImage);
        
        // 转换防伪检测结果格式
        idCardInfo.antiFake = {
          passed: antiFakeResult.isAuthentic,
          score: antiFakeResult.confidence,
          features: {
            // 转换检测到的特征
            fluorescent: antiFakeResult.detectedFeatures.includes('荧光油墨特征'),
            microtext: antiFakeResult.detectedFeatures.includes('微缩文字'),
            opticalVariable: antiFakeResult.detectedFeatures.includes('光变图案'),
            texture: antiFakeResult.detectedFeatures.includes('雕刻凹印'),
            watermark: antiFakeResult.detectedFeatures.includes('隐形图案')
          }
        };
      }
      
      // 保存最后一次检测结果
      this.lastDetectionResult = idCardInfo;
      
      // 触发事件
      this.emit('recognized', { idCardInfo });
      
      return idCardInfo;
    } catch (error) {
      this.logger.error(this.name, '身份证识别失败', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`身份证识别失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 验证身份证信息
   * @param idCardInfo 身份证信息
   * @returns 验证结果
   */
  public verify(idCardInfo: IDCardInfo): IDCardVerificationResult {
    this.ensureInitialized();
    
    const result: IDCardVerificationResult = {
      isValid: true,
      score: 1.0,
      details: {
        idNumberValid: true,
        issueDateValid: true,
        isExpired: false,
        antiFakePassed: true
      }
    };
    
    // 验证身份证号码
    if (idCardInfo.idNumber) {
      result.details!.idNumberValid = this.validateIDNumber(idCardInfo.idNumber);
      if (!result.details!.idNumberValid) {
        result.isValid = false;
        result.score -= 0.3;
        result.failureReason = '身份证号码无效';
      }
    }
    
    // 验证有效期
    if (idCardInfo.validTo) {
      result.details!.isExpired = this.isIDCardExpired(idCardInfo.validTo);
      if (result.details!.isExpired) {
        result.isValid = false;
        result.score -= 0.2;
        result.failureReason = '身份证已过期';
      }
    }
    
    // 验证防伪结果
    if (idCardInfo.antiFake) {
      result.details!.antiFakePassed = idCardInfo.antiFake.passed;
      if (!result.details!.antiFakePassed) {
        result.isValid = false;
        result.score -= 0.5;
        result.failureReason = '防伪检测未通过';
      }
    }
    
    return result;
  }
  
  /**
   * 获取最后一次识别结果
   */
  public getLastRecognitionResult(): IDCardInfo | undefined {
    return this.lastDetectionResult;
  }
  
  /**
   * 释放模块资源
   */
  public async dispose(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }
    
    this.logger.debug(this.name, '释放身份证模块资源');
    
    try {
      // 释放检测器资源
      await this.detector.dispose();
      
      // 释放OCR处理器资源
      if (this.ocrProcessor) {
        await this.ocrProcessor.terminate();
      }
      
      // 释放防伪检测器资源
      if (this.antiFakeDetector) {
        await this.antiFakeDetector.dispose();
      }
      
      // 调用基类的dispose方法
      await super.dispose();
    } catch (error) {
      this.logger.error(this.name, '身份证模块资源释放失败', error instanceof Error ? error : new Error(String(error)));
      throw new Error(`身份证模块资源释放失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 验证身份证号码是否有效
   * @param idNumber 身份证号码
   * @returns 是否有效
   */
  private validateIDNumber(idNumber: string): boolean {
    // 基本格式验证
    if (!idNumber || !/^\d{17}[\dX]$/.test(idNumber)) {
      return false;
    }
    
    // 验证出生日期
    const year = parseInt(idNumber.substring(6, 10));
    const month = parseInt(idNumber.substring(10, 12));
    const day = parseInt(idNumber.substring(12, 14));
    
    if (year < 1900 || year > new Date().getFullYear() ||
        month < 1 || month > 12 ||
        day < 1 || day > 31) {
      return false;
    }
    
    // 验证校验位
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const validationCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idNumber[i]) * weights[i];
    }
    
    const validationCode = validationCodes[sum % 11];
    return validationCode === idNumber[17].toUpperCase();
  }
  
  /**
   * 检查身份证是否过期
   * @param validTo 有效期截止日期
   * @returns 是否过期
   */
  private isIDCardExpired(validTo: string): boolean {
    // 如果是"长期"，则视为未过期
    if (validTo === '长期' || validTo === '长期有效') {
      return false;
    }
    
    try {
      // 解析日期字符串
      const parts = validTo.split('-');
      if (parts.length !== 3) {
        return true; // 格式错误，视为过期
      }
      
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // 月份从0开始
      const day = parseInt(parts[2]);
      
      const expiryDate = new Date(year, month, day);
      const today = new Date();
      
      // 设置时间为当天结束
      today.setHours(0, 0, 0, 0);
      
      return expiryDate < today;
    } catch {
      return true; // 解析错误，视为过期
    }
  }
  
  /**
   * 检测身份证
   * @param image 图像源
   * @returns 检测结果
   */
  public async detect(
    image: ImageData | HTMLImageElement | HTMLCanvasElement
  ): Promise<{ 
    success: boolean; 
    type?: IDCardType; 
    confidence: number;
    croppedImage?: ImageData;
  }> {
    this.ensureInitialized();
    
    try {
      // 调用检测器处理图像
      const result = await this.detector.processImage(image);
      
      if (!result.isSuccess() || !result.data) {
        return { success: false, confidence: 0 };
      }
      
      return { 
        success: true, 
        type: result.data.type, 
        confidence: result.data.confidence || 0,
        croppedImage: result.data.image
      };
    } catch (error) {
      this.logger.error(this.name, '身份证检测失败', error instanceof Error ? error : new Error(String(error)));
      return { success: false, confidence: 0 };
    }
  }

  /**
   * 将图像转换为 ImageData
   * @param image 图像源
   * @returns ImageData 对象
   */
  private convertToImageData(image: ImageData | HTMLImageElement | HTMLCanvasElement): ImageData {
    // 如果已经是 ImageData，直接返回
    if (image instanceof ImageData) {
      return image;
    }

    // 创建 Canvas 用于转换
    const canvas = document.createElement('canvas');
    const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
    const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法创建 Canvas 上下文');
    }
    
    // 绘制图像到 Canvas
    ctx.drawImage(image, 0, 0);
    
    // 返回 ImageData
    return ctx.getImageData(0, 0, width, height);
  }

  /**
   * 确保模块已初始化
   * @protected
   */
  protected ensureInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('身份证模块尚未初始化');
    }
  }
}

// 导出类型
export * from './types'; 