/**
 * ID Scanner Library 类型定义文件
 */

declare module 'id-scanner-lib' {
  /**
   * 库的版本号
   */
  export const VERSION: string;

  /**
   * 日志级别
   */
  export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error'
  }

  /**
   * 配置项
   */
  export interface Config {
    [key: string]: any;
  }

  /**
   * 日志条目
   */
  export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    tag: string;
    message: string;
    error?: Error;
  }

  /**
   * 日志处理程序
   */
  export interface LogHandler {
    handle(entry: LogEntry): void;
  }

  /**
   * 事件处理程序
   */
  export type EventHandler = (data: any) => void;

  /**
   * 摄像头选项
   */
  export interface CameraOptions {
    facingMode?: 'user' | 'environment';
    width?: number;
    height?: number;
    idealWidth?: number;
    idealHeight?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    deviceId?: string;
  }

  /**
   * 资源类型
   */
  export enum ResourceType {
    MODEL = 'model',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    JSON = 'json',
    OTHER = 'other'
  }

  /**
   * 资源信息
   */
  export interface Resource {
    id: string;
    type: ResourceType;
    url: string;
    data?: any;
    loaded: boolean;
    error?: Error;
  }

  /**
   * 结果状态
   */
  export enum ResultStatus {
    SUCCESS = 'success',
    FAILURE = 'failure'
  }

  /**
   * 结果接口
   */
  export interface IResult<T> {
    status: ResultStatus;
    data?: T;
    error?: Error;
    isSuccess(): boolean;
    isFailure(): boolean;
  }

  /**
   * 插件优先级
   */
  export enum PluginPriority {
    HIGHEST = 0,
    HIGH = 25,
    NORMAL = 50,
    LOW = 75,
    LOWEST = 100
  }

  /**
   * 插件接口
   */
  export interface Plugin {
    id: string;
    name: string;
    version: string;
    description?: string;
    dependencies?: string[];
    priority?: PluginPriority;
    initialize?(config?: any): Promise<void>;
    activate?(): Promise<void>;
    deactivate?(): Promise<void>;
    uninstall?(): Promise<void>;
  }

  /**
   * 身份证类型
   */
  export enum IDCardType {
    SECOND_GENERATION_FRONT = 'second_generation_front',
    SECOND_GENERATION_BACK = 'second_generation_back',
    FIRST_GENERATION = 'first_generation',
    TEMPORARY = 'temporary',
    FOREIGN_PERMANENT = 'foreign_permanent',
    HMT_RESIDENT = 'hmt_resident',
    UNKNOWN = 'unknown'
  }

  /**
   * 身份证边缘信息
   */
  export interface IDCardEdge {
    topLeft: { x: number; y: number };
    topRight: { x: number; y: number };
    bottomRight: { x: number; y: number };
    bottomLeft: { x: number; y: number };
  }

  /**
   * 身份证信息
   */
  export interface IDCardInfo {
    type: IDCardType;
    edge?: IDCardEdge;
    name?: string;
    gender?: string;
    ethnicity?: string;
    birthDate?: string;
    address?: string;
    idNumber?: string;
    issueAuthority?: string;
    validFrom?: string;
    validTo?: string;
    photoRegion?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    image?: ImageData;
    confidence?: number;
    antiFake?: {
      passed: boolean;
      score: number;
      features?: {
        fluorescent?: boolean;
        microtext?: boolean;
        opticalVariable?: boolean;
        texture?: boolean;
        watermark?: boolean;
      };
    };
  }

  /**
   * 身份证验证结果
   */
  export interface IDCardVerificationResult {
    isValid: boolean;
    score: number;
    failureReason?: string;
    details?: {
      idNumberValid?: boolean;
      issueDateValid?: boolean;
      isExpired?: boolean;
      antiFakePassed?: boolean;
    };
  }

  /**
   * 图像处理选项
   */
  export interface ImageProcessOptions {
    preprocess?: boolean;
    correctPerspective?: boolean;
    enhance?: boolean;
    denoise?: boolean;
    binarize?: boolean;
  }

  /**
   * 人脸检测结果
   */
  export interface FaceDetectionResult {
    faceId: string;
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    landmarks?: Array<{ x: number; y: number }>;
    score: number;
    angle?: {
      pitch: number;
      roll: number;
      yaw: number;
    };
    attributes?: {
      age?: number;
      gender?: 'male' | 'female' | 'unknown';
      smile?: number;
      glasses?: boolean;
      mask?: boolean;
    };
    quality?: {
      brightness: number;
      clarity: number;
      integrity: number;
      overall: number;
    };
    image?: ImageData;
  }

  /**
   * 活体检测类型
   */
  export enum LivenessDetectionType {
    PASSIVE = 'passive',
    ACTIVE = 'active'
  }

  /**
   * 活体检测结果
   */
  export interface LivenessDetectionResult {
    isLive: boolean;
    score: number;
    confidence: number;
    failureReason?: string;
    details?: {
      [key: string]: any;
    };
  }

  /**
   * QR扫描结果
   */
  export interface QRScanResult {
    text: string;
    format: string;
    position: {
      topLeft: { x: number; y: number };
      topRight: { x: number; y: number };
      bottomRight: { x: number; y: number };
      bottomLeft: { x: number; y: number };
    };
    rawBytes?: Uint8Array;
  }

  /**
   * 配置管理器类
   */
  export class ConfigManager {
    static getInstance(): ConfigManager;
    updateConfig(config: Config): void;
    get<T>(key: string, defaultValue?: T): T;
    set(key: string, value: any): void;
    has(key: string): boolean;
    remove(key: string): void;
    clear(): void;
    getAll(): Config;
  }

  /**
   * 日志记录器类
   */
  export class Logger {
    static getInstance(): Logger;
    addHandler(handler: LogHandler): void;
    removeHandler(handler: LogHandler): void;
    debug(tag: string, message: string, error?: Error): void;
    info(tag: string, message: string, error?: Error): void;
    warn(tag: string, message: string, error?: Error): void;
    error(tag: string, message: string, error?: Error): void;
  }

  /**
   * 事件发射器类
   */
  export class EventEmitter {
    on(event: string, handler: EventHandler): void;
    off(event: string, handler?: EventHandler): void;
    once(event: string, handler: EventHandler): void;
    emit(event: string, data?: any): void;
  }

  /**
   * 资源管理器类
   */
  export class ResourceManager {
    static getInstance(): ResourceManager;
    load(id: string, url: string, type?: ResourceType): Promise<Resource>;
    unload(id: string): void;
    get(id: string): Resource | undefined;
    has(id: string): boolean;
    getAll(): Map<string, Resource>;
    clear(): void;
  }

  /**
   * 摄像头管理器类
   */
  export class CameraManager extends EventEmitter {
    static getInstance(): CameraManager;
    init(options?: CameraOptions): Promise<void>;
    start(): Promise<void>;
    stop(): void;
    pause(): void;
    resume(): void;
    getStream(): MediaStream | null;
    getCapabilities(): MediaTrackCapabilities | null;
    switchCamera(): Promise<void>;
    setVideoElement(element: HTMLVideoElement): void;
    getVideoElement(): HTMLVideoElement | null;
    takePhoto(): ImageData | null;
  }

  /**
   * 结果类
   */
  export class Result<T> implements IResult<T> {
    status: ResultStatus;
    data?: T;
    error?: Error;

    static success<T>(data: T): Result<T>;
    static failure<T>(error: Error): Result<T>;

    isSuccess(): boolean;
    isFailure(): boolean;
  }

  /**
   * 插件管理器类
   */
  export class PluginManager extends EventEmitter {
    static getInstance(): PluginManager;
    registerPlugin(plugin: Plugin): void;
    initializePlugin(pluginId: string, config?: any): Promise<void>;
    activatePlugin(pluginId: string): Promise<void>;
    deactivatePlugin(pluginId: string): Promise<void>;
    uninstallPlugin(pluginId: string): Promise<void>;
    getPluginInfo(pluginId: string): { plugin: Plugin; status: string; error?: Error } | undefined;
    getAllPlugins(): Map<string, { plugin: Plugin; status: string; error?: Error }>;
    getActivePlugins(): Plugin[];
  }

  /**
   * 身份证检测器类
   */
  export class IDCardDetector extends EventEmitter {
    constructor(options?: {
      enabled?: boolean;
      minConfidence?: number;
      detectType?: boolean;
      detectEdge?: boolean;
      enableOCR?: boolean;
      cropAndAlign?: boolean;
      enableAntiFake?: boolean;
      returnImage?: boolean;
      modelPath?: string;
    });

    initialize(): Promise<void>;
    processImage(
      image: ImageData | HTMLImageElement | HTMLCanvasElement,
      processOptions?: ImageProcessOptions
    ): Promise<Result<IDCardInfo>>;
    dispose(): void;
  }

  /**
   * 身份证模块类
   */
  export class IDCardModule extends EventEmitter {
    constructor(options?: {
      enabled?: boolean;
      detectorOptions?: {
        minConfidence?: number;
        enableOCR?: boolean;
        enableAntiFake?: boolean;
      };
      cameraOptions?: {
        facingMode?: 'user' | 'environment';
        idealResolution?: { width: number; height: number };
      };
      imageProcessOptions?: ImageProcessOptions;
      onIDCardDetected?: (idCard: IDCardInfo) => void;
      onError?: (error: Error) => void;
    });

    initialize(): Promise<void>;
    startIDCardRecognition(videoElement: HTMLVideoElement): Promise<void>;
    stop(): void;
    processImage(
      image: ImageData | HTMLImageElement | HTMLCanvasElement,
      processOptions?: ImageProcessOptions
    ): Promise<Result<IDCardInfo>>;
    verifyIDCard(idCardInfo: IDCardInfo): IDCardVerificationResult;
    getLastDetectionResult(): IDCardInfo | null;
    terminate(): Promise<void>;
  }

  /**
   * 人脸检测器类
   */
  export class FaceDetector extends EventEmitter {
    constructor(options?: {
      enabled?: boolean;
      minConfidence?: number;
      returnImage?: boolean;
      maxFaces?: number;
      modelPath?: string;
    });

    initialize(): Promise<void>;
    detectFaces(
      image: ImageData | HTMLImageElement | HTMLCanvasElement,
      options?: {
        minConfidence?: number;
        maxFaces?: number;
        returnImage?: boolean;
      }
    ): Promise<Result<FaceDetectionResult[]>>;
    dispose(): void;
  }

  /**
   * 活体检测器类
   */
  export class LivenessDetector extends EventEmitter {
    constructor(options?: {
      enabled?: boolean;
      type?: LivenessDetectionType;
      minScore?: number;
      modelPath?: string;
    });

    initialize(): Promise<void>;
    checkLiveness(
      image: ImageData | HTMLImageElement | HTMLCanvasElement,
      faceDetection?: FaceDetectionResult
    ): Promise<Result<LivenessDetectionResult>>;
    startSession(videoElement: HTMLVideoElement): Promise<void>;
    stopSession(): void;
    dispose(): void;
  }

  /**
   * 二维码扫描器类
   */
  export class QRScanner extends EventEmitter {
    constructor(options?: {
      enabled?: boolean;
      formats?: string[];
      tryHarder?: boolean;
      returnImage?: boolean;
    });

    init(): Promise<void>;
    scan(image: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<Result<QRScanResult[]>>;
    startScan(videoElement: HTMLVideoElement): Promise<void>;
    stopScan(): void;
    dispose(): void;
  }

  /**
   * 人脸模块类
   */
  export class FaceModule extends EventEmitter {
    constructor(options?: {
      enabled?: boolean;
      detectorOptions?: {
        minConfidence?: number;
        maxFaces?: number;
      };
      livenessOptions?: {
        type?: LivenessDetectionType;
        minScore?: number;
      };
      cameraOptions?: {
        facingMode?: 'user' | 'environment';
        idealResolution?: { width: number; height: number };
      };
      onFaceDetected?: (faces: FaceDetectionResult[]) => void;
      onLivenessResult?: (result: LivenessDetectionResult) => void;
      onError?: (error: Error) => void;
    });

    initialize(): Promise<void>;
    startFaceDetection(videoElement: HTMLVideoElement): Promise<void>;
    startLivenessDetection(videoElement: HTMLVideoElement): Promise<void>;
    stop(): void;
    detectFaces(
      image: ImageData | HTMLImageElement | HTMLCanvasElement
    ): Promise<Result<FaceDetectionResult[]>>;
    checkLiveness(
      image: ImageData | HTMLImageElement | HTMLCanvasElement,
      faceDetection?: FaceDetectionResult
    ): Promise<Result<LivenessDetectionResult>>;
    getLastFaceDetection(): FaceDetectionResult[] | null;
    getLastLivenessResult(): LivenessDetectionResult | null;
    terminate(): Promise<void>;
  }

  /**
   * 库初始化选项
   */
  export interface IDScannerLibOptions {
    debug?: boolean;
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    config?: Record<string, any>;
    resourceBasePath?: string;
    preloadModules?: ('face' | 'qr' | 'idcard')[];
    plugins?: Plugin[];
  }

  /**
   * ID Scanner Library 核心类
   */
  export class IDScannerLib {
    static initialize(options?: IDScannerLibOptions): Promise<void>;
    static createFaceDetector(options?: any): Promise<FaceDetector>;
    static createLivenessDetector(options?: any): Promise<LivenessDetector>;
    static createQRScanner(options?: any): QRScanner;
    static createIDCardDetector(options?: any): Promise<IDCardDetector>;
    static registerPlugin(plugin: Plugin): void;
    static getVersion(): string;
  }

  // 导出错误类
  export class IDScannerError extends Error {
    code?: string;
    cause?: Error;
    constructor(message: string, options?: { code?: string; cause?: Error });
  }

  export class CameraAccessError extends IDScannerError {
    constructor(message: string, options?: { code?: string; cause?: Error });
  }
} 