/**
 * @file 活体检测模块
 * @description 提供人脸活体检测功能
 * @module modules/face/liveness-detector
 */

import { BaseScannerModule, ModuleCapabilities, ModuleEvent, ModuleInitOptions, ModuleStatus, ModuleType } from '../../interfaces/scanner-module';
import { FaceDetectionOptions, FaceDetectionResult, LivenessAction, LivenessDetectionResult, LivenessDetectionType, LivenessSession, Point } from '../../interfaces/face-detection';
import { ConfigManager } from '../../core/config';
import { Logger } from '../../core/logger';
import { ResourceManager } from '../../core/resource-manager';
import { CameraManager, CameraEvent } from '../../core/camera-manager';
import { Result } from '../../core/result';
import { FaceDetector } from './face-detector';
import { InitializationError, LivenessDetectionError } from '../../core/errors';
import { debounce, generateUUID } from '../../utils';

/**
 * 眨眼检测阈值配置
 */
interface BlinkThresholds {
  /** 眼睛闭合阈值 */
  eyeClosedThreshold: number;
  /** 眼睛张开阈值 */
  eyeOpenThreshold: number;
  /** 检测阈值 */
  detectionThreshold: number;
}

/**
 * 活体检测器配置
 */
export interface LivenessDetectorConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 检测类型 */
  detectionType: LivenessDetectionType;
  /** 检测置信度阈值 */
  confidenceThreshold: number;
  /** 眨眼检测阈值 */
  blinkThresholds: BlinkThresholds;
  /** 活体挑战超时(毫秒) */
  challengeTimeout: number;
  /** 活体挑战动作 */
  challengeActions: LivenessAction[];
}

/**
 * 活体检测模块
 * 提供人脸活体检测功能，支持被动式和主动式活体检测
 */
export class LivenessDetector extends BaseScannerModule {
  /** 模块类型 */
  readonly type: ModuleType = ModuleType.FACE;
  
  /** 模块配置 */
  protected config: LivenessDetectorConfig;
  
  /** 默认配置 */
  private static readonly DEFAULT_CONFIG: LivenessDetectorConfig = {
    enabled: true,
    detectionType: LivenessDetectionType.PASSIVE,
    confidenceThreshold: 0.7,
    blinkThresholds: {
      eyeClosedThreshold: 0.23,
      eyeOpenThreshold: 0.30,
      detectionThreshold: 0.85
    },
    challengeTimeout: 30000, // 30秒
    challengeActions: [
      LivenessAction.BLINK,
      LivenessAction.NOD,
      LivenessAction.SMILE
    ]
  };
  
  /** 配置管理器 */
  private configManager: ConfigManager;
  
  /** 日志记录器 */
  private logger: Logger;
  
  /** 资源管理器 */
  private resourceManager: ResourceManager;
  
  /** 摄像头管理器 */
  private cameraManager: CameraManager;
  
  /** 人脸检测器 */
  private faceDetector: FaceDetector;
  
  /** 当前活体会话 */
  private currentSession: LivenessSession | null = null;
  
  /** 检测历史记录，用于分析眨眼等动作 */
  private detectionHistory: Array<{
    timestamp: number;
    eyeState: 'open' | 'closed' | 'unknown';
    faceResult: FaceDetectionResult;
  }> = [];
  
  /** 最大历史记录长度 */
  private readonly MAX_HISTORY_LENGTH = 30;
  
  /** 防抖处理函数 */
  private debouncedProcessFrame: (frameData: ImageData) => void;
  
  /**
   * 构造函数
   * @param config 初始配置
   * @param faceDetector 可选的人脸检测器实例
   */
  constructor(config: Partial<LivenessDetectorConfig> = {}, faceDetector?: FaceDetector) {
    super({ enabled: true, ...config });
    
    this.configManager = ConfigManager.getInstance();
    this.logger = Logger.getInstance();
    this.resourceManager = ResourceManager.getInstance();
    this.cameraManager = CameraManager.getInstance();
    
    // 合并配置
    this.config = {
      ...LivenessDetector.DEFAULT_CONFIG,
      ...config
    };
    
    // 使用传入或创建新的人脸检测器
    this.faceDetector = faceDetector || new FaceDetector({
      detectLandmarks: true,
      detectExpressions: true
    });
    
    // 创建防抖处理函数
    this.debouncedProcessFrame = debounce(this.processFrame.bind(this), 100);
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
      throw new Error('活体检测模块正在初始化中');
    }
    
