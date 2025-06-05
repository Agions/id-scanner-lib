/**
 * @file 摄像头管理器
 * @description 提供摄像头控制和视频流管理功能
 * @module core/camera-manager
 */

import { EventEmitter } from './event-emitter';
import { Logger } from './logger';
import { ConfigManager } from './config';
import { Result } from './result';
import { CameraAccessError, DeviceError } from './errors';
import { getMediaConstraints } from '../utils';

/**
 * 摄像头设备信息
 */
export interface CameraDevice {
  /** 设备ID */
  deviceId: string;
  /** 设备标签（名称） */
  label: string;
  /** 是否为前置摄像头 */
  isFront: boolean;
}

/**
 * 摄像头状态
 */
export enum CameraStatus {
  /** 未初始化 */
  NOT_INITIALIZED = 'not_initialized',
  /** 初始化中 */
  INITIALIZING = 'initializing',
  /** 就绪 */
  READY = 'ready',
  /** 活动中 */
  ACTIVE = 'active',
  /** 暂停 */
  PAUSED = 'paused',
  /** 已停止 */
  STOPPED = 'stopped',
  /** 错误状态 */
  ERROR = 'error'
}

/**
 * 摄像头事件
 */
export enum CameraEvent {
  /** 摄像头初始化开始 */
  INITIALIZING = 'camera:initializing',
  /** 摄像头初始化完成 */
  READY = 'camera:ready',
  /** 摄像头开始 */
  START = 'camera:start',
  /** 摄像头暂停 */
  PAUSE = 'camera:pause',
  /** 摄像头恢复 */
  RESUME = 'camera:resume',
  /** 摄像头停止 */
  STOP = 'camera:stop',
  /** 摄像头错误 */
  ERROR = 'camera:error',
  /** 摄像头切换 */
  SWITCH = 'camera:switch',
  /** 媒体流轨道结束 */
  TRACK_ENDED = 'camera:track:ended',
  /** 摄像头分辨率变化 */
  RESOLUTION_CHANGE = 'camera:resolution:change',
  /** 摄像头帧处理 */
  FRAME = 'camera:frame'
}

/**
 * 摄像头初始化选项
 */
export interface CameraOptions {
  /** 目标视频元素 */
  videoElement?: HTMLVideoElement;
  /** 自动开始 */
  autoStart?: boolean;
  /** 宽度 */
  width?: number;
  /** 高度 */
  height?: number;
  /** 帧率 */
  frameRate?: number;
  /** 摄像头朝向 */
  facingMode?: 'user' | 'environment';
  /** 摄像头设备ID */
  deviceId?: string;
  /** 启用帧处理 */
  enableFrameProcessing?: boolean;
  /** 帧处理间隔(ms) */
  frameProcessingInterval?: number;
}

/**
 * 摄像头管理类
 * 提供摄像头控制和视频流管理功能
 */
