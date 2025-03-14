/**
 * @file ID扫描识别库UMD格式入口文件
 * @description 专门为UMD格式构建的入口，使用静态导入而非动态导入
 * @module IDScannerLib
 * @version 1.1.0
 * @license MIT
 */

import { Camera, CameraOptions } from './utils/camera';
import { IDCardInfo, DetectionResult } from './utils/types';
import type { QRScannerOptions } from './scanner/qr-scanner';
import type { BarcodeScannerOptions } from './scanner/barcode-scanner';

// 静态导入所有依赖
import { QRScanner } from './scanner/qr-scanner';
import { BarcodeScanner } from './scanner/barcode-scanner';
import { IDCardDetector } from './id-recognition/id-detector';
import { OCRProcessor } from './id-recognition/ocr-processor';
import { DataExtractor } from './id-recognition/data-extractor';
import { ImageProcessor } from './utils/image-processing';

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
 * UMD版本使用静态导入实现
 */
export class IDScanner {
  private camera: Camera;
  private qrScanner: QRScanner | null = null;
  private barcodeScanner: BarcodeScanner | null = null;
  private idDetector: IDCardDetector | null = null;
  private ocrProcessor: OCRProcessor | null = null;
  private dataExtractor: DataExtractor | null = null;
  private scanMode: 'qr' | 'barcode' | 'idcard' = 'qr';
  private videoElement: HTMLVideoElement | null = null;
  
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
      // 初始化OCR模块
      this.ocrProcessor = new OCRProcessor();
      this.dataExtractor = new DataExtractor();
      await this.ocrProcessor.initialize();
      
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
      if (!this.qrScanner) {
        this.qrScanner = new QRScanner({
          ...this.options.qrScannerOptions,
          onScan: this.handleQRScan.bind(this)
        });
      }
      
      await this.camera.start(videoElement);
      this.qrScanner.start(videoElement);
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
      if (!this.barcodeScanner) {
        this.barcodeScanner = new BarcodeScanner({
          ...this.options.barcodeScannerOptions,
          onScan: this.handleBarcodeScan.bind(this)
        });
      }
      
      await this.camera.start(videoElement);
      this.barcodeScanner.start(videoElement);
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
      if (!this.ocrProcessor) {
        await this.initialize();
      }
      
      if (!this.idDetector) {
        this.idDetector = new IDCardDetector({
          onDetection: this.handleIDDetection.bind(this),
          onError: this.handleError.bind(this)
        });
      }
      
      await this.camera.start(videoElement);
      this.idDetector.start(videoElement);
    } catch (error) {
      this.handleError(error as Error);
    }
  }
  
  /**
   * 停止扫描
   */
  stop(): void {
    if (this.scanMode === 'qr' && this.qrScanner) {
      this.qrScanner.stop();
    } else if (this.scanMode === 'barcode' && this.barcodeScanner) {
      this.barcodeScanner.stop();
    } else if (this.scanMode === 'idcard' && this.idDetector) {
      this.idDetector.stop();
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
   * 处理身份证检测结果
   */
  private async handleIDDetection(result: DetectionResult): Promise<void> {
    if (!this.ocrProcessor || !this.dataExtractor) return;
    
    try {
      const idCardInfo = await this.ocrProcessor.processIDCard(result.imageData);
      const extractedInfo = this.dataExtractor.extractAndValidate(idCardInfo);
      
      if (this.options.onIDCardScanned) {
        this.options.onIDCardScanned(extractedInfo);
      }
    } catch (error) {
      this.handleError(error as Error);
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
    
    if (this.ocrProcessor) {
      await this.ocrProcessor.terminate();
      this.ocrProcessor = null;
    }
    
    this.qrScanner = null;
    this.barcodeScanner = null;
    this.idDetector = null;
    this.dataExtractor = null;
  }
}

// 导出核心类型
export { IDCardInfo } from './utils/types';
export { CameraOptions } from './utils/camera';
export { QRScanner, BarcodeScanner, IDCardDetector, OCRProcessor, DataExtractor, ImageProcessor }; 