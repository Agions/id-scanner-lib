/**
 * @file 外部库类型声明
 * @description 为外部依赖库声明类型定义
 */

/**
 * TensorFlow.js 相关类型
 */
declare module '@tensorflow/tfjs' {
  export interface Tensor<R extends Rank = Rank> {
    dataId: object;
    id: number;
    shape: number[];
    dtype: string;
    size: number;
    rank: number;
    dispose(): void;
    // 其他方法...
  }
  
  export type Rank = 'R0' | 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6';
  
  export function ready(): Promise<void>;
  export function dispose(): void;
  // 更多方法...
}

/**
 * face-api.js 相关类型
 */
declare module '@vladmandic/face-api' {
  export namespace tf {
    export function dispose(): Promise<void>;
  }
  
  export namespace env {
    export function monkeyPatch(env: any): void;
  }
  
  export type TNetInput = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageData | { toString(): string } | string;
  
  export interface FaceDetectionWithLandmarks {
    detection: FaceDetection;
    landmarks: FaceLandmarks68 | FaceLandmarks68TinyNet;
    getRefRect(): any;
    forwardFaceDetection(): FaceDetection;
  }
  
  export interface WithFaceDescriptor<T> {
    descriptor: Float32Array;
  }
  
  export interface WithAge {
    age: number;
  }
  
  export interface WithGender {
    gender: string;
    genderProbability: number;
  }
  
  export interface FaceMatch {
    label: string;
    distance: number;
  }
  
  export interface WithFaceExpressions {
    expressions: {
      neutral: number;
      happy: number;
      sad: number;
      angry: number;
      fearful: number;
      disgusted: number;
      surprised: number;
    };
  }
  
  export interface IFaceLandmarks {
    positions: Point[];
    shift(point: Point): IFaceLandmarks;
    forSize<T extends IFaceLandmarks>(width: number, height: number): T;
  }
  
  export interface IRect {
    x: number;
    y: number;
    width: number;
    height: number;
  }
  
  export interface IBoundingBox extends IRect {
    left: number;
    top: number;
    right: number;
    bottom: number;
  }
  
  export interface IFaceDetection {
    score: number;
    box: IBoundingBox;
  }
  
  export class Point {
    x: number;
    y: number;
    constructor(x: number, y: number);
  }
  
  export class FaceDetection implements IFaceDetection {
    score: number;
    box: IBoundingBox;
    constructor(score: number, box: IBoundingBox);
  }
  
  export class FaceLandmarks68 implements IFaceLandmarks {
    positions: Point[];
    constructor(points: Point[]);
    shift(point: Point): FaceLandmarks68;
    forSize<T extends IFaceLandmarks>(width: number, height: number): T;
  }
  
  export class FaceLandmarks68TinyNet extends FaceLandmarks68 {
    constructor(points: Point[]);
  }
  
  export class SsdMobilenetv1Options {
    constructor(options?: { minConfidence?: number; maxResults?: number });
  }
  
  export class TinyFaceDetectorOptions {
    constructor(options?: { inputSize?: number; scoreThreshold?: number });
  }
  
  export class MtcnnOptions {
    constructor(options?: { minFaceSize?: number; scaleFactor?: number; minConfidence?: number });
  }
  
  export class FaceRecognitionNet {
    constructor();
    loadFromUri(uri: string): Promise<void>;
  }
  
  export class FaceExpressionNet {
    constructor();
    loadFromUri(uri: string): Promise<void>;
  }
  
  export class AgeGenderNet {
    constructor();
    loadFromUri(uri: string): Promise<void>;
  }
  
  export interface NeuralNetwork {
    loadFromUri(uri: string): Promise<void>;
    isLoaded: boolean;
    dispose(): void;
  }
  
  // 命名空间中的网络
  export const nets: {
    ssdMobilenetv1: NeuralNetwork;
    tinyFaceDetector: NeuralNetwork;
    faceLandmark68Net: NeuralNetwork;
    faceLandmark68TinyNet: NeuralNetwork;
    faceRecognitionNet: NeuralNetwork;
    faceExpressionNet: NeuralNetwork;
    ageGenderNet: NeuralNetwork;
    mtcnn: NeuralNetwork;
  };
  
  // 工具函数
  export function createCanvasFromMedia(media: TNetInput): HTMLCanvasElement;
  export function detectAllFaces(input: TNetInput, options?: SsdMobilenetv1Options | TinyFaceDetectorOptions | MtcnnOptions): DetectAllFacesTask;
  
  export interface DetectAllFacesTask {
    withFaceLandmarks(useTinyModel?: boolean): DetectAllFacesWithLandmarksTask;
    run(): Promise<FaceDetection[]>;
  }
  
  export interface DetectAllFacesWithLandmarksTask {
    withFaceExpressions(): DetectAllFacesWithFaceExpressionsTask;
    withAgeAndGender(): DetectAllFacesWithAgeAndGenderTask;
    run(): Promise<FaceDetectionWithLandmarks[]>;
  }
  
  export interface DetectAllFacesWithFaceExpressionsTask {
    withAgeAndGender(): DetectAllFacesWithAgeAndGenderTask;
    run(): Promise<Array<FaceDetectionWithLandmarks & WithFaceExpressions>>;
  }
  
  export interface DetectAllFacesWithAgeAndGenderTask {
    withFaceDescriptors(): DetectAllFacesWithFaceDescriptorsTask;
    run(): Promise<Array<FaceDetectionWithLandmarks & WithFaceExpressions & WithAge & WithGender>>;
  }
  
  export interface DetectAllFacesWithFaceDescriptorsTask {
    run(): Promise<Array<FaceDetectionWithLandmarks & WithFaceExpressions & WithAge & WithGender & WithFaceDescriptor<any>>>;
  }
} 