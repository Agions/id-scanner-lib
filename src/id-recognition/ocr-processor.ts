/**
 * @file OCR处理模块
 * @description 提供身份证文字识别和信息提取功能
 * @module OCRProcessor
 */

import { createWorker } from 'tesseract.js';
import { IDCardInfo } from '../utils/types';
import { ImageProcessor } from '../utils/image-processing';
import { LRUCache, calculateImageFingerprint } from '../utils/performance';
import { isWorkerSupported, createWorker as createCustomWorker } from '../utils/worker';
import { processOCRInWorker, OCRProcessInput } from './ocr-worker';
import { Disposable } from '../utils/resource-manager';

/**
 * OCR处理器选项接口
 */
export interface OCRProcessorOptions {
  /** 是否使用Worker线程 */
  useWorker?: boolean;
  /** 是否启用结果缓存 */
  enableCache?: boolean;
  /** 缓存容量 */
  cacheSize?: number;
  /** 图像处理前的最大尺寸 */
  maxImageDimension?: number;
  /** 日志回调函数 */
  logger?: (message: any) => void;
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
  private worker: any = null;
  private ocrWorker: ReturnType<typeof createCustomWorker<OCRProcessInput, { idCardInfo: IDCardInfo, processingTime: number }>> | null = null;
  private initialized: boolean = false;
  private resultCache: LRUCache<string, IDCardInfo>;
  private options: OCRProcessorOptions;
  
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
      ...options
    };
    
    // 初始化缓存
    this.resultCache = new LRUCache<string, IDCardInfo>(this.options.cacheSize);
  }
  
  /**
   * 初始化OCR引擎
   * 
   * 加载Tesseract OCR引擎和中文简体语言包，并设置适合身份证识别的参数
   * 
   * @returns {Promise<void>} 初始化完成的Promise
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    if (this.options.useWorker) {
      // 使用自定义Worker线程处理OCR
      this.ocrWorker = createCustomWorker<OCRProcessInput, { idCardInfo: IDCardInfo, processingTime: number }>(processOCRInWorker);
      this.initialized = true;
      this.options.logger?.('OCR Worker 初始化完成');
    } else {
      // 使用主线程处理OCR
      this.worker = createWorker({
        logger: this.options.logger
      } as any);
      
      await this.worker.load();
      await this.worker.loadLanguage('chi_sim');
      await this.worker.initialize('chi_sim');
      await this.worker.setParameters({
        tessedit_char_whitelist: '0123456789X-年月日一二三四五六七八九十零壹贰叁肆伍陆柒捌玖拾ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz民族汉族满族回族维吾尔族藏族苗族彝族壮族朝鲜族侗族瑶族白族土家族哈尼族哈萨克族傣族黎族傈僳族佤族高山族拉祜族水族东乡族钠西族景颇族柯尔克孜族士族达斡尔族仫佬族羌族布朗族撒拉族毛南族仡佬族锡伯族阿昌族普米族塔吉克族怒族乌孜别克族俄罗斯族鄂温克族德昂族保安族裕固族京族塔塔尔族独龙族鄂伦春族赫哲族门巴族珞巴族基诺族男女性别住址出生公民身份号码签发机关有效期'
      });
      
      this.initialized = true;
      this.options.logger?.('OCR引擎初始化完成');
    }
  }
  
  /**
   * 处理身份证图像并提取信息
   * @param imageData 要处理的身份证图像数据
   * @returns 提取的身份证信息
   */
  async processIDCard(imageData: ImageData): Promise<IDCardInfo> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // 计算图像指纹，用于缓存查找
    if (this.options.enableCache) {
      const fingerprint = calculateImageFingerprint(imageData);
      
      // 检查缓存中是否有结果
      const cachedResult = this.resultCache.get(fingerprint);
      if (cachedResult) {
        this.options.logger?.('使用缓存的OCR结果');
        return cachedResult;
      }
    }
    
    // 图像预处理：降低分辨率和增强对比度
    const downsampledImage = ImageProcessor.downsampleForProcessing(imageData, this.options.maxImageDimension);
    const enhancedImage = ImageProcessor.adjustBrightnessContrast(downsampledImage, 15, 25);
    
    // OCR识别
    try {
      let idCardInfo: IDCardInfo;
      
      if (this.options.useWorker && this.ocrWorker) {
        // 使用Worker线程处理
        const base64Image = ImageProcessor.imageDataToBase64(enhancedImage);
        
        const result = await this.ocrWorker.postMessage({
          imageBase64: base64Image,
          tessWorkerOptions: {
            logger: this.options.logger
          }
        });
        
        idCardInfo = result.idCardInfo;
        this.options.logger?.(`OCR处理完成，用时: ${result.processingTime.toFixed(2)}ms`);
      } else {
        // 使用主线程处理
        const startTime = performance.now();
        
        // 转换ImageData为Canvas
        const canvas = ImageProcessor.imageDataToCanvas(enhancedImage);
        
        const { data } = await this.worker.recognize(canvas);
        
        // 解析身份证信息
        idCardInfo = this.parseIDCardText(data.text);
        
        const processingTime = performance.now() - startTime;
        this.options.logger?.(`OCR处理完成，用时: ${processingTime.toFixed(2)}ms`);
      }
      
      // 缓存结果
      if (this.options.enableCache) {
        const fingerprint = calculateImageFingerprint(imageData);
        this.resultCache.set(fingerprint, idCardInfo);
      }
      
      return idCardInfo;
    } catch (error) {
      this.options.logger?.(`OCR识别错误: ${error}`);
      return {} as IDCardInfo;
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
  private parseIDCardText(text: string): IDCardInfo {
    const info: IDCardInfo = {};
    
    // 拆分为行
    const lines = text.split('\n').filter(line => line.trim());
    
    // 解析身份证号码（最容易识别的部分）
    const idNumberRegex = /(\d{17}[\dX])/;
    const idNumberMatch = text.match(idNumberRegex);
    if (idNumberMatch) {
      info.idNumber = idNumberMatch[1];
    }
    
    // 解析姓名
    for (const line of lines) {
      if (line.includes('姓名') || line.length < 10 && line.length > 1 && !/\d/.test(line)) {
        info.name = line.replace('姓名', '').trim();
        break;
      }
    }
    
    // 解析性别和民族
    const genderNationalityRegex = /(男|女).*(族)/;
    const genderMatch = text.match(genderNationalityRegex);
    if (genderMatch) {
      info.gender = genderMatch[1];
      const nationalityText = genderMatch[0];
      info.nationality = nationalityText.substring(nationalityText.indexOf(genderMatch[1]) + 1).trim();
    }
    
    // 解析出生日期
    const birthDateRegex = /(\d{4})年(\d{1,2})月(\d{1,2})日/;
    const birthDateMatch = text.match(birthDateRegex);
    if (birthDateMatch) {
      info.birthDate = `${birthDateMatch[1]}-${birthDateMatch[2]}-${birthDateMatch[3]}`;
    }
    
    // 解析地址
    const addressRegex = /住址([\s\S]*?)公民身份号码/;
    const addressMatch = text.match(addressRegex);
    if (addressMatch) {
      info.address = addressMatch[1].replace(/\n/g, '').trim();
    }
    
    // 解析签发机关
    const authorityRegex = /签发机关([\s\S]*?)有效期/;
    const authorityMatch = text.match(authorityRegex);
    if (authorityMatch) {
      info.issuingAuthority = authorityMatch[1].replace(/\n/g, '').trim();
    }
    
    // 解析有效期限
    const validPeriodRegex = /有效期限([\s\S]*?)(-|至)/;
    const validPeriodMatch = text.match(validPeriodRegex);
    if (validPeriodMatch) {
      info.validPeriod = validPeriodMatch[0].replace('有效期限', '').trim();
    }
    
    return info;
  }
  
  /**
   * 清除结果缓存
   */
  clearCache(): void {
    this.resultCache.clear();
    this.options.logger?.('OCR结果缓存已清除');
  }
  
  /**
   * 终止OCR引擎并释放资源
   * 
   * @returns {Promise<void>} 终止完成的Promise
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
    
    if (this.ocrWorker) {
      this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
    
    this.initialized = false;
    this.options.logger?.('OCR引擎已终止');
  }
  
  /**
   * 释放资源
   */
  dispose(): Promise<void> {
    return this.terminate();
  }
} 