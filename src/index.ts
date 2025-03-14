/**
 * @file ID扫描识别库主入口文件
 * @description 提供身份证识别与二维码、条形码扫描功能的纯前端TypeScript库
 * @module IDScannerLib
 * @version 1.0.0
 * @license MIT
 */

import { Camera, CameraOptions } from './utils/camera';
import { IDCardInfo, DetectionResult } from './utils/types';

// 先只导入类型定义，不导入实际实现
import type { QRScannerOptions } from './scanner/qr-scanner';
import type { BarcodeScannerOptions } from './scanner/barcode-scanner';

/**
 * IDScanner配置选项接口
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
 * 使用动态导入实现按需加载
 */
export class IDScanner {
  private camera: Camera;
  private scanMode: 'qr' | 'barcode' | 'idcard' = 'qr';
  private videoElement: HTMLVideoElement | null = null;
  
  // 延迟加载的模块
  private qrModule: any = null;
  private ocrModule: any = null;
  
  // 模块加载状态
  private isQRModuleLoaded: boolean = false;
  private isOCRModuleLoaded: boolean = false;
  
  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(private options: IDScannerOptions = {}) {
    this.camera = new Camera(options.cameraOptions);
  }
  
  /**
   * 初始化模块
   * 根据需要初始化OCR引擎
   */
  async initialize(): Promise<void> {
    try {
      // 预加载OCR模块但不初始化
      if (!this.isOCRModuleLoaded) {
        // 动态导入OCR模块
        const OCRModule = await import('./ocr-module').then(m => m.OCRModule);
        this.ocrModule = new OCRModule({
          cameraOptions: this.options.cameraOptions,
          onIDCardScanned: this.options.onIDCardScanned,
          onError: this.options.onError
        });
        this.isOCRModuleLoaded = true;
        
        // 初始化OCR模块
        await this.ocrModule.initialize();
      }
      
      console.log('IDScanner initialized');
    } catch (error) {
      this.handleError(error as Error);
      throw error;
    }
  }
  
  /**
   * 启动二维码扫描
   * @param videoElement HTML视频元素
   */
  async startQRScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.stop();
    this.videoElement = videoElement;
    this.scanMode = 'qr';
    
    try {
      // 动态加载二维码模块
      if (!this.isQRModuleLoaded) {
        const ScannerModule = await import('./qr-module').then(m => m.ScannerModule);
        this.qrModule = new ScannerModule({
          cameraOptions: this.options.cameraOptions,
          qrScannerOptions: this.options.qrScannerOptions,
          barcodeScannerOptions: this.options.barcodeScannerOptions,
          onQRCodeScanned: this.options.onQRCodeScanned,
          onBarcodeScanned: this.options.onBarcodeScanned,
          onError: this.options.onError
        });
        this.isQRModuleLoaded = true;
      }
      
      await this.qrModule.startQRScanner(videoElement);
    } catch (error) {
      this.handleError(error as Error);
    }
  }
  
  /**
   * 启动条形码扫描
   * @param videoElement HTML视频元素
   */
  async startBarcodeScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.stop();
    this.videoElement = videoElement;
    this.scanMode = 'barcode';
    
    try {
      // 动态加载二维码模块
      if (!this.isQRModuleLoaded) {
        const ScannerModule = await import('./qr-module').then(m => m.ScannerModule);
        this.qrModule = new ScannerModule({
          cameraOptions: this.options.cameraOptions,
          qrScannerOptions: this.options.qrScannerOptions,
          barcodeScannerOptions: this.options.barcodeScannerOptions,
          onQRCodeScanned: this.options.onQRCodeScanned,
          onBarcodeScanned: this.options.onBarcodeScanned,
          onError: this.options.onError
        });
        this.isQRModuleLoaded = true;
      }
      
      await this.qrModule.startBarcodeScanner(videoElement);
    } catch (error) {
      this.handleError(error as Error);
    }
  }
  
  /**
   * 启动身份证扫描
   * @param videoElement HTML视频元素
   */
  async startIDCardScanner(videoElement: HTMLVideoElement): Promise<void> {
    this.stop();
    this.videoElement = videoElement;
    this.scanMode = 'idcard';
    
    try {
      // 检查OCR模块是否已加载，若未加载则自动初始化
      if (!this.isOCRModuleLoaded) {
        await this.initialize();
      }
      
      await this.ocrModule.startIDCardScanner(videoElement);
    } catch (error) {
      this.handleError(error as Error);
    }
  }
  
  /**
   * 停止扫描
   */
  stop(): void {
    if (this.scanMode === 'qr' || this.scanMode === 'barcode') {
      if (this.qrModule) {
        this.qrModule.stop();
      }
    } else if (this.scanMode === 'idcard') {
      if (this.ocrModule) {
        this.ocrModule.stop();
      }
    }
  }
  
  /**
   * 处理错误
   */
  private handleError(error: Error): void {
    if (this.options.onError) {
      this.options.onError(error);
    } else {
      console.error('IDScanner error:', error);
    }
  }
  
  /**
   * 释放资源
   */
  async terminate(): Promise<void> {
    this.stop();
    
    // 释放OCR资源
    if (this.isOCRModuleLoaded && this.ocrModule) {
      await this.ocrModule.terminate();
      this.ocrModule = null;
      this.isOCRModuleLoaded = false;
    }
    
    // 释放QR扫描资源
    if (this.isQRModuleLoaded && this.qrModule) {
      this.qrModule = null;
      this.isQRModuleLoaded = false;
    }
  }
}

// 导出核心类型
export { IDCardInfo } from './utils/types';
export { CameraOptions } from './utils/camera'; 