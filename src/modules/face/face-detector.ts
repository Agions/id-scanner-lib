/**
 * @file 人脸检测模块
 * @description 提供人脸检测、跟踪和分析功能
 * @module modules/face/face-detector
 */

import * as tf from '@tensorflow/tfjs';
import * as faceapi from '@vladmandic/face-api';

import { BaseScannerModule, ModuleCapabilities, ModuleEvent, ModuleInitOptions, ModuleStatus, ModuleType } from '../../interfaces/scanner-module';
import { FaceDetectionOptions, FaceDetectionResult, LivenessDetectionType, Rect } from '../../interfaces/face-detection';
import { ConfigManager } from '../../core/config';
import { Logger } from '../../core/logger';
import { ResourceManager } from '../../core/resource-manager';
import { CameraManager, CameraEvent } from '../../core/camera-manager';
import { Result } from '../../core/result';
import { FaceDetectionError, FaceComparisonError, InitializationError, LivenessDetectionError, ResourceLoadError } from '../../core/errors';
import { generateUUID } from '../../utils';

/**
 * 人脸检测模型类型
 */
export enum FaceModelType {
  /** SSD MobileNet V1 模型 */
  SSD_MOBILENET = 'ssd_mobilenetv1',
  /** Tiny Face 模型 */
  TINY_FACE = 'tiny_face',
  /** MTCNN 模型 */
  MTCNN = 'mtcnn',
  /** BlazeFace 模型 */
  BLAZE_FACE = 'blazeface'
}

/**
 * 人脸检测模块配置
 */
export interface FaceDetectorConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 检测模型类型 */
  detectionModel: FaceModelType;
  /** 置信度阈值 */
  minConfidence: number;
  /** 最大检测人脸数 */
  maxFaces: number;
  /** 是否检测关键点 */
  detectLandmarks: boolean;
  /** 关键点模型类型 */
  landmarksModel: 'tiny' | '68_points';
  /** 是否检测表情 */
  detectExpressions: boolean;
  /** 是否检测年龄和性别 */
  detectAgeGender: boolean;
  /** 是否提取人脸特征向量 */
  extractEmbeddings: boolean;
  /** 人脸匹配阈值(0-1) */
  matchThreshold: number;
  /** 是否启用跟踪 */
  enableTracking: boolean;
  /** 活体检测类型 */
  livenessDetection: LivenessDetectionType | 'none';
  /** 模型路径 */
  modelPath: string;
}

/**
 * 人脸检测模块
 */
export class FaceDetector extends BaseScannerModule {
  /** 模块类型 */
  readonly type: ModuleType = ModuleType.FACE;
  
  /** 模块配置 */
  protected config: FaceDetectorConfig;
  
  /** 默认配置 */
  private static readonly DEFAULT_CONFIG: FaceDetectorConfig = {
    enabled: true,
    detectionModel: FaceModelType.SSD_MOBILENET,
    minConfidence: 0.5,
    maxFaces: 10,
    detectLandmarks: true,
    landmarksModel: 'tiny',
    detectExpressions: false,
    detectAgeGender: false,
    extractEmbeddings: false,
    matchThreshold: 0.6,
    enableTracking: false,
    livenessDetection: 'none',
    modelPath: '/models/face-api'
  };
  
  /** 模型加载状态 */
  private modelsLoaded: boolean = false;
  private loadedModels: Set<string> = new Set();
  
  /** 处理计时器ID */
  private processingTimerId: number | null = null;
  
  /** 处理间隔(ms) */
  private processingInterval: number = 100;
  
  /** 摄像头管理器 */
  private cameraManager: CameraManager;
  
  /** 配置管理器 */
  private configManager: ConfigManager;
  
  /** 资源管理器 */
  private resourceManager: ResourceManager;
  
  /** 日志记录器 */
  private logger: Logger;
  
  /** 画布元素，用于处理帧 */
  private canvas: HTMLCanvasElement;
  
  /** 画布渲染上下文 */
  private canvasCtx: CanvasRenderingContext2D | null = null;
  
  /** 最后一次检测结果 */
  private lastDetectionResult: FaceDetectionResult[] = [];
  
