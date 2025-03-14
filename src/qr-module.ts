/**
 * @file 二维码和条形码扫描模块
 * @description 包含二维码和条形码扫描功能
 * @module IDScannerQR
 * @version 1.0.0
 * @license MIT
 */

import { QRScanner, QRScannerOptions } from './scanner/qr-scanner';
import { BarcodeScanner, BarcodeScannerOptions } from './scanner/barcode-scanner';
import { Camera, CameraOptions } from './utils/camera';

/**
 * 扫描模块配置选项
 */
export interface ScannerModuleOptions {
  cameraOptions?: CameraOptions;
  qrScannerOptions?: QRScannerOptions;
  barcodeScannerOptions?: BarcodeScannerOptions;
  onQRCodeScanned?: (result: string) => void;
  onBarcodeScanned?: (result: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 扫描模块类
 * 
 * 提供独立的二维码和条形码扫描功能
 */
export class ScannerModule {
  private qrScanner: QRScanner;
  private barcodeScanner: BarcodeScanner;
  private camera: Camera;
  private scanMode: 'qr' | 'barcode' | null = null;
  private videoElement: HTMLVideoElement | null = null;
  
  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(private options: ScannerModuleOptions = {}) {
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
   * 启动二维码扫描
   * @param videoElement HTML视频元素
   */
  async startQRScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.stop(); // 确保先停止可能正在运行的扫描
    
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
    this.stop(); // 确保先停止可能正在运行的扫描
    
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
    
    if (this.videoElement) {
      this.camera.stop();
    }
    
    this.scanMode = null;
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
      console.error('ScannerModule error:', error);
    }
  }
}

// 导出相关类型和工具
export { QRScanner, QRScannerOptions } from './scanner/qr-scanner';
export { BarcodeScanner, BarcodeScannerOptions } from './scanner/barcode-scanner';
export { Camera, CameraOptions } from './utils/camera'; 