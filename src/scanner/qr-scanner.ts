/**
 * @file 二维码扫描模块
 * @description 提供实时二维码扫描和识别功能
 * @module QRScanner
 */

import jsQR from 'jsqr';
import { Camera } from '../utils/camera';

/**
 * 二维码扫描器配置选项
 * 
 * @interface QRScannerOptions
 * @property {number} [scanInterval] - 扫描间隔时间(毫秒)，默认为200ms
 * @property {Function} [onScan] - 扫描成功回调函数
 * @property {Function} [onError] - 错误处理回调函数
 */
export interface QRScannerOptions {
  scanInterval?: number;
  onScan?: (result: string) => void;
  onError?: (error: Error) => void;
}

/**
 * 二维码扫描器类
 * 
 * 提供实时扫描和识别摄像头中的二维码的功能
 * 
 * @example
 * ```typescript
 * // 创建二维码扫描器
 * const qrScanner = new QRScanner({
 *   scanInterval: 100, // 每100ms扫描一次
 *   onScan: (result) => {
 *     console.log('扫描到二维码:', result);
 *   },
 *   onError: (error) => {
 *     console.error('扫描错误:', error);
 *   }
 * });
 * 
 * // 启动扫描
 * const videoElement = document.getElementById('video') as HTMLVideoElement;
 * await qrScanner.start(videoElement);
 * 
 * // 停止扫描
 * qrScanner.stop();
 * ```
 */
export class QRScanner {
  private camera: Camera;
  private scanning = false;
  private scanTimer: number | null = null;
  
  /**
   * 创建二维码扫描器实例
   * 
   * @param {QRScannerOptions} [options] - 扫描器配置选项
   */
  constructor(private options: QRScannerOptions = {}) {
    this.options = {
      scanInterval: 200,
      ...options
    };
    
    this.camera = new Camera();
  }
  
  /**
   * 启动二维码扫描
   * 
   * 初始化相机并开始连续扫描视频帧中的二维码
   * 
   * @param {HTMLVideoElement} videoElement - 用于显示相机画面的video元素
   * @returns {Promise<void>} 启动完成的Promise
   * @throws 如果无法访问相机，将通过onError回调报告错误
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    try {
      await this.camera.initialize(videoElement);
      this.scanning = true;
      this.scan();
    } catch (error) {
      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  
  /**
   * 执行一次二维码扫描
   * 
   * 内部方法，捕获当前视频帧并尝试识别其中的二维码
   * 
   * @private
   */
  private scan(): void {
    if (!this.scanning) return;
    
    const imageData = this.camera.captureFrame();
    
    if (imageData) {
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code && this.options.onScan) {
        this.options.onScan(code.data);
      }
    }
    
    this.scanTimer = window.setTimeout(() => this.scan(), this.options.scanInterval);
  }
  
  /**
   * 停止二维码扫描
   * 
   * 停止扫描循环并释放相机资源
   */
  stop(): void {
    this.scanning = false;
    
    if (this.scanTimer) {
      clearTimeout(this.scanTimer);
      this.scanTimer = null;
    }
    
    this.camera.release();
  }
} 