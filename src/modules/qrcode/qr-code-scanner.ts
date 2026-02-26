/**
 * @file 二维码扫描器
 * @description 提供二维码检测和解析功能
 * @module modules/qrcode/qr-code-scanner
 */

import { EventEmitter } from '../../core/event-emitter';
import { Logger } from '../../core/logger';
import { QRCodeResult, BarcodeFormat } from './types';
import jsQR from 'jsqr';

/**
 * 二维码扫描器配置选项
 */
export interface QRCodeScannerOptions {
  /** 最小置信度 */
  minConfidence?: number;
  /** 是否返回原始图像 */
  returnImage?: boolean;
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

/**
 * 二维码扫描器类
 */
export class QRCodeScanner extends EventEmitter {
  private options: QRCodeScannerOptions;
  private logger: Logger;
  private initialized: boolean = false;

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options: QRCodeScannerOptions = {}) {
    super();
    this.options = {
      minConfidence: 0.6,
      returnImage: false,
      imageProcess: {
        preprocess: true,
        enhanceContrast: true,
        threshold: 128,
        ...options.imageProcess
      },
      ...options
    };
    this.logger = Logger.getInstance();
  }

  /**
   * 初始化扫描器
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.debug('QRCodeScanner', '初始化二维码扫描器');
    
    // 验证jsQR是否可用
    if (typeof jsQR !== 'function') {
      throw new Error('jsQR库未加载，请确保已安装jsqr依赖');
    }

    this.initialized = true;
    this.logger.debug('QRCodeScanner', '二维码扫描器初始化完成');
  }

  /**
   * 扫描图像中的二维码
   * @param image 图像源
   * @returns 二维码扫描结果
   */
  public async scan(
    image: ImageData | HTMLImageElement | HTMLCanvasElement
  ): Promise<QRCodeResult | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }

    // 将输入转换为ImageData
    const imageData = this.getImageData(image);
    
    // 图像预处理
    const processedImage = this.options.imageProcess?.preprocess
      ? this.preprocessImage(imageData)
      : imageData;

    // 使用jsQR进行扫描
    const code = jsQR(
      processedImage.data,
      processedImage.width,
      processedImage.height,
      {
        inversionAttempts: 'dontInvert'
      }
    );

    if (!code) {
      return undefined;
    }

    // 构建结果
    const result: QRCodeResult = {
      data: code.data,
      barcodeFormat: BarcodeFormat.QR_CODE,
      boundingBox: {
        topLeft: code.location.topLeftCorner,
        topRight: code.location.topRightCorner,
        bottomRight: code.location.bottomRightCorner,
        bottomLeft: code.location.bottomLeftCorner
      },
      center: {
        x: Math.round((code.location.topLeftCorner.x + code.location.bottomRightCorner.x) / 2),
        y: Math.round((code.location.topLeftCorner.y + code.location.bottomRightCorner.y) / 2)
      },
      confidence: 1.0 // jsQR不提供置信度，默认为1.0
    };

    // 如果需要返回原始图像
    if (this.options.returnImage) {
      result.image = imageData;
    }

    this.logger.debug('QRCodeScanner', `扫描到二维码: ${result.data.substring(0, 20)}${result.data.length > 20 ? '...' : ''}`);
    
    return result;
  }

  /**
   * 将各种图像源转换为ImageData
   * @param image 图像源
   * @returns ImageData
   */
  private getImageData(
    image: ImageData | HTMLImageElement | HTMLCanvasElement
  ): ImageData {
    // 如果已经是ImageData，直接返回
    if (image instanceof ImageData) {
      return image;
    }

    // 创建canvas并获取2D上下文
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('无法创建Canvas上下文');
    }

    // 设置canvas尺寸
    canvas.width = image.width;
    canvas.height = image.height;

    // 绘制图像
    ctx.drawImage(image, 0, 0);

    // 获取ImageData
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  /**
   * 图像预处理
   * @param imageData 原始图像数据
   * @returns 处理后的图像数据
   */
  private preprocessImage(imageData: ImageData): ImageData {
    // 创建canvas并获取2D上下文
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return imageData;
    }

    // 设置canvas尺寸
    canvas.width = imageData.width;
    canvas.height = imageData.height;

    // 绘制原始图像
    ctx.putImageData(imageData, 0, 0);

    // 增强对比度
    if (this.options.imageProcess?.enhanceContrast) {
      ctx.filter = 'contrast(150%)';
      ctx.drawImage(canvas, 0, 0);
      ctx.filter = 'none';
    }

    // 应用二值化
    const threshold = this.options.imageProcess?.threshold || 128;
    const processedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = processedData.data;

    for (let i = 0; i < data.length; i += 4) {
      // 计算灰度值
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      // 二值化
      const value = gray < threshold ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = value;
    }

    return processedData;
  }

  /**
   * 释放资源
   */
  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
    }

    this.logger.debug('QRCodeScanner', '释放二维码扫描器资源');
    
    // 移除所有事件监听器
    this.removeAllListeners();
    
    this.initialized = false;
    this.logger.debug('QRCodeScanner', '二维码扫描器资源已释放');
  }
} 