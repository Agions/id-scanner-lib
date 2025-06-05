/**
 * @file 人脸检测接口
 * @description 定义人脸检测相关的数据类型和接口
 * @module interfaces/face-detection
 */

import { BaseScannerResult } from './scanner-module';

/**
 * 坐标点接口，表示2D坐标
 */
export interface Point {
  /** X坐标 */
  x: number;
  /** Y坐标 */
  y: number;
}

/**
 * 矩形接口，表示检测框
 */
export interface Rect {
  /** 左上角X坐标 */
  x: number;
  /** 左上角Y坐标 */
  y: number;
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
}

/**
 * 人脸关键点
 */
export interface FaceLandmarks {
  /** 左眼位置 */
  leftEye: Point;
  /** 右眼位置 */
  rightEye: Point;
  /** 鼻尖位置 */
  nose: Point;
  /** 嘴巴中心位置 */
  mouth: Point;
  /** 左眼角位置 */
  leftEyeOuterCorner?: Point;
  /** 右眼角位置 */
  rightEyeOuterCorner?: Point;
  /** 左耳位置 */
  leftEar?: Point;
  /** 右耳位置 */
  rightEar?: Point;
  /** 所有关键点（有些实现可能提供更多点） */
  points?: Point[];
}

/**
 * 人脸角度
 */
export interface FaceAngle {
  /** 俯仰角(上下) */
  pitch: number;
  /** 偏航角(左右) */
  yaw: number;
  /** 滚动角(倾斜) */
  roll: number;
}

/**
 * 人脸质量评估指标
 */
export interface FaceQualityMetrics {
  /** 亮度评分(0-1) */
  brightness: number;
  /** 清晰度评分(0-1) */
  sharpness: number;
  /** 姿态合规程度(0-1) */
  pose: number;
  /** 人脸完整度(0-1) */
  integrity: number;
  /** 整体质量分数(0-1) */
  overall: number;
}

/**
 * 人脸属性
 */
export interface FaceAttributes {
  /** 年龄估计(岁) */
  age?: number;
  /** 性别置信度(0-1，越大越倾向于男性) */
  gender?: number;
  /** 是否戴眼镜置信度 */
  glasses?: number;
  /** 是否戴口罩置信度 */
  mask?: number;
  /** 微笑程度置信度 */
  smile?: number;
  /** 人脸表情分类 */
  emotion?: {
    /** 生气程度 */
    angry?: number;
    /** 恐惧程度 */
    fear?: number;
    /** 厌恶程度 */
    disgust?: number;
    /** 高兴程度 */
    happy?: number;
    /** 平静程度 */
    neutral?: number;
    /** 伤心程度 */
    sad?: number;
    /** 惊讶程度 */
    surprise?: number;
  };
  /** 人种类别置信度 */
  ethnicity?: {
    /** 亚洲人程度 */
    asian?: number;
    /** 黑人程度 */
    black?: number;
    /** 白人程度 */
    caucasian?: number;
    /** 其他人种程度 */
    other?: number;
  };
  /** 其他自定义属性 */
  [key: string]: any;
}

/**
 * 人脸特征向量（人脸嵌入）
 */
export interface FaceEmbedding {
  /** 特征向量数据 */
  vector: number[];
  /** 特征维度 */
  dimension: number;
  /** 模型版本 */
  modelVersion?: string;
}

/**
 * 人脸检测结果
 */
export interface FaceDetectionResult extends BaseScannerResult {
  /** 人脸区域 */
  boundingBox: Rect;
  /** 人脸关键点 */
  landmarks?: FaceLandmarks;
  /** 人脸角度 */
  angle?: FaceAngle;
  /** 检测质量 */
  quality?: FaceQualityMetrics;
  /** 人脸属性 */
  attributes?: FaceAttributes;
  /** 人脸特征向量 */
  embedding?: FaceEmbedding;
  /** 相似度分数（用于比对场景） */
  similarityScore?: number;
  /** 是否有活体检测结果 */
  isLive?: boolean;
  /** 活体检测分数(0-1) */
  livenessScore?: number;
  /** 标识符（可用于跟踪） */
  trackId?: string;
  /** 人脸图像数据（裁剪后） */
  faceImageData?: string;
}

