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
 * @property {ImageData} [imageData] - 原始图像数据
 * @property {Object} [boundingBox] - 检测到的身份证边界框
 * @property {number} boundingBox.x - 边界框左上角X坐标
 * @property {number} boundingBox.y - 边界框左上角Y坐标
 * @property {number} boundingBox.width - 边界框宽度
 * @property {number} boundingBox.height - 边界框高度
 * @property {number} [confidence] - 检测结果的置信度
 * @property {string} [message] - 检测结果的消息
 */
export interface DetectionResult {
  success: boolean;
  corners?: { x: number; y: number }[];
  croppedImage?: ImageData;
  imageData?: ImageData;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence?: number;
  message?: string;
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
  /** 姓名 */
  name?: string;
  /** 性别 */
  gender?: string;
  /** 民族 */
  ethnicity?: string;
  /** 出生日期 */
  birthDate?: string;
  /** 地址 */
  address?: string;
  /** 身份证号码 */
  idNumber?: string;
  /** 签发机关 */
  issueAuthority?: string;
  /** 有效期起始日期 */
  validFrom?: string;
  /** 有效期截止日期 */
  validTo?: string;
  /** 有效期限（完整文本） */
  validPeriod?: string;
  /** 照片区域 */
  photoRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 类型 */
  type?: string;
  /** 置信度 */
  confidence?: number;
  /** 其他属性 */
  [key: string]: any;
}

/**
 * 点坐标
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * 矩形区域
 */
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 可释放资源接口
 */
export interface Disposable {
  /** 释放资源 */
  dispose(): Promise<void>;
}

/**
 * 图像处理选项
 */
export interface ImageProcessingOptions {
  /** 亮度调整 (-100 到 100) */
  brightness?: number;
  /** 对比度调整 (-100 到 100) */
  contrast?: number;
  /** 饱和度调整 (-100 到 100) */
  saturation?: number;
  /** 锐化强度 (0 到 10) */
  sharpen?: number | boolean;
  /** 高斯模糊半径 (0 到 10) */
  blur?: number;
  /** 是否应用灰度转换 */
  grayscale?: boolean;
  /** 是否应用二值化 */
  binarize?: boolean;
  /** 二值化阈值 (0 到 255) */
  threshold?: number;
  /** 是否应用边缘检测 */
  edgeDetection?: boolean;
  /** 是否应用降噪 */
  denoise?: boolean;
  /** 是否应用直方图均衡化 */
  histogramEqualization?: boolean;
  /** 是否应用透视校正 */
  perspectiveCorrection?: boolean;
  /** 透视校正点 */
  perspectivePoints?: {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
  };
} 