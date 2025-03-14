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
 * await camera.start(videoElement);
 * 
 * // 捕获当前视频帧
 * const imageData = camera.captureFrame();
 * 
 * // 使用结束后释放资源
 * camera.stop();
 * ```
 */
export class Camera {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  
  /**
   * 创建相机实例
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
   * 启动摄像头并将视频流绑定到视频元素
   * @param videoElement HTML视频元素
   * @returns Promise<void>
   */
  async start(videoElement: HTMLVideoElement): Promise<void> {
    return this.initialize(videoElement);
  }
  
  /**
   * 停止摄像头并释放资源
   */
  stop(): void {
    this.release();
  }
  
  /**
   * 初始化相机，获取视频流并绑定到视频元素
   * 
   * @param {HTMLVideoElement} videoElement - 用于显示视频流的视频元素
   * @returns {Promise<void>} 初始化完成的Promise
   * @throws 如果无法访问摄像头，将抛出错误
   */
  async initialize(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement;
    
    try {
      // 构建媒体约束
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: this.options.width },
          height: { ideal: this.options.height },
          facingMode: this.options.facingMode
        }
      };
      
      // 获取视频流
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 绑定到视频元素
      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        await new Promise<void>((resolve) => {
          if (this.videoElement) {
            this.videoElement.onloadedmetadata = () => {
              if (this.videoElement) {
                this.videoElement.play().then(() => resolve());
              }
            };
          }
        });
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      throw new Error('无法访问摄像头。请确保已授予摄像头访问权限，并且摄像头未被其他应用程序占用。');
    }
  }
  
  /**
   * 捕获当前视频帧
   * 
   * @returns {ImageData|null} 视频帧的ImageData对象，如果未初始化则返回null
   */
  captureFrame(): ImageData | null {
    if (!this.videoElement) {
      return null;
    }
    
    // 创建Canvas元素用于捕获视频帧
    const canvas = document.createElement('canvas');
    canvas.width = this.videoElement.videoWidth;
    canvas.height = this.videoElement.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) {
      return null;
    }
    
    // 将视频内容绘制到Canvas中
    context.drawImage(this.videoElement, 0, 0, canvas.width, canvas.height);
    
    // 获取ImageData对象
    return context.getImageData(0, 0, canvas.width, canvas.height);
  }
  
  /**
   * 释放摄像头资源
   */
  release(): void {
    // 停止视频流的所有轨道
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    // 清除视频元素绑定
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }
} 