  /** 人脸跟踪状态 */
  private faceTrackers: Map<string, {
    trackId: string;
    lastSeen: number;
    detection: FaceDetectionResult;
    consecutiveFrames: number;
  }> = new Map();

  /** 
   * 构造函数
   * @param config 初始配置
   */
  constructor(config: Partial<FaceDetectorConfig> = {}) {
    super({ 
      enabled: true, 
      ...config 
    });
    
    this.configManager = ConfigManager.getInstance();
    this.cameraManager = CameraManager.getInstance();
    this.resourceManager = ResourceManager.getInstance();
    this.logger = Logger.getInstance();
    
    // 合并配置
    this.config = {
      ...FaceDetector.DEFAULT_CONFIG,
      ...config
    };
    
    // 创建画布
    this.canvas = document.createElement('canvas');
    this.canvasCtx = this.canvas.getContext('2d');
  }
  
  /**
   * 获取模块能力
   */
  get capabilities(): ModuleCapabilities {
    return {
      supportsVideo: true,
      supportsImage: true,
      supportsBatch: false,
      supportsRealtime: true,
      supportsWebWorker: false,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/webp']
    };
  }
  
  /**
   * 初始化模块
   * @param options 初始化选项
   */
  async initialize(options?: ModuleInitOptions): Promise<void> {
    if (this._status === ModuleStatus.INITIALIZING) {
      throw new Error('人脸检测模块正在初始化中');
    }
    
    if (this._status === ModuleStatus.READY) {
      this.logger.debug('FaceDetector', '人脸检测模块已初始化');
      return;
    }
    
    this.setStatus(ModuleStatus.INITIALIZING);
    this.emit(ModuleEvent.INIT_START);
    
    try {
      // 应用配置选项
      if (options?.config) {
        this.updateConfig(options.config);
      }
      
      // 设置调试模式
      if (options?.debug !== undefined) {
        this.debug = options.debug;
      }
      
      const modelPath = options?.modelPath || this.config.modelPath;
      
      // 加载模型
      this.logger.info('FaceDetector', `正在加载人脸检测模型，路径：${modelPath}`);
      
      // 设置模型路径
      faceapi.env.monkeyPatch({
        Canvas: HTMLCanvasElement,
        Image: HTMLImageElement,
        ImageData: ImageData,
        Video: HTMLVideoElement,
        createCanvasElement: () => document.createElement('canvas'),
        createImageElement: () => document.createElement('img')
      });
      
      // 确保TensorFlow.js已初始化
      await tf.ready();
      
      // 设置模型路径并加载模型
      await this.loadModels(modelPath);
      
      // 绑定摄像头事件
      if (options?.bindCamera) {
        this.cameraManager.on(CameraEvent.FRAME, this.handleCameraFrame.bind(this));
      }
      
      this.setStatus(ModuleStatus.READY);
      this.emit(ModuleEvent.INIT_COMPLETE);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('FaceDetector', `初始化失败: ${errorMessage}`, error as Error);
      
      this.setStatus(ModuleStatus.ERROR);
      this.emit(ModuleEvent.INIT_ERROR, { error });
      
      throw new Error(`人脸检测模块初始化失败: ${errorMessage}`);
    }
  }
  
