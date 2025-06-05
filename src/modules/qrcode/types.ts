/**
 * @file 二维码模块类型定义
 * @description 二维码模块相关的类型和接口定义
 * @module modules/qrcode/types
 */

/**
 * 二维码检测结果
 */
export interface QRCodeResult {
  /** 二维码内容 */
  data: string;
  
  /** 二维码类型 */
  type?: string;
  
  /** 二维码边界框 */
  boundingBox: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
  
  /** 二维码中心点 */
  center: { x: number; y: number };
  
  /** 原始图像 */
  image?: ImageData;
  
  /** 置信度 */
  confidence?: number;
}

/**
 * 二维码模块选项
 */
export interface QRCodeModuleOptions {
  /** 是否启用模块 */
  enabled?: boolean;
  
  /** 二维码扫描配置 */
  scanner?: {
    /** 最小置信度 */
    minConfidence?: number;
    
    /** 是否尝试多次扫描 */
    tryMultipleScan?: boolean;
    
    /** 是否返回原始图像 */
    returnImage?: boolean;
  };
  
  /** 图像处理配置 */
  imageProcess?: {
    /** 是否进行预处理 */
    preprocess?: boolean;
    
    /** 是否增强对比度 */
    enhanceContrast?: boolean;
    
    /** 二值化阈值 */
    threshold?: number;
  };
} 