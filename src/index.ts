/**
 * @file ID扫描识别库主入口文件
 * @description 提供身份证识别与二维码、条形码扫描功能的纯前端TypeScript库
 * @module IDScannerLib
 * @version 1.0.0
 * @license MIT
 */

import { QRScanner, QRScannerOptions } from './scanner/qr-scanner';
import { BarcodeScanner, BarcodeScannerOptions } from './scanner/barcode-scanner';
import { IDCardDetector } from './id-recognition/id-detector';
import { OCRProcessor } from './id-recognition/ocr-processor';
import { DataExtractor } from './id-recognition/data-extractor';
import { Camera, CameraOptions } from './utils/camera';
import { ImageProcessor } from './utils/image-processing';
import { IDCardInfo, DetectionResult } from './utils/types';

/**
 * IDScanner配置选项接口
 * @interface IDScannerOptions
 * @property {CameraOptions} [cameraOptions] - 相机配置选项
 * @property {QRScannerOptions} [qrScannerOptions] - 二维码扫描配置选项
 * @property {BarcodeScannerOptions} [barcodeScannerOptions] - 条形码扫描配置选项
 * @property {Function} [onQRCodeScanned] - 二维码识别成功回调
 * @property {Function} [onBarcodeScanned] - 条形码识别成功回调
 * @property {Function} [onIDCardScanned] - 身份证识别成功回调
 * @property {Function} [onError] - 错误处理回调
 */
export interface IDScannerOptions {
  cameraOptions?: CameraOptions;
  qrScannerOptions?: QRScannerOptions;
  barcodeScannerOptions?: BarcodeScannerOptions;
  onQRCodeScanned?: (result: string) => void;
  onBarcodeScanned?: (result: string) => void;
  onIDCardScanned?: (info: IDCardInfo) => void;
  onError?: (error: Error) => void;
}

/**
 * IDScanner 主类
 * 
 * 整合二维码、条形码扫描和身份证识别功能，提供统一的接口
 * 
 * @example
 * ```typescript
 * // 创建扫描器实例
 * const scanner = new IDScanner({
 *   onQRCodeScanned: (result) => {
 *     console.log('扫描到二维码:', result);
 *   },
 *   onIDCardScanned: (info) => {
 *     console.log('识别到身份证信息:', info);
 *   }
 * });
 * 
 * // 初始化OCR引擎和相关资源
 * await scanner.initialize();
 * 
 * // 启动二维码扫描
 * const videoElement = document.getElementById('video');
 * await scanner.startQRScanner(videoElement);
 * 
 * // 停止扫描
 * scanner.stop();
 * 
 * // 使用结束后释放资源
 * scanner.terminate();
 * ```
 */
export class IDScanner {
  private qrScanner: QRScanner;
  private barcodeScanner: BarcodeScanner;
  private idDetector: IDCardDetector;
  private ocrProcessor: OCRProcessor;
  private scanMode: 'qr' | 'barcode' | 'idcard' = 'qr';
  
  /**
   * 创建IDScanner实例
   * @param {IDScannerOptions} [options] - 配置选项
   */
  constructor(private options: IDScannerOptions = {}) {
    this.qrScanner = new QRScanner({
      ...options.qrScannerOptions,
      onScan: this.handleQRScan.bind(this),
      onError: this.handleError.bind(this)
    });
    
    this.barcodeScanner = new BarcodeScanner({
      ...options.barcodeScannerOptions,
      onScan: this.handleBarcodeScan.bind(this),
      onError: this.handleError.bind(this)
    });
    
    this.idDetector = new IDCardDetector(this.handleIDDetection.bind(this));
    this.ocrProcessor = new OCRProcessor();
  }
  
  /**
   * 初始化OCR引擎和相关资源
   * 
   * @returns {Promise<void>} 初始化完成的Promise
   * @throws 如果初始化失败，将抛出错误
   */
  async initialize(): Promise<void> {
    try {
      await this.ocrProcessor.initialize();
    } catch (error) {
      this.handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 启动二维码扫描
   * 
   * @param {HTMLVideoElement} videoElement - 用于显示相机画面的video元素
   * @returns {Promise<void>} 启动完成的Promise
   */
  async startQRScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.scanMode = 'qr';
    await this.qrScanner.start(videoElement);
  }
  
  /**
   * 启动条形码扫描
   * 
   * @param {HTMLVideoElement} videoElement - 用于显示相机画面的video元素
   * @returns {Promise<void>} 启动完成的Promise
   */
  async startBarcodeScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.scanMode = 'barcode';
    await this.barcodeScanner.start(videoElement);
  }
  
  /**
   * 启动身份证扫描识别
   * 
   * @param {HTMLVideoElement} videoElement - 用于显示相机画面的video元素
   * @returns {Promise<void>} 启动完成的Promise
   */
  async startIDCardScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.scanMode = 'idcard';
    await this.idDetector.start(videoElement);
  }
  
  /**
   * 停止当前扫描
   */
  stop(): void {
    if (this.scanMode === 'qr') {
      this.qrScanner.stop();
    } else if (this.scanMode === 'barcode') {
      this.barcodeScanner.stop();
    } else {
      this.idDetector.stop();
    }
  }
  
  /**
   * 处理二维码扫描结果
   * @private
   * @param {string} result - 扫描到的二维码内容
   */
  private handleQRScan(result: string): void {
    if (this.options.onQRCodeScanned) {
      this.options.onQRCodeScanned(result);
    }
  }
  
  /**
   * 处理条形码扫描结果
   * @private
   * @param {string} result - 扫描到的条形码内容
   */
  private handleBarcodeScan(result: string): void {
    if (this.options.onBarcodeScanned) {
      this.options.onBarcodeScanned(result);
    }
  }
  
  /**
   * 处理身份证检测结果
   * @private
   * @param {DetectionResult} result - 身份证检测结果
   */
  private async handleIDDetection(result: DetectionResult): Promise<void> {
    if (result.success && result.croppedImage) {
      try {
        const idInfo = await this.ocrProcessor.processIDCard(result.croppedImage);
        
        // 使用数据提取工具增强身份证信息
        const enhancedInfo = DataExtractor.enhanceIDCardInfo(idInfo);
        
        if (this.options.onIDCardScanned) {
          this.options.onIDCardScanned(enhancedInfo);
        }
      } catch (error) {
        this.handleError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  
  /**
   * 处理错误
   * @private
   * @param {Error} error - 错误对象
   */
  private handleError(error: Error): void {
    if (this.options.onError) {
      this.options.onError(error);
    } else {
      console.error('ID扫描器错误:', error);
    }
  }
  
  /**
   * 终止所有扫描并释放资源
   * 
   * @returns {Promise<void>} 资源释放完成的Promise
   */
  async terminate(): Promise<void> {
    this.stop();
    await this.ocrProcessor.terminate();
  }
}

// 导出公共API
export { Camera, QRScanner, BarcodeScanner, IDCardDetector, OCRProcessor, DataExtractor, ImageProcessor };
export type { CameraOptions, QRScannerOptions, BarcodeScannerOptions, IDCardInfo, DetectionResult }; 