    if (this._status === ModuleStatus.READY) {
      this.logger.debug('LivenessDetector', '活体检测模块已初始化');
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
      
      // 确保人脸检测器已初始化
      if (this.faceDetector.getStatus() !== ModuleStatus.READY) {
        await this.faceDetector.initialize(options);
      }
      
      // 监听人脸检测器结果
      this.faceDetector.on(ModuleEvent.REALTIME_RESULT, this.handleFaceDetectionResult.bind(this));
      
      // 绑定摄像头事件
      if (options?.bindCamera) {
        this.cameraManager.on(CameraEvent.FRAME, this.handleCameraFrame.bind(this));
      }
      
      this.setStatus(ModuleStatus.READY);
      this.emit(ModuleEvent.INIT_COMPLETE);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('LivenessDetector', `初始化失败: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      
      this.setStatus(ModuleStatus.ERROR);
      this.emit(ModuleEvent.INIT_ERROR, { error: error instanceof Error ? error : new Error(errorMessage) });
      
      throw new Error(`活体检测模块初始化失败: ${errorMessage}`);
    }
  }
  
  /**
   * 处理图片
   * @param image 图片源
   * @param options 处理选项
   */
  async processImage(
    image: string | HTMLImageElement | HTMLCanvasElement | ImageData,
    options: Record<string, any> = {}
  ): Promise<Result<LivenessDetectionResult>> {
    this.checkInitialized();
    
    if (this._status === ModuleStatus.PROCESSING) {
      return Result.failure(new LivenessDetectionError('另一个处理操作正在进行中'));
    }
    
    this.setStatus(ModuleStatus.PROCESSING);
    this.emit(ModuleEvent.PROCESS_START);
    
    try {
      // 首先使用人脸检测器处理图片
      const faceResult = await this.faceDetector.processImage(image, {
        withLandmarks: true,
        withAttributes: true
      });
      
      if (!faceResult.isSuccess() || !faceResult.data || faceResult.data.length === 0) {
        throw new LivenessDetectionError('未在图像中检测到人脸');
      }
      
      // 获取检测到的第一个人脸
      const face = faceResult.data[0];
      
      // 执行被动式活体检测
      const livenessResult = this.performPassiveLivenessDetection(face);
      
      this.setStatus(ModuleStatus.READY);
      this.emit(ModuleEvent.PROCESS_COMPLETE, { result: livenessResult });
      
      return Result.success(livenessResult);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('LivenessDetector', `图片处理失败: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      
      this.setStatus(ModuleStatus.ERROR);
      this.emit(ModuleEvent.PROCESS_ERROR, { error: error instanceof Error ? error : new Error(errorMessage) });
      
      return Result.failure(new LivenessDetectionError(`活体检测失败: ${errorMessage}`));
    }
  }
  
  /**
   * 开始活体检测会话
   * @param type 活体检测类型
   */
  startSession(type: LivenessDetectionType = this.config.detectionType): Result<LivenessSession> {
    this.checkInitialized();
    
    // 如果已有会话，先停止
    if (this.currentSession) {
      this.stopSession();
    }
    
    // 生成会话
    let requiredActions: LivenessAction[] = [];
    
    if (type === LivenessDetectionType.ACTIVE || type === LivenessDetectionType.HYBRID) {
      // 从配置的动作中随机选择2-3个
      const availableActions = [...this.config.challengeActions];
      const actionCount = Math.min(availableActions.length, Math.floor(Math.random() * 2) + 2); // 2-3个动作
      
      // 打乱动作顺序
      for (let i = availableActions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [availableActions[i], availableActions[j]] = [availableActions[j], availableActions[i]];
      }
      
      requiredActions = availableActions.slice(0, actionCount);
      
      // 确保至少包含眨眼动作
      if (!requiredActions.includes(LivenessAction.BLINK)) {
        requiredActions[0] = LivenessAction.BLINK;
      }
    }
    
    // 创建会话
    this.currentSession = {
      id: generateUUID(),
      type,
      requiredActions,
      currentActionIndex: 0,
      startTime: Date.now(),
      timeout: this.config.challengeTimeout,
      status: 'active',
      completedActions: []
    };
    
    // 清空历史记录
    this.detectionHistory = [];
    
    this.logger.debug('LivenessDetector', `开始活体检测会话，类型: ${type}`, {
      session: {
        id: this.currentSession.id,
        requiredActions
      }
    } as any);
    
    return Result.success(this.currentSession);
  }
  