  /**
   * 懒加载模型 - 仅在需要时加载特定模型
   * @param modelType 模型类型
   * @param modelPath 模型路径
   */
  private async lazyLoadModel(modelType: string, modelPath: string): Promise<void> {
    // 检查模型是否已加载
    const loadedModels = this.loadedModels || new Set();
    if (loadedModels.has(modelType)) {
      return;
    }

    this.logger.info('FaceDetector', `懒加载模型: ${modelType}`);

    try {
      switch (modelType) {
        case 'ssdMobilenetv1':
          await faceapi.nets.ssdMobilenetv1.loadFromUri(modelPath);
          break;
        case 'tinyFaceDetector':
          await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
          break;
        case 'faceLandmark68Net':
          await faceapi.nets.faceLandmark68Net.loadFromUri(modelPath);
          break;
        case 'faceLandmark68TinyNet':
          await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath);
          break;
        case 'faceExpressionNet':
          await faceapi.nets.faceExpressionNet.loadFromUri(modelPath);
          break;
        case 'ageGenderNet':
          await faceapi.nets.ageGenderNet.loadFromUri(modelPath);
          break;
        case 'faceRecognitionNet':
          await faceapi.nets.faceRecognitionNet.loadFromUri(modelPath);
          break;
        default:
          this.logger.warn('FaceDetector', `未知模型类型: ${modelType}`);
          return;
      }

      loadedModels.add(modelType);
      this.loadedModels = loadedModels;
      this.logger.info('FaceDetector', `模型加载完成: ${modelType}`);
    } catch (error) {
      this.logger.error('FaceDetector', `模型加载失败: ${modelType}`, error instanceof Error ? error : undefined);
      throw new ResourceLoadError(modelType, `模型加载失败: ${error}`);
    }
  }

  /**
   * 根据需求加载模型
   * @param options 检测选项
   * @param modelPath 模型路径
   */
  private async loadModelsOnDemand(options: FaceDetectionOptions, modelPath: string): Promise<void> {
    // 基础检测模型
    await this.lazyLoadModel(this.config.detectionModel, modelPath);

    // 关键点模型
    if (options.withLandmarks || this.config.detectLandmarks) {
      await this.lazyLoadModel(
        this.config.landmarksModel === '68_points' ? 'faceLandmark68Net' : 'faceLandmark68TinyNet',
        modelPath
      );
    }

    // 表情模型
    if (options.withExpressions || this.config.detectExpressions) {
      await this.lazyLoadModel('faceExpressionNet', modelPath);
    }

    // 年龄性别模型
    if (options.withAgeAndGender || this.config.detectAgeGender) {
      await this.lazyLoadModel('ageGenderNet', modelPath);
    }

    // 人脸识别模型
    if (options.withEmbedding || this.config.extractEmbeddings) {
      await this.lazyLoadModel('faceRecognitionNet', modelPath);
    }

    this.modelsLoaded = true;
  }

  /**
   * 加载人脸检测模型 (旧版 - 保留兼容性)
   * @param modelPath 模型路径
   */
  private async loadModels(modelPath: string): Promise<void> {
    await this.loadModelsOnDemand({}, modelPath);
  }
  
  /**
   * 处理图片
   * @param image 图片源
   * @param options 处理选项
   */
  async processImage(
    image: string | HTMLImageElement | HTMLCanvasElement | ImageData,
    options: FaceDetectionOptions = {}
  ): Promise<Result<FaceDetectionResult[]>> {
    this.checkInitialized();
    
    if (this._status === ModuleStatus.PROCESSING) {
      return Result.failure(new FaceDetectionError('另一个处理操作正在进行中'));
    }
    
    this.setStatus(ModuleStatus.PROCESSING);
    this.emit(ModuleEvent.PROCESS_START);

    try {
      // 懒加载所需的模型
      const modelPath = this.config.modelPath || '/models';
      await this.loadModelsOnDemand(options, modelPath);
      
      // 合并选项和配置
      const processOptions: FaceDetectionOptions = {
        minConfidence: this.config.minConfidence,
        maxFaces: this.config.maxFaces,
        withLandmarks: this.config.detectLandmarks,
        withAttributes: this.config.detectExpressions || this.config.detectAgeGender,
        withEmbedding: this.config.extractEmbeddings,
        ...options
      };
      
      // 加载图片
      let imgElement: HTMLImageElement | HTMLCanvasElement;
      
      if (typeof image === 'string') {
        imgElement = await this.loadImage(image);
      } else if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
        imgElement = image;
      } else if (image instanceof ImageData) {
        // 将ImageData转换为Canvas
        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        ctx?.putImageData(image, 0, 0);
        imgElement = canvas;
      } else {
        throw new FaceDetectionError('不支持的图像格式');
      }
      
      // 开始计时
      const startTime = Date.now();
      
      // 执行人脸检测
      const results = await this.detectFaces(imgElement, processOptions);
      
      // 计算处理时间
      const processingTime = Date.now() - startTime;
      
      this.setStatus(ModuleStatus.READY);
      this.emit(ModuleEvent.PROCESS_COMPLETE, { results, processingTime });
      
      return Result.success(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('FaceDetector', `图片处理失败: ${errorMessage}`, error as Error);
      
      this.setStatus(ModuleStatus.ERROR);
      this.emit(ModuleEvent.PROCESS_ERROR, { error });
      
      return Result.failure(new FaceDetectionError(`图片处理失败: ${errorMessage}`));
    }
  }
  
  /**
   * 开始实时处理
   * @param videoElement 视频元素
   * @param options 处理选项
   */
  async startRealtime(
    videoElement?: HTMLVideoElement,
    options: FaceDetectionOptions = {}
  ): Promise<Result<boolean>> {
    this.checkInitialized();
    
    if (this._status === ModuleStatus.PROCESSING) {
      return Result.failure(new FaceDetectionError('实时处理已在进行中'));
    }
    
    try {
      // 停止现有处理
      this.stopRealtime();
      
      // 获取视频元素
      const video = videoElement || this.cameraManager.getVideoElement();
      
      if (!video) {
        throw new FaceDetectionError('未提供视频元素且摄像头未初始化');
      }
      
      // 如果视频未播放，尝试启动摄像头
      if (!this.cameraManager.isActive() && !videoElement) {
        const cameraResult = await this.cameraManager.init({ autoStart: true });
        if (!cameraResult.isSuccess()) {
          throw new Error('无法启动摄像头');
        }
      }
      
      // 设置处理间隔
      this.processingInterval = options.processingInterval || 100;
      
      // 设置状态
      this.setStatus(ModuleStatus.PROCESSING);
      
      // 启动处理循环
      this.processingTimerId = window.setInterval(() => {
        this.processVideoFrame(video, options);
      }, this.processingInterval);
      
      return Result.success(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('FaceDetector', `启动实时处理失败: ${errorMessage}`, error as Error);
      
      this.setStatus(ModuleStatus.ERROR);
      
      return Result.failure(new FaceDetectionError(`启动实时处理失败: ${errorMessage}`));
    }
  }
  
  /**
   * 停止实时处理
   */
  stopRealtime(): void {
    if (this.processingTimerId !== null) {
      window.clearInterval(this.processingTimerId);
      this.processingTimerId = null;
    }
    
    if (this._status === ModuleStatus.PROCESSING) {
      this.setStatus(ModuleStatus.READY);
    }
    
    // 清除人脸跟踪状态
    this.faceTrackers.clear();
    this.lastDetectionResult = [];
  }
  
  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    // 停止实时处理
    this.stopRealtime();
    
    // 释放模型
    if (this.modelsLoaded) {
      try {
        await faceapi.tf.dispose();
        this.modelsLoaded = false;
      } catch (error) {
        this.logger.error('FaceDetector', `释放模型失败: ${error}`);
      }
    }
    
    // 移除事件监听
    this.cameraManager.off(CameraEvent.FRAME, this.handleCameraFrame.bind(this));
    
    this._status = ModuleStatus.NOT_INITIALIZED;
  }
  
  /**
   * 加载图片
   * @param src 图片URL
   */
  private async loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`无法加载图片: ${src}`));
      img.src = src;
    });
  }
  
  /**
   * 处理视频帧
   * @param video 视频元素
   * @param options 处理选项
   */
  private async processVideoFrame(
    video: HTMLVideoElement,
    options: FaceDetectionOptions = {}
  ): Promise<void> {
    if (this._status !== ModuleStatus.PROCESSING || !video || video.paused || video.ended) {
      return;
    }
    
    try {
      // 检查视频是否准备好
      if (video.readyState < 2) { // HAVE_CURRENT_DATA
        return;
      }
      
      // 检查视频尺寸
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }
      
      // 调整画布大小
      if (this.canvas.width !== video.videoWidth || this.canvas.height !== video.videoHeight) {
        this.canvas.width = video.videoWidth;
        this.canvas.height = video.videoHeight;
      }
      
      // 将视频帧绘制到画布
      if (this.canvasCtx) {
        this.canvasCtx.drawImage(video, 0, 0);
      }
      
      // 执行人脸检测
      const startTime = Date.now();
      const results = await this.detectFaces(video, options);
      const processingTime = Date.now() - startTime;
      
      // 更新最后的检测结果
      this.lastDetectionResult = results;
      
      // 发出实时结果事件
      this.emit(ModuleEvent.REALTIME_RESULT, { 
        results, 
        processingTime,
        timestamp: Date.now() 
      });
    } catch (error) {
      this.logger.error('FaceDetector', `处理视频帧失败: ${error}`);
    }
  }
  
  /**
   * 处理摄像头帧
   */
  private handleCameraFrame(event: any): void {
    if (this._status !== ModuleStatus.PROCESSING || !event.frameData) {
      return;
    }
    
    const { frameData } = event;
    
    // 调整画布大小
    if (this.canvas.width !== frameData.width || this.canvas.height !== frameData.height) {
      this.canvas.width = frameData.width;
      this.canvas.height = frameData.height;
    }
    
    // 将帧数据绘制到画布
    if (this.canvasCtx) {
      this.canvasCtx.putImageData(frameData, 0, 0);
      
      // 执行人脸检测
      this.detectFaces(this.canvas).then(results => {
        // 更新最后的检测结果
        this.lastDetectionResult = results;
        
        // 发出实时结果事件
        this.emit(ModuleEvent.REALTIME_RESULT, { 
          results, 
          timestamp: Date.now() 
        });
      }).catch(error => {
        this.logger.error('FaceDetector', `处理摄像头帧失败: ${error}`);
      });
    }
  }
  
  /**
   * 执行人脸检测
   * @param input 输入图像
   * @param options 检测选项
   */
  private async detectFaces(
    input: HTMLImageElement | HTMLCanvasElement | HTMLVideoElement,
    options: FaceDetectionOptions = {}
  ): Promise<FaceDetectionResult[]> {
    try {
      // 检查模型是否已加载
      if (!this.modelsLoaded) {
        throw new FaceDetectionError('人脸检测模型尚未加载');
      }
      
      // 合并选项和配置
      const detectOptions: FaceDetectionOptions = {
        minConfidence: this.config.minConfidence,
        maxFaces: this.config.maxFaces,
        withLandmarks: this.config.detectLandmarks,
        withAttributes: this.config.detectExpressions || this.config.detectAgeGender,
        withEmbedding: this.config.extractEmbeddings,
        enableTracking: this.config.enableTracking,
        ...options
      };
      
      // 创建检测选项
      let faceapiOptions;
      
      switch (this.config.detectionModel) {
        case FaceModelType.SSD_MOBILENET:
          faceapiOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: detectOptions.minConfidence });
          break;
        case FaceModelType.TINY_FACE:
          faceapiOptions = new faceapi.TinyFaceDetectorOptions({ scoreThreshold: detectOptions.minConfidence });
          break;
        case FaceModelType.MTCNN:
          faceapiOptions = new faceapi.MtcnnOptions({ minConfidence: detectOptions.minConfidence });
          break;
        default:
          faceapiOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: detectOptions.minConfidence });
      }
      
      // 进行检测
      let detections;
      const startTime = Date.now();
      
      if (detectOptions.withLandmarks && detectOptions.withAttributes && detectOptions.withEmbedding) {
        // 全功能检测
        detections = await faceapi
          .detectAllFaces(input, faceapiOptions)
          .withFaceLandmarks(this.config.landmarksModel === 'tiny')
          .withFaceExpressions()
          .withAgeAndGender()
          .withFaceDescriptors();
      } else if (detectOptions.withLandmarks && detectOptions.withAttributes) {
        // 检测带关键点和属性
        detections = await faceapi
          .detectAllFaces(input, faceapiOptions)
          .withFaceLandmarks(this.config.landmarksModel === 'tiny')
          .withFaceExpressions()
          .withAgeAndGender();
      } else if (detectOptions.withLandmarks) {
        // 检测带关键点
        detections = await faceapi
          .detectAllFaces(input, faceapiOptions)
          .withFaceLandmarks(this.config.landmarksModel === 'tiny');
      } else {
        // 仅检测
        detections = await faceapi.detectAllFaces(input, faceapiOptions);
      }
      
      // 限制检测数量
      const maxFaces = detectOptions.maxFaces || this.config.maxFaces;
      if ((detections as any).length > maxFaces) {
        detections = (detections as any).slice(0, maxFaces);
      }
      
      // 将结果转换为标准格式
      const results: FaceDetectionResult[] = [];
      const processingTime = Date.now() - startTime;
      
      for (const detection of detections) {
        const boundingBox: Rect = {
          x: detection.detection?.box.x || 0,
          y: detection.detection?.box.y || 0,
          width: detection.detection?.box.width || 0,
          height: detection.detection?.box.height || 0
        };
        
        // 创建基本结果
        const result: FaceDetectionResult = {
          id: generateUUID(),
          type: 'face',
          boundingBox,
          confidence: detection.detection?.score || 0,
          processingTime,
          timestamp: Date.now()
        };
        
        // 添加关键点
        if (detection.landmarks) {
          const positions = detection.landmarks.positions;
          const leftEyeIdx = 36; // 面部68点模型中左眼的索引
          const rightEyeIdx = 45; // 面部68点模型中右眼的索引
          const noseIdx = 30; // 鼻尖
          const mouthIdx = 57; // 嘴巴中心
          
          result.landmarks = {
            leftEye: {
              x: positions[leftEyeIdx].x,
              y: positions[leftEyeIdx].y
            },
            rightEye: {
              x: positions[rightEyeIdx].x,
              y: positions[rightEyeIdx].y
            },
            nose: {
              x: positions[noseIdx].x,
              y: positions[noseIdx].y
            },
            mouth: {
              x: positions[mouthIdx].x,
              y: positions[mouthIdx].y
            },
            points: positions.map((p: { x: any; y: any; }) => ({ x: p.x, y: p.y }))
          };
        }
        
        // 添加表情属性
        if (detection.expressions) {
          result.attributes = {
            emotion: {
              angry: detection.expressions.angry,
              disgust: detection.expressions.disgusted,
              fear: detection.expressions.fearful,
              happy: detection.expressions.happy,
              neutral: detection.expressions.neutral,
              sad: detection.expressions.sad,
              surprise: detection.expressions.surprised
            }
          };
        }
        
        // 添加年龄和性别
        if (detection.age !== undefined) {
          result.attributes = {
            ...result.attributes,
            age: detection.age
          };
        }
        
        if (detection.gender !== undefined && detection.genderProbability !== undefined) {
          result.attributes = {
            ...result.attributes,
            gender: detection.gender === 'male' ? detection.genderProbability : 1 - detection.genderProbability
          };
        }
        
        // 添加特征向量
        if (detection.descriptor) {
          result.embedding = {
            vector: Array.from(detection.descriptor),
            dimension: detection.descriptor.length
          };
        }
        
        // 处理人脸跟踪
        if (detectOptions.enableTracking) {
          const trackId = this.trackFace(result);
          if (trackId) {
            result.trackId = trackId;
          }
        }
        
        results.push(result);
      }
      
      return results;
    } catch (error) {
      this.logger.error('FaceDetector', `人脸检测失败: ${error}`);
      throw new FaceDetectionError(`人脸检测失败: ${error}`);
    }
  }
  
  /**
   * 跟踪人脸
   * @param detection 人脸检测结果
   */
  private trackFace(detection: FaceDetectionResult): string {
    const now = Date.now();
    const box = detection.boundingBox;
    const boxCenter = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2
    };
    
    // 查找最匹配的跟踪器
    let bestMatchId: string | null = null;
    let bestMatchScore = Number.MAX_VALUE;
    
    // 清理过期的跟踪器
    const expireTime = 1000; // 1秒未检测到则过期
    for (const [id, tracker] of this.faceTrackers) {
      if (now - tracker.lastSeen > expireTime) {
        this.faceTrackers.delete(id);
      }
    }
    
    // 查找最佳匹配
    for (const [id, tracker] of this.faceTrackers) {
      const trackerBox = tracker.detection.boundingBox;
      const trackerCenter = {
        x: trackerBox.x + trackerBox.width / 2,
        y: trackerBox.y + trackerBox.height / 2
      };
      
      // 计算中心点距离
      const distance = Math.sqrt(
        Math.pow(boxCenter.x - trackerCenter.x, 2) +
        Math.pow(boxCenter.y - trackerCenter.y, 2)
      );
      
      // 计算大小差异
      const sizeDiff = Math.abs(
        (box.width * box.height) - (trackerBox.width * trackerBox.height)
      ) / (box.width * box.height);
      
      // 计算综合匹配分数
      const score = distance * 0.7 + sizeDiff * 0.3;
      
      // 找到最佳匹配
      if (score < bestMatchScore && score < 0.3 * Math.max(box.width, box.height)) {
        bestMatchScore = score;
        bestMatchId = id;
      }
    }
    
    if (bestMatchId) {
      // 更新现有跟踪器
      const tracker = this.faceTrackers.get(bestMatchId)!;
      tracker.lastSeen = now;
      tracker.detection = detection;
      tracker.consecutiveFrames++;
      return bestMatchId;
    } else {
      // 创建新的跟踪器
      const trackId = generateUUID();
      this.faceTrackers.set(trackId, {
        trackId,
        lastSeen: now,
        detection,
        consecutiveFrames: 1
      });
      return trackId;
    }
  }
  
  /**
   * 比对两个人脸
   * @param source 源人脸
   * @param target 目标人脸
   */
  async compareFaces(
    source: string | HTMLImageElement | FaceDetectionResult,
    target: string | HTMLImageElement | FaceDetectionResult
  ): Promise<Result<{ similarity: number; isMatch: boolean; threshold: number }>> {
    this.checkInitialized();
    
    try {
      // 获取源人脸的特征向量
      let sourceEmbedding: number[];
      
      if (typeof source === 'string' || source instanceof HTMLImageElement) {
        // 处理图片源
        const result = await this.processImage(source, { withEmbedding: true });
        if (!result.isSuccess() || !result.data || result.data.length === 0) {
          throw new FaceComparisonError('无法从源图像检测人脸');
        }
        if (!result.data[0].embedding) {
          throw new FaceComparisonError('源图像未提取特征向量');
        }
        sourceEmbedding = result.data[0].embedding.vector;
      } else {
        // 使用现有检测结果
        if (!source.embedding || !source.embedding.vector) {
          throw new FaceComparisonError('源人脸未提取特征向量');
        }
        sourceEmbedding = source.embedding.vector;
      }
      
      // 获取目标人脸的特征向量
      let targetEmbedding: number[];
      
      if (typeof target === 'string' || target instanceof HTMLImageElement) {
        // 处理图片源
        const result = await this.processImage(target, { withEmbedding: true });
        if (!result.isSuccess() || !result.data || result.data.length === 0) {
          throw new FaceComparisonError('无法从目标图像检测人脸');
        }
        if (!result.data[0].embedding) {
          throw new FaceComparisonError('目标图像未提取特征向量');
        }
        targetEmbedding = result.data[0].embedding.vector;
      } else {
        // 使用现有检测结果
        if (!target.embedding || !target.embedding.vector) {
          throw new FaceComparisonError('目标人脸未提取特征向量');
        }
        targetEmbedding = target.embedding.vector;
      }
      
      // 计算相似度
      const similarity = this.calculateSimilarity(sourceEmbedding, targetEmbedding);
      const threshold = this.config.matchThreshold;
      const isMatch = similarity >= threshold;
      
      return Result.success({
        similarity,
        isMatch,
        threshold
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('FaceDetector', `人脸比对失败: ${errorMessage}`, error as Error);
      
      return Result.failure(new FaceComparisonError(`人脸比对失败: ${errorMessage}`));
    }
  }
  
  /**
   * 计算两个特征向量的余弦相似度
   * @param v1 特征向量1
   * @param v2 特征向量2
   */
  private calculateSimilarity(v1: number[], v2: number[]): number {
    if (v1.length !== v2.length) {
      throw new Error('特征向量维度不匹配');
    }
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < v1.length; i++) {
      dotProduct += v1[i] * v2[i];
      norm1 += v1[i] * v1[i];
      norm2 += v2[i] * v2[i];
    }
    
    // 确保长度非零
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }
  
  /**
   * 获取最近的检测结果
   */
  getLatestResults(): FaceDetectionResult[] {
    return [...this.lastDetectionResult];
  }
} 