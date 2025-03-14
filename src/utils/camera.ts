/**
 * @file 相机工具类
 * @description 提供访问和控制设备摄像头的功能
 * @module Camera
 */

/**
 * 相机配置选项接口
 * 
 * @interface CameraOptions
 * @property {number} [width] - 视频宽度，默认为640
 * @property {number} [height] - 视频高度，默认为480
 * @property {string} [facingMode] - 摄像头朝向，'user'为前置摄像头，'environment'为后置摄像头，默认为'environment'
 */
export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

/**
 * 相机工具类
 * 
 * 提供访问设备摄像头、获取视频流以及捕获图像帧的功能
 * 
 * @example
 * ```typescript
 * // 创建相机实例
 * const camera = new Camera({
 *   width: 1280,
 *   height: 720,
 *   facingMode: 'environment' // 使用后置摄像头
 * });
 * 
 * // 初始化相机
 * const videoElement = document.getElementById('video') as HTMLVideoElement;
 * await camera.initialize(videoElement);
 * 
 * // 捕获当前视频帧
 * const imageData = camera.captureFrame();
 * 
 * // 使用结束后释放资源
 * camera.release();
 * ```
 */
export class Camera {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  
  /**
   * 创建相机实例
   * 
   * @param {CameraOptions} [options] - 相机配置选项
   */
  constructor(private options: CameraOptions = {}) {
    this.options = {
      width: 640,
      height: 480,
      facingMode: 'environment',
      ...options
    };
  }
  
  /**
   * 初始化相机，请求摄像头权限并设置视频流
   * 
   * @param {HTMLVideoElement} videoElement - 用于显示相机画面的video元素
   * @returns {Promise<void>} 初始化完成的Promise
   * @throws 如果无法访问相机，将抛出错误
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    try {
      this.videoElement = videoElement;
      
      const constraints: MediaStreamConstraints = {
        video: {
          width: this.options.width,
          height: this.options.height,
          facingMode: this.options.facingMode
        }
      };
      
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      
      return new Promise((resolve) => {
        if (this.videoElement) {
          this.videoElement.onloadedmetadata = () => {
            if (this.videoElement) {
              this.videoElement.play();
              resolve();
            }
          };
        }
      });
    } catch (error) {
      console.error('相机初始化失败:', error);
      throw new Error('无法访问相机');
    }
  }
  
  /**
   * 获取当前视频帧
   * 
   * 捕获当前视频画面并转换为ImageData对象，可用于图像处理和分析
   * 
   * @returns {ImageData|null} 当前视频帧的ImageData对象，如果未初始化视频则返回null
   */
  captureFrame(): ImageData | null {
    if (!this.videoElement) return null;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    ctx.drawImage(this.videoElement, 0, 0);
    
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  
  /**
   * 释放相机资源
   * 
   * 停止所有视频流轨道并清理资源。在不再需要相机时应调用此方法。
   */
  release(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }
} 