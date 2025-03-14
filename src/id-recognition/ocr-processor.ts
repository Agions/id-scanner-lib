/**
 * @file OCR处理模块
 * @description 提供身份证文字识别和信息提取功能
 * @module OCRProcessor
 */

import { createWorker } from 'tesseract.js';
import { IDCardInfo } from '../utils/types';
import { ImageProcessor } from '../utils/image-processing';

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
export class OCRProcessor {
  private worker: any = null;
  
  constructor() {}
  
  /**
   * 初始化OCR引擎
   * 
   * 加载Tesseract OCR引擎和中文简体语言包，并设置适合身份证识别的参数
   * 
   * @returns {Promise<void>} 初始化完成的Promise
   */
  async initialize(): Promise<void> {
    this.worker = createWorker({
      logger: (m: any) => console.log(m)
    } as any);
    
    await this.worker.load();
    await this.worker.loadLanguage('chi_sim');
    await this.worker.initialize('chi_sim');
    await this.worker.setParameters({
      tessedit_char_whitelist: '0123456789X-年月日一二三四五六七八九十零壹贰叁肆伍陆柒捌玖拾ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz民族汉族满族回族维吾尔族藏族苗族彝族壮族朝鲜族侗族瑶族白族土家族哈尼族哈萨克族傣族黎族傈僳族佤族高山族拉祜族水族东乡族钠西族景颇族柯尔克孜族士族达斡尔族仫佬族羌族布朗族撒拉族毛南族仡佬族锡伯族阿昌族普米族塔吉克族怒族乌孜别克族俄罗斯族鄂温克族德昂族保安族裕固族京族塔塔尔族独龙族鄂伦春族赫哲族门巴族珞巴族基诺族男女性别住址出生公民身份号码签发机关有效期'
    });
  }
  
  /**
   * 处理身份证图像并提取信息
   * 
   * 对身份证图像进行OCR识别，并从识别结果中提取结构化信息
   * 
   * @param {ImageData} imageData - 身份证图像数据
   * @returns {Promise<IDCardInfo>} 提取到的身份证信息
   */
  async processIDCard(imageData: ImageData): Promise<IDCardInfo> {
    if (!this.worker) {
      await this.initialize();
    }
    
    // 图像预处理，提高OCR识别率
    const enhancedImage = ImageProcessor.adjustBrightnessContrast(imageData, 15, 25);
    
    // 转换ImageData为Canvas
    const canvas = ImageProcessor.imageDataToCanvas(enhancedImage);
    
    // OCR识别
    try {
      const { data } = await this.worker.recognize(canvas);
      
      // 解析身份证信息
      return this.parseIDCardText(data.text);
    } catch (error) {
      console.error('OCR识别错误:', error);
      return {}; // 返回空对象
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
   * 终止OCR引擎并释放资源
   * 
   * @returns {Promise<void>} 终止完成的Promise
   */
  async terminate(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }
} 