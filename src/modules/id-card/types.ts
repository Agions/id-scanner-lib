/**
 * @file 身份证模块类型定义
 * @description 身份证模块相关的类型和接口定义
 * @module modules/id-card/types
 */

/**
 * 身份证类型枚举
 */
export enum IDCardType {
  /** 第二代居民身份证正面 */
  FRONT = 'front',
  /** 第二代居民身份证背面 */
  BACK = 'back',
  /** 第一代居民身份证 */
  FIRST_GENERATION = 'first_generation',
  /** 临时身份证 */
  TEMPORARY = 'temporary',
  /** 外国人永久居留证 */
  FOREIGN_PERMANENT = 'foreign_permanent',
  /** 港澳台居民居住证 */
  HMT_RESIDENT = 'hmt_resident',
  /** 未知类型 */
  UNKNOWN = 'unknown'
}

/**
 * 证件边缘信息
 */
export interface IDCardEdge {
  /** 左上角坐标 */
  topLeft: { x: number; y: number };
  /** 右上角坐标 */
  topRight: { x: number; y: number };
  /** 右下角坐标 */
  bottomRight: { x: number; y: number };
  /** 左下角坐标 */
  bottomLeft: { x: number; y: number };
}

/**
 * 身份证信息
 */
export interface IDCardInfo {
  nationality?: string;
  issuingAuthority?: string;
  validPeriod?: string;
  /** 身份证类型 */
  type?: IDCardType;
  /** 身份证边缘信息 */
  edge?: IDCardEdge;
  /** 姓名 */
  name?: string;
  /** 性别 */
  gender?: string;
  /** 民族 */
  ethnicity?: string;
  /** 出生日期，格式: YYYY-MM-DD */
  birthDate?: string;
  /** 地址 */
  address?: string;
  /** 身份证号码 */
  idNumber?: string;
  /** 签发机关 */
  issueAuthority?: string;
  /** 有效期起始日期，格式: YYYY-MM-DD */
  validFrom?: string;
  /** 有效期截止日期，格式: YYYY-MM-DD */
  validTo?: string;
  /** 相片区域坐标 */
  photoRegion?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** 原始身份证图像 */
  image?: ImageData;
  /** 置信度 */
  confidence?: number;
  /** 防伪检测结果 */
  antiFake?: {
    /** 是否通过防伪检测 */
    passed: boolean;
    /** 防伪检测分数 */
    score: number;
    /** 防伪特征检测结果 */
    features?: {
      /** 荧光油墨 */
      fluorescent?: boolean;
      /** 微缩文字 */
      microtext?: boolean;
      /** 光变图案 */
      opticalVariable?: boolean;
      /** 纹理 */
      texture?: boolean;
      /** 暗记 */
      watermark?: boolean;
    };
  };
}

/**
 * 身份证模块配置选项
 */
export interface IDCardModuleOptions {
  /** 是否启用模块 */
  enabled?: boolean;
  
  /** 检测器配置 */
  detector?: {
    /** 最小置信度 */
    minConfidence?: number;
    /** 是否启用OCR识别 */
    enableOCR?: boolean;
    /** 是否启用防伪检测 */
    enableAntiFake?: boolean;
  };
  
  /** OCR处理器配置 */
  ocr?: {
    /** 是否使用Web Worker处理OCR */
    useWorker?: boolean;
    /** 最大图像尺寸 */
    maxImageDimension?: number;
    /** 亮度调整 */
    brightness?: number;
    /** 对比度调整 */
    contrast?: number;
  };
  
  /** 防伪检测配置 */
  antiFake?: {
    /** 防伪检测灵敏度 */
    sensitivity?: number;
    /** 最小置信度 */
    minConfidence?: number;
  };
}

/**
 * 身份证验证结果
 */
export interface IDCardVerificationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 验证分数 */
  score: number;
  /** 失败原因 */
  failureReason?: string;
  /** 验证详情 */
  details?: {
    /** 身份证号码是否有效 */
    idNumberValid?: boolean;
    /** 签发日期是否有效 */
    issueDateValid?: boolean;
    /** 有效期是否过期 */
    isExpired?: boolean;
    /** 防伪检测是否通过 */
    antiFakePassed?: boolean;
  };
}

/**
 * 图像处理配置选项
 */
export interface ImageProcessOptions {
  /** 是否进行预处理 */
  preprocess?: boolean;
  /** 是否校正图像 */
  correctPerspective?: boolean;
  /** 是否增强图像 */
  enhance?: boolean;
  /** 是否去噪 */
  denoise?: boolean;
  /** 是否二值化 */
  binarize?: boolean;
} 