/**
 * 人脸比对结果
 */
export interface FaceComparisonResult {
  /** 相似度分数(0-1) */
  similarity: number;
  /** 是否匹配（基于阈值判断） */
  isMatch: boolean;
  /** 使用的阈值 */
  threshold: number;
  /** 源人脸 */
  sourceFace?: FaceDetectionResult;
  /** 目标人脸 */
  targetFace?: FaceDetectionResult;
  /** 处理时间(毫秒) */
  processingTime: number;
}

/**
 * 活体检测类型
 */
export enum LivenessDetectionType {
  /** 被动活体检测（单图分析） */
  PASSIVE = 'passive',
  /** 主动活体检测（动作挑战） */
  ACTIVE = 'active',
  /** 混合活体检测（结合多种方法） */
  HYBRID = 'hybrid'
}

/**
 * 活体检测动作类型
 */
export enum LivenessAction {
  /** 眨眼 */
  BLINK = 'blink',
  /** 点头 */
  NOD = 'nod',
  /** 摇头 */
  SHAKE = 'shake',
  /** 微笑 */
  SMILE = 'smile',
  /** 张嘴 */
  MOUTH_OPEN = 'mouth_open',
  /** 注视点 */
  GAZE = 'gaze'
}

/**
 * 活体检测结果
 */
export interface LivenessDetectionResult {
  /** 是否为真人 */
  isLive: boolean;
  /** 活体分数(0-1) */
  score: number;
  /** 使用的活体检测类型 */
  type: LivenessDetectionType;
  /** 活体检测动作（如果使用了主动活体检测） */
  actions?: LivenessAction[];
  /** 检测时间(毫秒) */
  processingTime: number;
  /** 检测结果图片 */
  imageData?: string;
}

/**
 * 活体检测会话
 */
export interface LivenessSession {
  /** 会话ID */
  id: string;
  /** 活体检测类型 */
  type: LivenessDetectionType;
  /** 需要完成的动作 */
  requiredActions?: LivenessAction[];
  /** 当前动作索引 */
  currentActionIndex?: number;
  /** 会话开始时间 */
  startTime: number;
  /** 会话超时时间(毫秒) */
  timeout: number;
  /** 会话状态 */
  status: 'active' | 'completed' | 'failed' | 'timeout';
  /** 完成的动作 */
  completedActions?: LivenessAction[];
  /** 活体检测结果 */
  result?: LivenessDetectionResult;
}

/**
 * 人脸跟踪结果
 */
export interface FaceTrackingResult {
  /** 跟踪ID */
  trackId: string;
  /** 当前检测结果 */
  detection: FaceDetectionResult;
  /** 首次检测时间 */
  firstDetectedAt: number;
  /** 上次检测时间 */
  lastDetectedAt: number;
  /** 跟踪状态 */
  status: 'tracked' | 'lost' | 'removed';
  /** 连续跟踪帧数 */
  consecutiveFrames: number;
  /** 历史位置（最近几帧） */
  history?: Rect[];
}

/**
 * 人脸检测选项
 */
export interface FaceDetectionOptions {
  /** 最低人脸置信度 */
  minConfidence?: number;
  /** 最大检测人脸数 */
  maxFaces?: number;
  /** 是否检测关键点 */
  withLandmarks?: boolean;
  /** 是否检测属性 */
  withAttributes?: boolean;
  /** 是否进行人脸对齐 */
  doAlignment?: boolean;
  /** 是否提取人脸特征 */
  withEmbedding?: boolean;
  /** 是否启用跟踪 */
  enableTracking?: boolean;
  /** 是否执行活体检测 */
  withLiveness?: boolean;
  /** 活体检测类型 */
  livenessType?: LivenessDetectionType;
  /** 返回人脸图像 */
  returnFaceImage?: boolean;
  /** 活体检测选项 */
  livenessOptions?: Record<string, any>;
  /** 其他选项 */
  [key: string]: any;
} 