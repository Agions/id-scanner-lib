/**
 * @file 数据提取工具类
 * @description 提供身份证信息的验证和格式化功能
 * @module DataExtractor
 */

import { IDCardInfo } from '../utils/types';

/**
 * 数据提取工具类
 * 
 * 提供身份证信息的验证、提取和增强功能，可以从身份证号码中提取出生日期、性别等信息，
 * 并对OCR识别结果进行补充和验证
 * 
 * @example
 * ```typescript
 * // 验证身份证号码
 * const isValid = DataExtractor.validateIDNumber('110101199001011234');
 * 
 * // 从身份证号码提取出生日期
 * const birthDate = DataExtractor.extractBirthDateFromID('110101199001011234');
 * // 结果: '1990-01-01'
 * 
 * // 增强OCR识别结果
 * const enhancedInfo = DataExtractor.enhanceIDCardInfo({
 *   name: '张三',
 *   idNumber: '110101199001011234'
 * });
 * // 结果会自动补充性别和出生日期
 * ```
 */
export class DataExtractor {
  /**
   * 验证身份证号码格式
   * 
   * 检查身份证号码的长度、格式和出生日期部分是否有效
   * 
   * @param {string} idNumber - 要验证的身份证号码
   * @returns {boolean} 是否是有效的身份证号码
   */
  static validateIDNumber(idNumber: string): boolean {
    // 简单校验长度
    if (!idNumber || idNumber.length !== 18) {
      return false;
    }
    
    // 校验格式 (前17位必须是数字，最后一位可以是数字或X)
    const pattern = /^\d{17}[\dX]$/;
    if (!pattern.test(idNumber)) {
      return false;
    }
    
    // 校验出生日期
    const year = parseInt(idNumber.substr(6, 4));
    const month = parseInt(idNumber.substr(10, 2));
    const day = parseInt(idNumber.substr(12, 2));
    
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year || 
      date.getMonth() + 1 !== month || 
      date.getDate() !== day
    ) {
      return false;
    }
    
    // 简单的校验规则，实际项目中可以加入更完善的验证
    return true;
  }
  
  /**
   * 从身份证号码提取出生日期
   * 
   * @param {string} idNumber - 身份证号码
   * @returns {string|null} 格式化的出生日期（YYYY-MM-DD），如果身份证号码无效则返回null
   */
  static extractBirthDateFromID(idNumber: string): string | null {
    if (!this.validateIDNumber(idNumber)) {
      return null;
    }
    
    const year = idNumber.substr(6, 4);
    const month = idNumber.substr(10, 2);
    const day = idNumber.substr(12, 2);
    
    return `${year}-${month}-${day}`;
  }
  
  /**
   * 从身份证号码提取性别
   * 
   * 根据身份证号码第17位判断性别，奇数为男，偶数为女
   * 
   * @param {string} idNumber - 身份证号码
   * @returns {string|null} '男'或'女'，如果身份证号码无效则返回null
   */
  static extractGenderFromID(idNumber: string): string | null {
    if (!this.validateIDNumber(idNumber)) {
      return null;
    }
    
    // 第17位，奇数为男，偶数为女
    const genderCode = parseInt(idNumber.charAt(16));
    return genderCode % 2 === 1 ? '男' : '女';
  }
  
  /**
   * 从身份证号码提取地区编码
   * 
   * @param {string} idNumber - 身份证号码
   * @returns {string|null} 地区编码（前6位），如果身份证号码无效则返回null
   */
  static extractRegionFromID(idNumber: string): string | null {
    if (!this.validateIDNumber(idNumber)) {
      return null;
    }
    
    return idNumber.substr(0, 6);
  }
  
  /**
   * 合并并优化身份证信息
   * 
   * 使用多个来源的数据进行交叉验证和补充，如果OCR识别结果缺少某些信息，
   * 但有身份证号码，则可以从号码中提取出生日期和性别等信息
   * 
   * @param {IDCardInfo} ocrInfo - OCR识别到的身份证信息
   * @param {string} [idNumber] - 可选的外部提供的身份证号码，优先级高于OCR识别结果
   * @returns {IDCardInfo} 增强后的身份证信息
   */
  static enhanceIDCardInfo(ocrInfo: IDCardInfo, idNumber?: string): IDCardInfo {
    const result = { ...ocrInfo };
    
    // 如果OCR识别出身份证号，但没有识别出生日期或性别，则从身份证号码提取
    if (result.idNumber && this.validateIDNumber(result.idNumber)) {
      // 从身份证号提取出生日期
      if (!result.birthDate) {
        result.birthDate = this.extractBirthDateFromID(result.idNumber) || undefined;
      }
      
      // 从身份证号提取性别
      if (!result.gender) {
        result.gender = this.extractGenderFromID(result.idNumber) || undefined;
      }
    }
    
    // 如果外部传入了身份证号，则优先使用它并提取信息
    if (idNumber && this.validateIDNumber(idNumber)) {
      result.idNumber = idNumber;
      
      // 使用身份证号码再次验证或补充信息
      const birthDate = this.extractBirthDateFromID(idNumber);
      if (birthDate) {
        result.birthDate = birthDate;
      }
      
      const gender = this.extractGenderFromID(idNumber);
      if (gender) {
        result.gender = gender;
      }
    }
    
    return result;
  }
} 