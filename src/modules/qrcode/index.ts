/**
 * @file 二维码模块入口
 * @description 提供二维码识别和解析功能的模块入口
 * @module modules/qrcode
 */

import { BaseModule } from '../../core/base-module';
import { QRCodeResult, QRCodeModuleOptions } from './types';
import { QRCodeScanner } from './qr-code-scanner';

/**
 * 二维码模块
 * 提供二维码检测和解析功能
 */
export class QRCodeModule extends BaseModule {
  /** 模块名称 */
  public readonly name: string = 'qrcode';
  
  /** 模块配置 */
  private options: QRCodeModuleOptions;
  
  /** 二维码扫描器 */
  private scanner: QRCodeScanner;
  
  /** 最后一次扫描结果 */
  private lastScanResult?: QRCodeResult;
  
  /**
   * 构造函数
   * @param options 模块配置选项
   */
  constructor(options: QRCodeModuleOptions = {}) {
    super();
    
    this.options = {
      enabled: true,
      scanner: {
        minConfidence: 0.6,
        tryMultipleScan: true,
        returnImage: false,
        ...options.scanner
      },
      imageProcess: {
        preprocess: true,
        enhanceContrast: true,
        threshold: 128,
        ...options.imageProcess
      },
      ...options
    };
    
    // 创建扫描器
    this.scanner = new QRCodeScanner({
      minConfidence: this.options.scanner?.minConfidence,
      returnImage: this.options.scanner?.returnImage,
      imageProcess: this.options.imageProcess
    });
  }
  
  /**
   * 初始化模块
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      return;
    }
    
    this.logger.debug(this.name, '初始化二维码模块');
    
    try {
      // 初始化扫描器
      await this.scanner.initialize();
      
      this._isInitialized = true;
      this.emit('initialized');
      this.logger.debug(this.name, '二维码模块初始化完成');
    } catch (error) {
      this.logger.error(this.name, '二维码模块初始化失败', error as Error);
      throw new Error(`二维码模块初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 扫描图像中的二维码
   * @param image 图像源
   * @returns 二维码扫描结果
   */
  public async scan(
    image: ImageData | HTMLImageElement | HTMLCanvasElement
  ): Promise<QRCodeResult | undefined> {
    this.ensureInitialized();
    
    try {
      // 扫描二维码
      const scanResult = await this.scanner.scan(image);
      
      if (scanResult) {
        // 保存最后一次扫描结果
        this.lastScanResult = scanResult;
        
        // 触发事件
        this.emit('qrcode:scanned', { result: scanResult });
      }
      
      return scanResult;
    } catch (error) {
      this.logger.error(this.name, '二维码扫描失败', error as Error);
      throw new Error(`二维码扫描失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * 获取最后一次扫描结果
   */
  public getLastScanResult(): QRCodeResult | undefined {
    return this.lastScanResult;
  }
  
  /**
   * 解析二维码数据
   * @param data 二维码数据
   * @returns 解析后的数据对象
   */
  public parseQRCodeData(data: string): Record<string, any> | string {
    try {
      // 尝试解析为JSON
      return JSON.parse(data);
    } catch {
      // 不是JSON，尝试解析为URL参数
      if (data.includes('=')) {
        try {
          const params: Record<string, string> = {};
          const urlParams = new URLSearchParams(data.includes('?') ? data.split('?')[1] : data);
          
          urlParams.forEach((value, key) => {
            params[key] = value;
          });
          
          return params;
        } catch {
          // 解析URL参数失败，返回原始字符串
          return data;
        }
      }
      
      // 返回原始字符串
      return data;
    }
  }
  
  /**
   * 释放模块资源
   */
  public async dispose(): Promise<void> {
    if (!this._isInitialized) {
      return;
    }
    
    this.logger.debug(this.name, '释放二维码模块资源');
    
    try {
      // 释放扫描器资源
      await this.scanner.dispose();
      
      // 调用基类的dispose方法
      await super.dispose();
    } catch (error) {
      this.logger.error(this.name, '二维码模块资源释放失败', error as Error);
      throw new Error(`二维码模块资源释放失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// 导出类型
export * from './types'; 