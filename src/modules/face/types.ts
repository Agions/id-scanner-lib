/**
 * @file 人脸模块类型定义
 * @description 人脸模块相关的类型和接口定义
 * @module modules/face/types
 */

/**
 * 人脸检测结果
 */
export interface FaceDetectionResult {
  /** 人脸边界框 */
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  /** 人脸特征点 */
  landmarks?: {
    /** 左眼 */
    leftEye: { x: number; y: number };
    /** 右眼 */
    rightEye: { x: number; y: number };
    /** 鼻子 */
    nose: { x: number; y: number };
    /** 嘴巴 */
    mouth: { x: number; y: number };
    /** 下巴 */
    chin: { x: number; y: number };
  };
  
  /** 人脸角度 */
  angle?: {
    /** 俯仰角 */
    pitch: number;
    /** 偏航角 */
    yaw: number;
    /** 翻滚角 */
    roll: number;
  };
  
  /** 人脸属性 */
  attributes?: {
    /** 性别 */
    gender?: {
      /** 性别值 */
      value: 'male' | 'female';
      /** 置信度 */
      confidence: number;
    };
    /** 年龄 */
    age?: {
      /** 年龄值 */
      value: number;
      /** 置信度 */
      confidence: number;
    };
    /** 表情 */
    emotion?: {
      /** 表情值 */
      value: 'neutral' | 'happiness' | 'surprise' | 'sadness' | 'anger' | 'disgust' | 'fear' | 'contempt';
      /** 置信度 */
      confidence: number;
    };
  };
  
  /** 活体检测结果 */
  liveness?: {
    /** 是否通过活体检测 */
    passed: boolean;
    /** 活体检测分数 */
    score: number;
    /** 活体检测类型 */
    type: 'blink' | 'mouth' | 'head' | 'passive';
  };
  
  /** 人脸图像 */
  image?: ImageData;
  
  /** 置信度 */
  confidence: number;
}

/**
 * 人脸比对结果
 */
export interface FaceComparisonResult {
  /** 是否匹配 */
  isMatch: boolean;
  /** 相似度分数 */
  similarity: number;
  /** 置信度 */
  confidence: number;
}

/**
 * 人脸模块配置选项
 */
export interface FaceModuleOptions {
  /** 是否启用模块 */
  enabled?: boolean;
  
  /** 检测器配置 */
  detector?: {
    /** 最小置信度 */
    minConfidence?: number;
    /** 是否检测特征点 */
    detectLandmarks?: boolean;
    /** 是否检测属性 */
    detectAttributes?: boolean;
    /** 是否返回人脸图像 */
    returnFaceImage?: boolean;
  };
  
  /** 活体检测配置 */
  liveness?: {
    /** 是否启用活体检测 */
    enabled?: boolean;
    /** 活体检测类型 */
    type?: 'blink' | 'mouth' | 'head' | 'passive';
    /** 最小置信度 */
    minConfidence?: number;
    /** 检测超时时间（毫秒） */
    timeout?: number;
  };
  
  /** 人脸比对配置 */
  comparison?: {
    /** 最小相似度阈值 */
    minSimilarity?: number;
  };
} 