/**
 * @file 主入口文件
 * @description ID Scanner库的主入口点，提供统一的API和模块导出
 * @module index
 */

import { ModuleManager } from './core/module-manager';
import { IDCardModule } from './modules/id-card';
import { QRCodeModule } from './modules/qrcode';
import { FaceModule } from './modules/face';
import { VERSION, BUILD_DATE } from './version';
import { Logger, LogLevel } from './core/logger';
import { IDCardModuleOptions } from './modules/id-card/types';
import { QRCodeModuleOptions } from './modules/qrcode/types';
import { FaceModuleOptions } from './modules/face/types';

/**
 * IDScanner配置选项
 */
export interface IDScannerOptions {
  /** 日志级别 */
  logLevel?: LogLevel;
  /** 是否启用身份证识别模块 */
  enableIDCard?: boolean;
  /** 是否启用二维码识别模块 */
  enableQRCode?: boolean;
  /** 是否启用人脸识别模块 */
  enableFace?: boolean;
  /** 身份证模块配置 */
  idCard?: IDCardModuleOptions;
  /** 二维码模块配置 */
  qrCode?: QRCodeModuleOptions;
  /** 人脸识别模块配置 */
  face?: FaceModuleOptions;
}

/**
 * IDScanner类
 * 提供整合的身份证、二维码和人脸识别功能
 */
export class IDScanner {
  /** 版本号 */
  public static readonly VERSION = VERSION;
  /** 构建日期 */
  public static readonly BUILD_DATE = BUILD_DATE;
  
  /** 模块管理器 */
  private moduleManager: ModuleManager;
  /** 是否已经初始化 */
  private initialized = false;
  /** 日志工具 */
  private logger: Logger;
  
  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options: IDScannerOptions = {}) {
    // 配置日志级别
    this.logger = Logger.getInstance();
    if (options.logLevel !== undefined) {
      this.logger.setLevel(options.logLevel);
    }
    
    this.moduleManager = ModuleManager.getInstance();
    
    // 注册模块
    if (options.enableIDCard !== false) {
      this.moduleManager.register(new IDCardModule(options.idCard));
    }
    
    if (options.enableQRCode !== false) {
      this.moduleManager.register(new QRCodeModule(options.qrCode));
    }
    
    if (options.enableFace !== false) {
      this.moduleManager.register(new FaceModule(options.face));
    }
  }

  /**
   * 初始化库
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info('IDScanner', `初始化 IDScanner v${VERSION}`);

    try {
      // 初始化所有模块
      await this.moduleManager.initialize();

      this.initialized = true;
      this.logger.info('IDScanner', 'IDScanner初始化完成');
    } catch (error) {
      this.logger.error('IDScanner', 'IDScanner初始化失败', error as Error);
      throw new Error(`IDScanner初始化失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 获取身份证模块实例
   * @returns 身份证模块
   */
  public getIDCardModule(): IDCardModule | undefined {
    return this.moduleManager.getModule<IDCardModule>('id-card');
  }
  
  /**
   * 获取二维码模块实例
   * @returns 二维码模块
   */
  public getQRCodeModule(): QRCodeModule | undefined {
    return this.moduleManager.getModule<QRCodeModule>('qrcode');
  }
  
  /**
   * 获取人脸识别模块实例
   * @returns 人脸识别模块
   */
  public getFaceModule(): FaceModule | undefined {
    return this.moduleManager.getModule<FaceModule>('face');
  }
  
  /**
   * 释放所有资源
   */
  public async dispose(): Promise<void> {
    if (!this.initialized) {
      return;
        }
    
    this.logger.info('IDScanner', '释放IDScanner资源');
    
    try {
      await this.moduleManager.dispose();
      
      this.initialized = false;
      this.logger.info('IDScanner', 'IDScanner资源已释放');
    } catch (error) {
      this.logger.error('IDScanner', 'IDScanner资源释放失败', error as Error);
      throw new Error(`IDScanner资源释放失败: ${error instanceof Error ? error.message : String(error)}`);
  }
  }
}

// 导出核心模块
export * from './core/module-manager';
export * from './core/logger';
export * from './core/errors';

// 导出功能模块 (明确导出以避免命名冲突)
export { IDCardModule } from './modules/id-card';
export { QRCodeModule } from './modules/qrcode';
export { FaceModule } from './modules/face';

// 导出类型
export * from './utils/types';
export { IDCardModuleOptions, IDCardInfo, IDCardType, IDCardVerificationResult } from './modules/id-card/types';
export { QRCodeModuleOptions, QRCodeResult } from './modules/qrcode/types';
export { FaceModuleOptions, FaceDetectionResult, FaceComparisonResult } from './modules/face/types';

// 默认导出IDScanner类
export default IDScanner;