  /**
   * 停止当前会话
   */
  stopSession(): void {
    if (this.currentSession) {
      if (this.currentSession.status === 'active') {
        this.currentSession.status = 'failed';
      }
      
      this.logger.debug('LivenessDetector', '停止活体检测会话', {
        session: {
          id: this.currentSession.id,
          status: this.currentSession.status
        }
      } as any );
      
      this.currentSession = null;
    }
    
    // 清空历史记录
    this.detectionHistory = [];
  }
  
  /**
   * 获取当前活体检测会话
   */
  getCurrentSession(): LivenessSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }
  
  /**
   * 开始实时处理
   * @param videoElement 视频元素
   * @param options 处理选项
   */
  async startRealtime(
    videoElement?: HTMLVideoElement,
    options: Record<string, any> = {}
  ): Promise<Result<boolean>> {
    this.checkInitialized();
    
    if (this._status === ModuleStatus.PROCESSING) {
      return Result.failure(new LivenessDetectionError('实时处理已在进行中'));
    }
    
    try {
      // 停止现有会话
      this.stopSession();
      
      // 启动新会话
      const sessionType = options.livenessType || this.config.detectionType;
      this.startSession(sessionType as LivenessDetectionType);
      
      // 启动人脸检测
      const faceDetectorResult = await this.faceDetector.startRealtime(videoElement, {
        withLandmarks: true,
        withAttributes: true,
        processingInterval: options.processingInterval || 100
      });
      
      if (!faceDetectorResult.isSuccess()) {
        throw new Error('无法启动人脸检测');
      }
      
      this.setStatus(ModuleStatus.PROCESSING);
      
      this.logger.debug('LivenessDetector', '开始实时活体检测');
      
      return Result.success(true);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('LivenessDetector', `启动实时活体检测失败: ${errorMessage}`, error instanceof Error ? error : new Error(errorMessage));
      
      return Result.failure(new LivenessDetectionError(`启动实时活体检测失败: ${errorMessage}`));
    }
  }
  
  /**
   * 停止实时处理
   */
  stopRealtime(): void {
    // 停止人脸检测
    this.faceDetector.stopRealtime();
    
    // 停止活体会话
    this.stopSession();
    
    if (this._status === ModuleStatus.PROCESSING) {
      this.setStatus(ModuleStatus.READY);
    }
  }
  
  /**
   * 释放资源
   */
  async dispose(): Promise<void> {
    // 停止实时处理
    this.stopRealtime();
    
    // 移除事件监听
    this.faceDetector.off(ModuleEvent.REALTIME_RESULT, this.handleFaceDetectionResult.bind(this));
    this.cameraManager.off(CameraEvent.FRAME, this.handleCameraFrame.bind(this));
    
    // 释放人脸检测器资源
    await this.faceDetector.dispose();
    
    this._status = ModuleStatus.NOT_INITIALIZED;
  }
  
  /**
   * 处理摄像头帧
   */
  private handleCameraFrame(event: any): void {
    if (this._status !== ModuleStatus.PROCESSING || !event.frameData) {
      return;
    }
    
    // 使用防抖函数处理帧，减少计算负担
    this.debouncedProcessFrame(event.frameData);
  }
  
  /**
   * 处理视频帧
   */
  private processFrame(frameData: ImageData): void {
    // 实际处理逻辑委托给人脸检测器
    // 我们将通过handleFaceDetectionResult接收结果
  }
  
  /**
   * 处理人脸检测结果
   */
  private handleFaceDetectionResult(event: any): void {
    if (!event.results || !Array.isArray(event.results) || event.results.length === 0) {
      return;
    }
    
    // 仅处理最大的人脸
    let bestFace = event.results[0];
    let maxArea = bestFace.boundingBox.width * bestFace.boundingBox.height;
    
    for (let i = 1; i < event.results.length; i++) {
      const face = event.results[i];
      const area = face.boundingBox.width * face.boundingBox.height;
      if (area > maxArea) {
        bestFace = face;
        maxArea = area;
      }
    }
    
    // 如果没有活跃的会话，不进行处理
    if (!this.currentSession || this.currentSession.status !== 'active') {
      return;
    }
    
    // 检查会话是否超时
    const now = Date.now();
    if (now - this.currentSession.startTime > this.currentSession.timeout) {
      this.currentSession.status = 'timeout';
      this.emit('liveness:timeout', { session: this.currentSession });
      return;
    }
    
    // 根据活体检测类型进行处理
    switch (this.currentSession.type) {
      case LivenessDetectionType.PASSIVE:
        this.handlePassiveLivenessDetection(bestFace);
        break;
      case LivenessDetectionType.ACTIVE:
        this.handleActiveLivenessDetection(bestFace);
        break;
      case LivenessDetectionType.HYBRID:
        this.handleHybridLivenessDetection(bestFace);
        break;
    }
  }
  
  /**
   * 处理被动式活体检测
   */
  private handlePassiveLivenessDetection(face: FaceDetectionResult): void {
    // 添加到历史记录
    if (face.landmarks) {
      // 添加眼睛状态到历史记录
      this.addToHistory(face, 'unknown');
      
      // 执行被动式活体检测
      const result = this.performPassiveLivenessDetection(face);
      
      // 如果检测到活体，完成会话
      if (result.isLive && this.currentSession) {
        this.currentSession.result = result;
        this.currentSession.status = 'completed';
        
        this.emit('liveness:detected', { 
          result,
          session: this.currentSession
        });
      }
    }
  }
  
  /**
   * 处理主动式活体检测
   */
  private handleActiveLivenessDetection(face: FaceDetectionResult): void {
    if (!this.currentSession || !this.currentSession.requiredActions || 
        this.currentSession.currentActionIndex === undefined) {
      return;
    }
    
    // 添加到历史记录
    this.addToHistory(face, 'unknown');
    
    // 获取当前要执行的动作
    const currentAction = this.currentSession.requiredActions[this.currentSession.currentActionIndex];
    
    // 检测动作是否完成
    let actionCompleted = false;
    
    switch (currentAction) {
      case LivenessAction.BLINK:
        actionCompleted = this.detectBlink(face);
        break;
      case LivenessAction.NOD:
        actionCompleted = this.detectNod(face);
        break;
      case LivenessAction.SHAKE:
        actionCompleted = this.detectHeadShake(face);
        break;
      case LivenessAction.SMILE:
        actionCompleted = this.detectSmile(face);
        break;
      case LivenessAction.MOUTH_OPEN:
        actionCompleted = this.detectMouthOpen(face);
        break;
    }
    
    if (actionCompleted) {
      // 记录完成的动作
      if (!this.currentSession.completedActions) {
        this.currentSession.completedActions = [];
      }
      this.currentSession.completedActions.push(currentAction);
      
      // 进入下一个动作
      this.currentSession.currentActionIndex++;
      
      // 发出动作完成事件
      this.emit('liveness:action:completed', { 
        action: currentAction,
        session: this.currentSession
      });
      
      // 检查是否所有动作都已完成
      if (this.currentSession.currentActionIndex >= this.currentSession.requiredActions.length) {
        // 所有动作完成，执行最终的活体检测
        const result: LivenessDetectionResult = {
          isLive: true,
          score: 1.0,
          type: LivenessDetectionType.ACTIVE,
          actions: this.currentSession.completedActions,
          processingTime: Date.now() - this.currentSession.startTime
        };
        
        // 更新会话状态
        this.currentSession.result = result;
        this.currentSession.status = 'completed';
        
        // 发出活体检测完成事件
        this.emit('liveness:detected', { 
          result,
          session: this.currentSession
        });
      }
    }
  }
  
  /**
   * 处理混合式活体检测
   */
  private handleHybridLivenessDetection(face: FaceDetectionResult): void {
    // 同时执行被动和主动检测
    this.handlePassiveLivenessDetection(face);
    this.handleActiveLivenessDetection(face);
  }
  
  /**
   * 执行被动式活体检测
   */
  private performPassiveLivenessDetection(face: FaceDetectionResult): LivenessDetectionResult {
    // 初始分数
    let livenessScore = 0.5;
    
    // 检查人脸关键点和属性
    if (face.landmarks) {
      // 眨眼检测提高活体可能性
      const hasBlinkHistory = this.detectionHistory.length > 5;
      if (hasBlinkHistory) {
        const blinkDetected = this.detectBlink(face);
        if (blinkDetected) {
          livenessScore += 0.3;
        }
      }
      
      // 检查面部表情变化
      const hasExpressionChange = this.detectionHistory.length > 5 && face.attributes?.emotion;
      if (hasExpressionChange && face.attributes && face.attributes.emotion) {
        const emotions = face.attributes.emotion;
        const emotionValues = Object.values(emotions || {});
        const emotionVariance = emotionValues.reduce((sum, val) => sum + Math.pow(val! - 0.5, 2), 0) / emotionValues.length;
        
        // 表情变化提高活体可能性
        if (emotionVariance > 0.1) {
          livenessScore += 0.15;
        }
      }
      
      // 检查微小的头部移动
      if (this.detectionHistory.length > 3) {
        const recentFaces = this.detectionHistory.slice(-3).map(h => h.faceResult);
        const hasMovement = recentFaces.some((f, i) => {
          if (i === 0) return false;
          const prev = recentFaces[i - 1];
          // 计算人脸中心点的移动
          const prevCenter = {
            x: prev.boundingBox.x + prev.boundingBox.width / 2,
            y: prev.boundingBox.y + prev.boundingBox.height / 2
          };
          const currCenter = {
            x: f.boundingBox.x + f.boundingBox.width / 2,
            y: f.boundingBox.y + f.boundingBox.height / 2
          };
          // 小幅度移动更像真人
          const dist = this.distance(prevCenter, currCenter);
          return dist > 1 && dist < 20; // 小幅度移动
        });
        
        if (hasMovement) {
          livenessScore += 0.1;
        }
      }
    }
    
    // 限制分数范围在0-1之间
    livenessScore = Math.max(0, Math.min(1, livenessScore));
    
    // 根据阈值确定是否为活体
    const isLive = livenessScore >= this.config.confidenceThreshold;
    
    return {
      isLive,
      score: livenessScore,
      type: LivenessDetectionType.PASSIVE,
      processingTime: 0
    };
  }
  
  /**
   * 添加检测结果到历史记录
   */
  private addToHistory(face: FaceDetectionResult, eyeState: 'open' | 'closed' | 'unknown'): void {
    // 添加到历史记录
    this.detectionHistory.push({
      timestamp: Date.now(),
      eyeState,
      faceResult: face
    });
    
    // 限制历史长度
    if (this.detectionHistory.length > this.MAX_HISTORY_LENGTH) {
      this.detectionHistory.shift();
    }
  }
  
  /**
   * 计算眼睛纵横比(EAR)
   * EAR是一种度量眼睛开合程度的指标
   */
  private calculateEyeAspectRatio(face: FaceDetectionResult): number | null {
    if (!face.landmarks || !face.landmarks.points || face.landmarks.points.length < 68) {
      return null;
    }
    
    const points = face.landmarks.points;
    
    // 68点人脸模型中的眼睛索引
    // 左眼：36-41, 右眼：42-47
    const leftEye = [36, 37, 38, 39, 40, 41].map(i => points[i]);
    const rightEye = [42, 43, 44, 45, 46, 47].map(i => points[i]);
    
    // 计算左眼EAR
    const leftEAR = (
      this.distance(leftEye[1], leftEye[5]) + this.distance(leftEye[2], leftEye[4])
    ) / (2 * this.distance(leftEye[0], leftEye[3]));
    
    // 计算右眼EAR
    const rightEAR = (
      this.distance(rightEye[1], rightEye[5]) + this.distance(rightEye[2], rightEye[4])
    ) / (2 * this.distance(rightEye[0], rightEye[3]));
    
    // 返回平均EAR
    return (leftEAR + rightEAR) / 2;
  }
  
  /**
   * 计算两点之间的距离
   */
  private distance(p1: { x: number, y: number }, p2: { x: number, y: number }): number {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2)
    );
  }
  
  /**
   * 检测眨眼动作
   */
  private detectBlink(face: FaceDetectionResult): boolean {
    // 如果历史记录不足，无法检测
    if (this.detectionHistory.length < 5) {
      return false;
    }
    
    // 计算当前帧的EAR
    const currentEAR = this.calculateEyeAspectRatio(face);
    if (currentEAR === null) {
      return false;
    }
    
    // 获取短时间窗口内的帧
    const recentHistory = this.detectionHistory.slice(-10);
    const historyEARs = recentHistory
      .map(h => this.calculateEyeAspectRatio(h.faceResult))
      .filter(ear => ear !== null) as number[];
    
    if (historyEARs.length < 3) {
      return false;
    }
    
    // 计算眼睛状态序列
    const eyeStates = historyEARs.map(ear => {
      if (ear < this.config.blinkThresholds.eyeClosedThreshold) {
        return 'closed';
      } else if (ear > this.config.blinkThresholds.eyeOpenThreshold) {
        return 'open';
      } else {
        return 'transition';
      }
    });
    
    // 检查是否存在从"open"到"closed"再到"open"的序列
    let hasOpenState = false;
    let hasClosedState = false;
    let hasOpenStateAfterClosed = false;
    
    for (const state of eyeStates) {
      if (state === 'open') {
        if (!hasClosedState) {
          hasOpenState = true;
        } else {
          hasOpenStateAfterClosed = true;
          break;
        }
      } else if (state === 'closed' && hasOpenState) {
        hasClosedState = true;
      }
    }
    
    return hasOpenState && hasClosedState && hasOpenStateAfterClosed;
  }
  
  /**
   * 检测点头动作
   */
  private detectNod(face: FaceDetectionResult): boolean {
    // 如果历史记录不足，无法检测
    if (this.detectionHistory.length < 8) {
      return false;
    }
    
    // 跟踪鼻尖位置的垂直变化
    if (!face.landmarks || !face.landmarks.nose) {
      return false;
    }
    
    const nosePositions = this.detectionHistory
      .slice(-8)
      .map(h => h.faceResult.landmarks?.nose?.y);
    
    if (nosePositions.some(y => y === undefined)) {
      return false;
    }
    
    // 计算垂直位移的差异
    const deltas = [];
    for (let i = 1; i < nosePositions.length; i++) {
      deltas.push(nosePositions[i]! - nosePositions[i - 1]!);
    }
    
    // 检查上下移动的模式
    // 我们寻找垂直方向的位移符号变化，表示向上/向下移动
    let directionChanges = 0;
    for (let i = 1; i < deltas.length; i++) {
      if ((deltas[i] > 0 && deltas[i - 1] < 0) || (deltas[i] < 0 && deltas[i - 1] > 0)) {
        directionChanges++;
      }
    }
    
    // 至少需要2次方向变化，表示下点头动作
    return directionChanges >= 2;
  }
  
  /**
   * 检测摇头动作
   */
  private detectHeadShake(face: FaceDetectionResult): boolean {
    // 如果历史记录不足，无法检测
    if (this.detectionHistory.length < 8) {
      return false;
    }
    
    // 跟踪鼻尖位置的水平变化
    if (!face.landmarks || !face.landmarks.nose) {
      return false;
    }
    
    const nosePositions = this.detectionHistory
      .slice(-8)
      .map(h => h.faceResult.landmarks?.nose?.x);
    
    if (nosePositions.some(x => x === undefined)) {
      return false;
    }
    
    // 计算水平位移的差异
    const deltas = [];
    for (let i = 1; i < nosePositions.length; i++) {
      deltas.push(nosePositions[i]! - nosePositions[i - 1]!);
    }
    
    // 检查左右移动的模式
    // 我们寻找水平方向的位移符号变化，表示左/右移动
    let directionChanges = 0;
    for (let i = 1; i < deltas.length; i++) {
      if ((deltas[i] > 0 && deltas[i - 1] < 0) || (deltas[i] < 0 && deltas[i - 1] > 0)) {
        directionChanges++;
      }
    }
    
    // 至少需要2次方向变化，表示摇头动作
    return directionChanges >= 2;
  }
  
  /**
   * 检测微笑动作
   */
  private detectSmile(face: FaceDetectionResult): boolean {
    if (!face.attributes || !face.attributes.emotion) {
      return false;
    }
    
    // 检查高兴情绪值
    const happyScore = face.attributes.emotion.happy;
    
    // 阈值设为0.7，高于此值认为是微笑
    return happyScore !== undefined && happyScore > 0.7;
  }
  
  /**
   * 检测张嘴动作
   */
  private detectMouthOpen(face: FaceDetectionResult): boolean {
    if (!face.landmarks || !face.landmarks.points || face.landmarks.points.length < 68) {
      return false;
    }
    
    const points = face.landmarks.points;
    
    // 68点人脸模型中的嘴巴索引
    // 上唇：50-53, 下唇：56-59
    const topLip = points[51]; // 上唇中心
    const bottomLip = points[57]; // 下唇中心
    
    // 嘴巴高度
    const mouthHeight = this.distance(topLip, bottomLip);
    
    // 计算嘴巴相对于人脸高度的比例
    const faceHeight = face.boundingBox.height;
    const mouthRatio = mouthHeight / faceHeight;
    
    // 嘴巴开度阈值（约占人脸高度的10%）
    return mouthRatio > 0.1;
  }
} 