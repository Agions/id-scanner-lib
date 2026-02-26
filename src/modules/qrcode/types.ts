/**
 * @file 二维码模块类型定义
 * @description 二维码模块相关的类型和接口定义
 * @module modules/qrcode/types
 */

/**
 * 支持的条码格式
 */
export enum BarcodeFormat {
  /** QR码 */
  QR_CODE = 'qrcode',
  /** Code 128 */
  CODE_128 = 'code_128',
  /** Code 39 */
  CODE_39 = 'code_39',
  /** Code 93 */
  CODE_93 = 'code_93',
  /** EAN-13 */
  EAN_13 = 'ean_13',
  /** EAN-8 */
  EAN_8 = 'ean_8',
  /** UPC-A */
  UPC_A = 'upc_a',
  /** UPC-E */
  UPC_E = 'upc_e',
  /** ITF */
  ITF = 'itf',
  /** PDF417 */
  PDF_417 = 'pdf_417',
  /** DataMatrix */
  DATA_MATRIX = 'data_matrix',
  /** Aztec */
  AZTEC = 'aztec',
  /** Codabar */
  CODABAR = 'codabar',
  /** Industrial 2 of 5 */
  INDUSTRIAL_2_OF_5 = 'industrial_2_of_5',
  /** QR Code Micro */
  QR_CODE_MICRO = 'qr_code_micro'
}

/**
 * 默认支持的格式
 */
export const DEFAULT_FORMATS = [
  BarcodeFormat.QR_CODE,
  BarcodeFormat.CODE_128,
  BarcodeFormat.CODE_39,
  BarcodeFormat.EAN_13
];

/**
 * 二维码/条码检测结果
 */
export interface QRCodeResult {
  /** 条码内容 */
  data: string;
  
  /** 条码格式 */
  format: BarcodeFormat;
  
  /** 条码类型 (兼容旧版) */
  type?: string;
  
  /** 条码边界框 */
  boundingBox: {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  };
  
  /** 条码中心点 */
  center: { x: number; y: number };
  
  /** 原始图像 */
  image?: ImageData;
  
  /** 置信度 */
  confidence?: number;
  
  /** 原始数据 (解码后的字节) */
  rawBytes?: Uint8Array;
  
  /** 错误校正级别 (QR码) */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

/**
 * 二维码模块选项
 */
export interface QRCodeModuleOptions {
  /** 是否启用模块 */
  enabled?: boolean;
  
  /** 扫描配置 */
  scanner?: {
    /** 最小置信度 */
    minConfidence?: number;
    
    /** 是否尝试多次扫描 */
    tryMultipleScan?: boolean;
    
    /** 是否返回原始图像 */
    returnImage?: boolean;
    
    /** 扫描频率 (ms) */
    scanFrequency?: number;
    
    /** 启用扫描的格式 */
    formats?: BarcodeFormat[];
  };
  
  /** 图像处理配置 */
  imageProcess?: {
    /** 是否进行预处理 */
    preprocess?: boolean;
    
    /** 是否增强对比度 */
    enhanceContrast?: boolean;
    
    /** 二值化阈值 */
    threshold?: number;
    
    /** 是否进行降噪 */
    denoise?: boolean;
  };
}

/**
 * 实时扫描选项
 */
export interface RealtimeScanOptions {
  /** 视频元素 */
  video: HTMLVideoElement;
  
  /** 扫描回调 */
  onResult: (result: QRCodeResult) => void;
  
  /** 错误回调 */
  onError?: (error: Error) => void;
  
  /** 扫描频率 (ms) */
  frequency?: number;
  
  /** 是否连续扫描 */
  continuous?: boolean;
}

/**
 * 扫描统计信息
 */
export interface ScanStats {
  /** 总扫描次数 */
  totalScans: number;
  
  /** 成功次数 */
  successfulScans: number;
  
  /** 失败次数 */
  failedScans: number;
  
  /** 平均处理时间 (ms) */
  avgProcessingTime: number;
  
  /** 成功率 */
  successRate: number;
}
