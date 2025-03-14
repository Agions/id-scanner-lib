/**
 * @file 轻量级扫描库核心
 * @description 不包含OCR功能的轻量版，只提供二维码和条形码扫描功能
 * @module IDScannerCore
 * @version 1.0.0
 * @license MIT
 */

import { QRScanner, QRScannerOptions } from './scanner/qr-scanner';
import { BarcodeScanner, BarcodeScannerOptions } from './scanner/barcode-scanner';
import { Camera, CameraOptions } from './utils/camera';
import { ImageProcessor } from './utils/image-processing';

/**
 * IDScannerCore配置选项
 */
export interface IDScannerCoreOptions {
  cameraOptions?: CameraOptions;
  qrScannerOptions?: QRScannerOptions;
  barcodeScannerOptions?: BarcodeScannerOptions;
  onQRCodeScanned?: (result: string) => void;
  onBarcodeScanned?: (result: string) => void;
  onError?: (error: Error) => void;
}

/**
 * IDScannerCore 轻量级扫描类
 * 
 * 提供二维码和条形码扫描功能，不包含OCR身份证识别功能
 */
export class IDScannerCore {
  private qrScanner: QRScanner;
  private barcodeScanner: BarcodeScanner;
  private camera: Camera;
  private scanMode: 'qr' | 'barcode' = 'qr';
  private videoElement: HTMLVideoElement | null = null;
  
  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(private options: IDScannerCoreOptions = {}) {
    this.camera = new Camera(options.cameraOptions);
    this.qrScanner = new QRScanner({
      ...options.qrScannerOptions,
      onScan: this.handleQRScan.bind(this)
    });
    this.barcodeScanner = new BarcodeScanner({
      ...options.barcodeScannerOptions,
      onScan: this.handleBarcodeScan.bind(this)
    });
  }
  
  /**
   * 初始化扫描器
   */
  async initialize(): Promise<void> {
    // 轻量版无需初始化OCR引擎
    console.log('IDScannerCore initialized');
  }
  
  /**
   * 启动二维码扫描
   * @param videoElement HTML视频元素
   */
  async startQRScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    this.scanMode = 'qr';
    await this.camera.start(videoElement);
    this.qrScanner.start(videoElement);
  }
  
  /**
   * 启动条形码扫描
   * @param videoElement HTML视频元素
   */
  async startBarcodeScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    this.scanMode = 'barcode';
    await this.camera.start(videoElement);
    this.barcodeScanner.start(videoElement);
  }
  
  /**
   * 停止扫描
   */
  stop(): void {
    if (this.scanMode === 'qr') {
      this.qrScanner.stop();
    } else if (this.scanMode === 'barcode') {
      this.barcodeScanner.stop();
    }
    this.camera.stop();
  }
  
  /**
   * 处理二维码扫描结果
   */
  private handleQRScan(result: string): void {
    if (this.options.onQRCodeScanned) {
      this.options.onQRCodeScanned(result);
    }
  }
  
  /**
   * 处理条形码扫描结果
   */
  private handleBarcodeScan(result: string): void {
    if (this.options.onBarcodeScanned) {
      this.options.onBarcodeScanned(result);
    }
  }
  
  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    if (this.options.onError) {
      this.options.onError(error);
    } else {
      console.error('IDScannerCore error:', error);
    }
  }
  
  /**
   * 释放资源
   */
  async terminate(): Promise<void> {
    this.stop();
    // 轻量版无需释放OCR资源
  }
}

// 导出相关类型和工具
export { QRScanner, QRScannerOptions } from './scanner/qr-scanner';
export { BarcodeScanner, BarcodeScannerOptions } from './scanner/barcode-scanner';
export { Camera, CameraOptions } from './utils/camera';
export { ImageProcessor } from './utils/image-processing'; 