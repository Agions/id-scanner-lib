/**
 * @file 错误处理模块
 * @description 定义ID-Scanner-Lib的错误类层次结构
 * @module core/errors
 */

/**
 * ID-Scanner-Lib 基础错误类
 * 所有库特定错误的基类
 */
export class IDScannerError extends Error {
  /** 错误代码 */
  public code: string;
  /** 错误原因 */
  public cause?: Error;

  /**
   * 构造函数
   * @param message 错误消息
   * @param options 错误选项
   */
  constructor(message: string, options?: { code?: string; cause?: Error }) {
    super(message);
    
    // 设置错误名称
    this.name = this.constructor.name;
    
    // 设置错误代码
    this.code = options?.code || 'UNKNOWN_ERROR';
    
    // 设置错误原因
    this.cause = options?.cause;
    
    // 捕获堆栈
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * 初始化错误
 * 当库初始化失败时抛出
 */
export class InitializationError extends IDScannerError {
  constructor(message: string, details?: string) {
    super(`初始化失败: ${message}${details ? ` (${details})` : ''}`, { code: 'INIT_FAILED' });
    this.name = 'InitializationError';
  }
}

/**
 * 设备错误
 * 当访问硬件设备(如摄像头)失败时抛出
 */
export class DeviceError extends IDScannerError {
  constructor(message: string) {
    super(`设备错误: ${message}`, { code: 'DEVICE_ERROR' });
    this.name = 'DeviceError';
  }
}

/**
 * 摄像头访问错误
 * 当无法访问或启动摄像头时抛出
 */
export class CameraAccessError extends IDScannerError {
  constructor(message: string, options?: { code?: string; cause?: Error }) {
    super(`摄像头访问失败: ${message}`, {
      code: options?.code || 'CAMERA_ACCESS_FAILED',
      cause: options?.cause
    });
    this.name = 'CameraAccessError';
  }
}

/**
 * 人脸检测错误
 * 当人脸检测过程失败时抛出
 */
export class FaceDetectionError extends IDScannerError {
  constructor(message: string) {
    super(`人脸检测失败: ${message}`, { code: 'FACE_DETECTION_FAILED' });
    this.name = 'FaceDetectionError';
  }
}

/**
 * 人脸比对错误
 * 当人脸比对过程失败时抛出
 */
export class FaceComparisonError extends IDScannerError {
  constructor(message: string) {
    super(`人脸比对失败: ${message}`, { code: 'FACE_COMPARISON_FAILED' });
    this.name = 'FaceComparisonError';
  }
}

/**
 * 活体检测错误
 * 当活体检测过程失败时抛出
 */
export class LivenessDetectionError extends IDScannerError {
  constructor(message: string) {
    super(`活体检测失败: ${message}`, { code: 'LIVENESS_DETECTION_FAILED' });
    this.name = 'LivenessDetectionError';
  }
}

/**
 * OCR识别错误
 * 当OCR文字识别失败时抛出
 */
export class OCRProcessingError extends IDScannerError {
  constructor(message: string) {
    super(`OCR处理失败: ${message}`, { code: 'OCR_PROCESSING_FAILED' });
    this.name = 'OCRProcessingError';
  }
}

/**
 * 二维码扫描错误
 * 当二维码扫描失败时抛出
 */
export class QRScanError extends IDScannerError {
  constructor(message: string) {
    super(`二维码扫描失败: ${message}`, { code: 'QR_SCAN_FAILED' });
    this.name = 'QRScanError';
  }
}

/**
 * 身份证检测错误
 * 当身份证检测失败时抛出
 */
export class IDCardDetectionError extends IDScannerError {
  constructor(message: string) {
    super(`身份证检测失败: ${message}`, { code: 'ID_CARD_DETECTION_FAILED' });
    this.name = 'IDCardDetectionError';
  }
}

/**
 * 资源加载错误
 * 当无法加载必要资源(如模型)时抛出
 */
export class ResourceLoadError extends IDScannerError {
  constructor(resource: string, reason: string) {
    super(`无法加载资源 ${resource}: ${reason}`, { code: 'RESOURCE_LOAD_FAILED' });
    this.name = 'ResourceLoadError';
  }
}

/**
 * 参数错误
 * 当提供的参数无效时抛出
 */
export class InvalidArgumentError extends IDScannerError {
  constructor(paramName: string, reason: string) {
    super(`无效的参数 ${paramName}: ${reason}`, { code: 'INVALID_ARGUMENT' });
    this.name = 'InvalidArgumentError';
  }
}

/**
 * 不支持错误
 * 当尝试使用不支持的功能或当前环境无法使用的功能时抛出
 */
export class NotSupportedError extends IDScannerError {
  constructor(feature: string) {
    super(`不支持的功能: ${feature}`, { code: 'NOT_SUPPORTED' });
    this.name = 'NotSupportedError';
  }
} 