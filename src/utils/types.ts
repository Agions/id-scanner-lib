/**
 * @file 类型定义文件
 * @description 定义全局类型
 * @module Types
 */

/**
 * 身份证检测结果接口
 * 
 * 包含身份证检测的结果信息，如是否成功检测到身份证、身份证的四个角点坐标以及裁剪后的身份证图像
 * 
 * @interface DetectionResult
 * @property {boolean} success - 是否成功检测到身份证
 * @property {Object[]} [corners] - 检测到的身份证四个角点坐标
 * @property {number} corners[].x - 角点X坐标
 * @property {number} corners[].y - 角点Y坐标
 * @property {ImageData} [croppedImage] - 裁剪后的身份证图像
 */
export interface DetectionResult {
  success: boolean;
  corners?: { x: number; y: number }[];
  croppedImage?: ImageData;
}

/**
 * 身份证信息接口
 * 
 * 包含从身份证中提取的各项个人信息
 * 
 * @interface IDCardInfo
 * @property {string} [name] - 姓名
 * @property {string} [gender] - 性别
 * @property {string} [nationality] - 民族
 * @property {string} [birthDate] - 出生日期
 * @property {string} [address] - 地址
 * @property {string} [idNumber] - 身份证号码
 * @property {string} [issuingAuthority] - 签发机关
 * @property {string} [validPeriod] - 有效期限
 * 
 * @example
 * ```typescript
 * // 身份证信息示例
 * const idInfo: IDCardInfo = {
 *   name: '张三',
 *   gender: '男',
 *   nationality: '汉族',
 *   birthDate: '1990-01-01',
 *   address: '北京市海淀区xxxxx',
 *   idNumber: '110101199001011234',
 *   issuingAuthority: '北京市公安局海淀分局',
 *   validPeriod: '2020.01.01-2040.01.01'
 * };
 * ```
 */
export interface IDCardInfo {
  name?: string;
  gender?: string;
  nationality?: string;
  birthDate?: string;
  address?: string;
  idNumber?: string;
  issuingAuthority?: string;
  validPeriod?: string;
} 