export class CameraManager extends EventEmitter {
  /** 单例实例 */
  private static instance: CameraManager;
  /** 日志记录器 */
  private readonly logger: Logger;
  /** 配置管理器 */
  private readonly config: ConfigManager;
  /** 视频元素 */
  private videoElement: HTMLVideoElement | null = null;
  /** 媒体流 */
  private mediaStream: MediaStream | null = null;
  /** 摄像头状态 */
  private status: CameraStatus = CameraStatus.NOT_INITIALIZED;
  /** 可用的摄像头设备列表 */
  private devices: CameraDevice[] = [];
  /** 当前活动的摄像头设备 */
  private activeDeviceId: string | null = null;
  /** 帧处理计时器ID */
  private frameProcessingTimerId: number | null = null;
  /** 是否启用帧处理 */
  private frameProcessingEnabled: boolean = false;
  /** 帧处理间隔(ms) */
  private frameProcessingInterval: number = 100;
  /** 视频准备就绪的Promise */
  private videoReadyPromise: Promise<void> | null = null;
  /** 视频准备就绪的Promise解析函数 */
  private videoReadyResolver: (() => void) | null = null;
  /** Canvas元素，用于帧处理 */
  private canvas: HTMLCanvasElement | null = null;
  /** Canvas 2D上下文 */
  private canvasCtx: CanvasRenderingContext2D | null = null;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    super();
    this.logger = Logger.getInstance();
    this.config = ConfigManager.getInstance();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): CameraManager {
    if (!CameraManager.instance) {
      CameraManager.instance = new CameraManager();
    }
    return CameraManager.instance;
  }
  
  /**
   * 初始化摄像头
   * @param options 初始化选项
   */
  async init(options: CameraOptions = {}): Promise<Result<boolean>> {
    if (this.status !== CameraStatus.NOT_INITIALIZED && this.status !== CameraStatus.ERROR) {
      this.logger.warn('CameraManager', `Camera is already initialized with status: ${this.status}`);
      return Result.success(true);
    }
    
    this.status = CameraStatus.INITIALIZING;
    this.emit(CameraEvent.INITIALIZING);
    
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new CameraAccessError('Your browser does not support camera access');
      }
      
      // 配置视频元素
      if (options.videoElement) {
        this.setVideoElement(options.videoElement);
      } else {
        this.createVideoElement();
      }
      
      // 启用帧处理
      if (options.enableFrameProcessing !== undefined) {
        this.frameProcessingEnabled = options.enableFrameProcessing;
        
        if (options.frameProcessingInterval) {
          this.frameProcessingInterval = options.frameProcessingInterval;
        }
        
        if (this.frameProcessingEnabled) {
          this.initCanvas();
        }
      }
      
      // 加载设备列表
      await this.loadDevices();
      
      this.status = CameraStatus.READY;
      this.emit(CameraEvent.READY);
      
      // 自动开始
      if (options.autoStart) {
        const deviceId = options.deviceId || (options.facingMode === 'user' ? 
          this.getFrontCamera()?.deviceId : this.getBackCamera()?.deviceId);
        
        await this.start({
          deviceId,
          width: options.width,
          height: options.height,
          frameRate: options.frameRate,
          facingMode: options.facingMode
        });
      }
      
      return Result.success(true);
    } catch (error) {
      this.status = CameraStatus.ERROR;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('CameraManager', `Failed to initialize camera: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      
      const cameraError = error instanceof CameraAccessError ? 
        error : new CameraAccessError(errorMessage);
      
      this.emit(CameraEvent.ERROR, { error: cameraError });
      
      return Result.failure(cameraError);
    }
  }
  
  /**
   * 开始摄像头
   * @param options 摄像头选项
   */
  async start(options: {
    deviceId?: string;
    width?: number;
    height?: number;
    frameRate?: number;
    facingMode?: 'user' | 'environment';
  } = {}): Promise<Result<boolean>> {
    if (this.status === CameraStatus.ACTIVE) {
      this.logger.debug('CameraManager', 'Camera is already active');
      return Result.success(true);
    }
    
    if (this.status !== CameraStatus.READY && this.status !== CameraStatus.STOPPED && this.status !== CameraStatus.PAUSED) {
      const error = new CameraAccessError(`Camera is not ready (status: ${this.status})`);
      return Result.failure(error);
    }
    
    try {
      // 构建媒体约束
      const width = options.width || this.config.get('camera.resolution.width', 1280);
      const height = options.height || this.config.get('camera.resolution.height', 720);
      const frameRate = options.frameRate || this.config.get('camera.frameRate', 30);
      const facingMode = options.facingMode || this.config.get('camera.facingMode', 'environment');
      
      let constraints: MediaStreamConstraints;
      
      if (options.deviceId) {
        // 使用指定的设备ID
        constraints = {
          video: {
            deviceId: { exact: options.deviceId },
            width: { ideal: width },
            height: { ideal: height },
            frameRate: { ideal: frameRate }
          },
          audio: false
        };
        this.activeDeviceId = options.deviceId;
      } else {
        // 使用facingMode
        constraints = getMediaConstraints(width, height, facingMode, frameRate);
      }
      
      // 获取媒体流
      this.logger.debug('CameraManager', `Requesting camera access: ${JSON.stringify(constraints)}`);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 停止旧的媒体流
      this.stopMediaStream();
      
      // 设置新的媒体流
      this.mediaStream = stream;
      
      // 获取实际选择的设备ID
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        this.activeDeviceId = videoTrack.getSettings().deviceId || null;
        
        // 监听轨道结束事件
        videoTrack.onended = this.handleTrackEnded.bind(this);
      }
      
      // 将流连接到视频元素
      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        
        // 创建视频准备就绪Promise
        this.createVideoReadyPromise();
        
        // 开始播放
        const playPromise = this.videoElement.play();
        if (playPromise) {
          await playPromise;
        }
        
        // 等待视频准备就绪
        await this.waitForVideoReady();
        
        // 开始帧处理
        if (this.frameProcessingEnabled) {
          this.startFrameProcessing();
        }
      }
      
      this.status = CameraStatus.ACTIVE;
      this.emit(CameraEvent.START, {
        stream,
        deviceId: this.activeDeviceId,
        settings: videoTrack?.getSettings()
      });
      
      return Result.success(true);
    } catch (error) {
      this.status = CameraStatus.ERROR;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('CameraManager', `Failed to start camera: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      
      const cameraError = new CameraAccessError(errorMessage);
      this.emit(CameraEvent.ERROR, { error: cameraError });
      
      return Result.failure(cameraError);
    }
  }
  
  /**
   * 暂停摄像头
   */
  pause(): boolean {
    if (this.status !== CameraStatus.ACTIVE) {
      return false;
    }
    
    if (this.videoElement) {
      this.videoElement.pause();
    }
    
    // 暂停帧处理
    this.stopFrameProcessing();
    
    this.status = CameraStatus.PAUSED;
    this.emit(CameraEvent.PAUSE);
    
    return true;
  }
  
  /**
   * 恢复摄像头
   */
  async resume(): Promise<boolean> {
    if (this.status !== CameraStatus.PAUSED) {
      return false;
    }
    
    if (this.videoElement && this.videoElement.paused && this.mediaStream) {
      try {
        await this.videoElement.play();
        
        // 恢复帧处理
        if (this.frameProcessingEnabled) {
          this.startFrameProcessing();
        }
        
        this.status = CameraStatus.ACTIVE;
        this.emit(CameraEvent.RESUME);
        
        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.logger.error('CameraManager', `Failed to resume camera: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
        
        this.emit(CameraEvent.ERROR, { 
          error: new CameraAccessError(`Resume failed: ${errorMessage}`) 
        });
        
        return false;
      }
    }
    
    return false;
  }
  
  /**
   * 停止摄像头
   */
  stop(): boolean {
    if (this.status !== CameraStatus.ACTIVE && this.status !== CameraStatus.PAUSED) {
      return false;
    }
    
    // 停止帧处理
    this.stopFrameProcessing();
    
    // 停止视频元素
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.srcObject = null;
    }
    
    // 停止媒体流
    this.stopMediaStream();
    
    this.status = CameraStatus.STOPPED;
    this.emit(CameraEvent.STOP);
    
    return true;
  }
  
  /**
   * 切换摄像头
   */
  async switchCamera(): Promise<Result<boolean>> {
    // 确保有多个摄像头
    if (this.devices.length <= 1) {
      return Result.failure(new DeviceError('No alternative camera found'));
    }
    
    // 查找当前活动摄像头的索引
    const currentIndex = this.activeDeviceId ? 
      this.devices.findIndex(dev => dev.deviceId === this.activeDeviceId) : -1;
    
    // 获取下一个摄像头的索引
    const nextIndex = (currentIndex === -1 || currentIndex === this.devices.length - 1) ? 
      0 : currentIndex + 1;
    
    const nextDevice = this.devices[nextIndex];
    
    try {
      // 停止当前摄像头
      this.stop();
      
      // 启动新摄像头
      const result = await this.start({ deviceId: nextDevice.deviceId });
      
      if (result.isSuccess()) {
        this.emit(CameraEvent.SWITCH, {
          previousDeviceId: this.activeDeviceId,
          currentDeviceId: nextDevice.deviceId,
          isFront: nextDevice.isFront
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return Result.failure(new CameraAccessError(`Failed to switch camera: ${errorMessage}`));
    }
  }
  
  /**
   * 加载可用的摄像头设备列表
   */
  async loadDevices(): Promise<CameraDevice[]> {
    try {
      // 请求媒体设备权限
      if (!this.mediaStream) {
        // 短暂获取摄像头权限以列出设备标签
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        
        // 立即停止临时流
        tempStream.getTracks().forEach(track => track.stop());
      }
      
      // 获取设备列表
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      // 过滤出视频输入设备
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // 映射到摄像头设备
      this.devices = videoDevices.map(device => {
        // 尝试判断是前置还是后置摄像头
        let isFront = false;
        
        if (device.label.toLowerCase().includes('front') || 
            device.label.toLowerCase().includes('facetime') || 
            device.label.toLowerCase().includes('user')) {
          isFront = true;
        }
        
        return {
          deviceId: device.deviceId,
          label: device.label || `Camera ${this.devices.length + 1}`,
          isFront
        };
      });
      
      return this.devices;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('CameraManager', `Failed to load devices: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      
      throw new CameraAccessError(`Failed to load camera devices: ${errorMessage}`);
    }
  }
  
  /**
   * 获取前置摄像头
   */
  getFrontCamera(): CameraDevice | undefined {
    return this.devices.find(device => device.isFront);
  }
  
  /**
   * 获取后置摄像头
   */
  getBackCamera(): CameraDevice | undefined {
    return this.devices.find(device => !device.isFront);
  }
  
  /**
   * 获取所有摄像头设备
   */
  getDevices(): CameraDevice[] {
    return [...this.devices];
  }
  
  /**
   * 获取当前活动的设备ID
   */
  getActiveDeviceId(): string | null {
    return this.activeDeviceId;
  }
  
  /**
   * 获取当前活动的摄像头设备
   */
  getActiveDevice(): CameraDevice | undefined {
    if (!this.activeDeviceId) return undefined;
    return this.devices.find(device => device.deviceId === this.activeDeviceId);
  }
  
  /**
   * 获取当前媒体流
   */
  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }
  
  /**
   * 获取视频元素
   */
  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }
  
  /**
   * 设置视频元素
   * @param element 视频元素
   */
  setVideoElement(element: HTMLVideoElement): void {
    this.videoElement = element;
    
    // 设置视频元素属性
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true; // iOS需要
    this.videoElement.muted = true;
    
    // 如果已有流，附加到视频元素
    if (this.mediaStream && this.status === CameraStatus.ACTIVE) {
      this.videoElement.srcObject = this.mediaStream;
      this.videoElement.play().catch(error => {
        this.logger.error('CameraManager', `Failed to play video: ${error.message}`, error);
      });
    }
  }
  
  /**
   * 创建视频元素
   */
  private createVideoElement(): HTMLVideoElement {
    if (!this.videoElement) {
      this.videoElement = document.createElement('video');
      this.setVideoElement(this.videoElement);
    }
    return this.videoElement;
  }
  
  /**
   * 捕获当前画面
   * @param format 图像格式
   * @param quality 图像质量(0-1)
   */
  captureFrame(format: 'image/png' | 'image/jpeg' = 'image/jpeg', quality: number = 0.95): string | null {
    if (this.status !== CameraStatus.ACTIVE || !this.videoElement) {
      return null;
    }
    
    // 确保画布已初始化
    this.initCanvas();
    
    const video = this.videoElement;
    const canvas = this.canvas!;
    const ctx = this.canvasCtx!;
    
    // 设置画布大小与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制视频帧
    ctx.drawImage(video, 0, 0);
    
    // 返回图像数据
    return canvas.toDataURL(format, quality);
  }
  
  /**
   * 捕获帧并返回ImageData
   */
  captureFrameData(): ImageData | null {
    if (this.status !== CameraStatus.ACTIVE || !this.videoElement) {
      return null;
    }
    
    // 确保画布已初始化
    this.initCanvas();
    
    const video = this.videoElement;
    const canvas = this.canvas!;
    const ctx = this.canvasCtx!;
    
    // 设置画布大小与视频一致
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // 绘制视频帧
    ctx.drawImage(video, 0, 0);
    
    // 返回图像数据
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  
  /**
   * 获取当前状态
   */
  getStatus(): CameraStatus {
    return this.status;
  }
  
  /**
   * 检查摄像头是否活动
   */
  isActive(): boolean {
    return this.status === CameraStatus.ACTIVE;
  }
  
  /**
   * 初始化Canvas
   */
  private initCanvas(): void {
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
      this.canvasCtx = this.canvas.getContext('2d');
    }
  }
  
  /**
   * 释放资源
   */
  dispose(): void {
    this.stop();
    
    if (this.canvas) {
      this.canvas = null;
      this.canvasCtx = null;
    }
    
    this.videoElement = null;
    this.status = CameraStatus.NOT_INITIALIZED;
  }
  
  /**
   * 停止媒体流并释放轨道
   */
  private stopMediaStream(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
  }
  
  /**
   * 处理媒体流轨道结束事件
   */
  private handleTrackEnded(): void {
    this.logger.debug('CameraManager', 'Camera track ended');
    
    this.emit(CameraEvent.TRACK_ENDED);
    this.stop();
  }
  
  /**
   * 创建视频准备就绪的Promise
   */
  private createVideoReadyPromise(): void {
    this.videoReadyPromise = new Promise((resolve) => {
      this.videoReadyResolver = resolve;
      
      if (!this.videoElement) {
        resolve();
        return;
      }
      
      // 如果视频已经有足够的数据，直接解析
      if (this.videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
        resolve();
        return;
      }
      
      // 否则等待loadeddata事件
      const handleVideoReady = () => {
        if (this.videoElement) {
          this.videoElement.removeEventListener('loadeddata', handleVideoReady);
          
          // 发出分辨率变化事件
          this.emit(CameraEvent.RESOLUTION_CHANGE, {
            width: this.videoElement.videoWidth,
            height: this.videoElement.videoHeight
          });
          
          if (this.videoReadyResolver) {
            this.videoReadyResolver();
            this.videoReadyResolver = null;
          }
        }
      };
      
      this.videoElement.addEventListener('loadeddata', handleVideoReady);
    });
  }
  
  /**
   * 等待视频准备就绪
   */
  private async waitForVideoReady(): Promise<void> {
    if (this.videoReadyPromise) {
      await this.videoReadyPromise;
    }
  }
  
  /**
   * 开始帧处理
   */
  private startFrameProcessing(): void {
    if (!this.frameProcessingEnabled || this.frameProcessingTimerId !== null) {
      return;
    }
    
    this.frameProcessingTimerId = window.setInterval(() => {
      this.processFrame();
    }, this.frameProcessingInterval);
  }
  
  /**
   * 停止帧处理
   */
  private stopFrameProcessing(): void {
    if (this.frameProcessingTimerId !== null) {
      clearInterval(this.frameProcessingTimerId);
      this.frameProcessingTimerId = null;
    }
  }
  
  /**
   * 处理当前帧
   */
  private processFrame(): void {
    if (this.status !== CameraStatus.ACTIVE || !this.videoElement) {
      return;
    }
    
    try {
      const frameData = this.captureFrameData();
      if (frameData) {
        this.emit(CameraEvent.FRAME, {
          frameData,
          timestamp: Date.now(),
          width: frameData.width,
          height: frameData.height
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('CameraManager', `Frame processing error: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
    }
  }
} 