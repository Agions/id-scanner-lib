/**
 * @file 身份证防伪检测模块
 * @description 提供身份证防伪特征识别功能，区分真假身份证
 * @module AntiFakeDetector
 * @version 1.3.2
 */

import { ImageProcessor } from "../utils/image-processing"
import { LRUCache, calculateImageFingerprint } from "../utils/performance"
import { Disposable } from "../utils/resource-manager"

/**
 * 防伪检测结果
 */
export interface AntiFakeDetectionResult {
  isAuthentic: boolean // 是否为真实身份证
  confidence: number // 置信度(0-1)
  detectedFeatures: string[] // 检测到的防伪特征
  message: string // 结果描述
  processingTime?: number // 处理时间(ms)
}

/**
 * 防伪检测器配置选项
 */
export interface AntiFakeDetectorOptions {
  sensitivity?: number // 敏感度 (0-1)，值越高越严格
  enableCache?: boolean // 是否启用缓存
  cacheSize?: number // 缓存大小
  logger?: (message: any) => void // 日志记录器
}

/**
 * 身份证防伪特征检测器
 *
 * 基于图像分析技术检测身份证中的多种防伪特征，包括：
 * 1. 荧光油墨特征
 * 2. 微缩文字
 * 3. 光变图案
 * 4. 雕刻凹印
 * 5. 隐形图案
 *
 * @example
 * ```typescript
 * // 创建防伪检测器
 * const antiFakeDetector = new AntiFakeDetector({
 *   sensitivity: 0.8,
 *   enableCache: true
 * });
 *
 * // 分析身份证图像
 * const imageData = await ImageProcessor.createImageDataFromFile(idCardFile);
 * const result = await antiFakeDetector.detect(imageData);
 *
 * if (result.isAuthentic) {
 *   console.log('身份证真实，检测到防伪特征:', result.detectedFeatures);
 * } else {
 *   console.log('警告!', result.message);
 * }
 * ```
 */
export class AntiFakeDetector implements Disposable {
  private options: Required<AntiFakeDetectorOptions>
  private resultCache: LRUCache<string, AntiFakeDetectionResult>

  /**
   * 创建身份证防伪检测器实例
   *
   * @param options 防伪检测器配置
   */
  constructor(options: AntiFakeDetectorOptions = {}) {
    this.options = {
      sensitivity: 0.7,
      enableCache: true,
      cacheSize: 50,
      logger: console.log,
      ...options,
    }

    // 初始化缓存
    this.resultCache = new LRUCache<string, AntiFakeDetectionResult>(
      this.options.cacheSize
    )
  }

  /**
   * 检测身份证图像的防伪特征
   *
   * @param imageData 身份证图像数据
   * @returns 防伪检测结果
   */
  async detect(imageData: ImageData): Promise<AntiFakeDetectionResult> {
    const startTime = performance.now()

    // 检查缓存
    if (this.options.enableCache) {
      const fingerprint = calculateImageFingerprint(imageData)
      const cachedResult = this.resultCache.get(fingerprint)

      if (cachedResult) {
        this.options.logger("使用缓存的防伪检测结果")
        return cachedResult
      }
    }

    // 图像预处理增强防伪特征
    const enhancedImage = this.enhanceAntiFakeFeatures(imageData)

    // 执行多种防伪特征检测
    const featureResults = await Promise.all([
      this.detectUVInkFeatures(enhancedImage),
      this.detectMicroText(enhancedImage),
      this.detectOpticalVariable(enhancedImage),
      this.detectIntaglioPrinting(enhancedImage),
      this.detectGhostImage(enhancedImage),
    ])

    // 汇总检测结果
    const detectedFeatures: string[] = []
    let totalConfidence = 0

    for (const [feature, detected, confidence] of featureResults) {
      if (detected && confidence > 0.5) {
        detectedFeatures.push(feature)
        totalConfidence += confidence
      }
    }

    // 计算最终结果
    const normalizedConfidence =
      featureResults.length > 0 ? totalConfidence / featureResults.length : 0

    // 根据敏感度和检测到的特征决定是否通过验证
    const isAuthentic =
      normalizedConfidence >= this.options.sensitivity &&
      detectedFeatures.length >= 2

    // 生成结果消息
    let message = isAuthentic
      ? `身份证真实，检测到${detectedFeatures.length}个防伪特征`
      : detectedFeatures.length > 0
      ? `可疑身份证，仅检测到${detectedFeatures.length}个防伪特征，置信度不足`
      : "未检测到有效防伪特征，可能为伪造证件"

    const result: AntiFakeDetectionResult = {
      isAuthentic,
      confidence: normalizedConfidence,
      detectedFeatures,
      message,
      processingTime: performance.now() - startTime,
    }

    // 缓存结果
    if (this.options.enableCache) {
      const fingerprint = calculateImageFingerprint(imageData)
      this.resultCache.set(fingerprint, result)
    }

    return result
  }

  /**
   * 增强身份证图像中的防伪特征
   *
   * @param imageData 原始图像数据
   * @returns 增强后的图像数据
   * @private
   */
  private enhanceAntiFakeFeatures(imageData: ImageData): ImageData {
    // 应用特定的图像处理增强防伪特征
    return ImageProcessor.batchProcess(imageData, {
      contrast: 30, // 增强对比度
      brightness: 10, // 轻微提高亮度
      sharpen: true, // 锐化图像突出细节
    })
  }

  /**
   * 检测荧光油墨特征
   *
   * @param imageData 图像数据
   * @returns [特征名称, 是否检测到, 置信度]
   * @private
   */
  private async detectUVInkFeatures(
    imageData: ImageData
  ): Promise<[string, boolean, number]> {
    // 在真实身份证上，荧光油墨会在特定反光条件下呈现特定颜色特征
    // 在普通可见光下，我们分析蓝色和紫外色通道分布特征
    
    // 1. 提取蓝色通道并增强对比度
    const blueChannel = this.extractColorChannel(imageData, 'blue');
    
    // 2. 分析蓝色通道的分布特征
    const { peaks, variance } = this.analyzeChannelDistribution(blueChannel);
    
    // 3. 分析特定区域的颜色模式
    const patternScore = this.detectUVColorPattern(imageData);
    
    // 4. 计算综合得分
    // 特征分析：荧光油墨在蓝色通道通常有显著峰值，且分布更聚集
    let score = 0;
    
    // 过多的峰值表明可能是真实身份证上的荧光特征
    if (peaks > 3 && peaks < 10) {
      score += 0.4;
    }
    
    // 方差越大，表示颜色对比度越高，更可能有荧光特征
    if (variance > 1000) {
      score += 0.3;
    }
    
    // 颜色模式得分
    score += patternScore * 0.3;
    
    // 重要区域分析
    // 身份证头像区域通常不应具有荧光特征
    const hasPortraitAreaFeatures = this.analyzePortraitArea(imageData);
    if (hasPortraitAreaFeatures) {
      // 头像区域不应该有荧光特征，如果有可能是伪造的
      score -= 0.2;
    }
    
    // 求出最终分数并限制在[0,1]范围内
    const confidence = Math.max(0, Math.min(1, score));
    const detected = confidence > 0.55;
    
    return ["荧光油墨", detected, confidence];
  }
  
  /**
   * 从图像数据中提取指定颜色通道
   * @param imageData 原始图像数据
   * @param channel 通道名称（red, green, blue）
   */
  private extractColorChannel(imageData: ImageData, channel: 'red' | 'green' | 'blue'): Uint8ClampedArray {
    const { data, width, height } = imageData;
    const channelOffset = channel === 'red' ? 0 : channel === 'green' ? 1 : 2;
    const channelData = new Uint8ClampedArray(width * height);
    
    for (let i = 0; i < data.length; i += 4) {
      const pixelIndex = i / 4;
      channelData[pixelIndex] = data[i + channelOffset];
    }
    
    return channelData;
  }
  
  /**
   * 分析颜色通道分布特征
   * @param channelData 颜色通道数据
   */
  private analyzeChannelDistribution(channelData: Uint8ClampedArray): { peaks: number, variance: number } {
    // 计算直方图
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < channelData.length; i++) {
      histogram[channelData[i]]++;
    }
    
    // 平滑直方图以减少噪声
    const smoothedHistogram = this.smoothHistogram(histogram, 3);
    
    // 计算峰值数量
    let peaks = 0;
    for (let i = 1; i < 255; i++) {
      if (smoothedHistogram[i] > smoothedHistogram[i-1] && 
          smoothedHistogram[i] > smoothedHistogram[i+1] &&
          smoothedHistogram[i] > channelData.length * 0.01) { // 只计算显著峰值
        peaks++;
      }
    }
    
    // 计算方差
    let mean = 0;
    for (let i = 0; i < channelData.length; i++) {
      mean += channelData[i];
    }
    mean /= channelData.length;
    
    let variance = 0;
    for (let i = 0; i < channelData.length; i++) {
      variance += Math.pow(channelData[i] - mean, 2);
    }
    variance /= channelData.length;
    
    return { peaks, variance };
  }
  
  /**
   * 平滑直方图以减少噪声
   */
  private smoothHistogram(histogram: number[], windowSize: number): number[] {
    const result = new Array(histogram.length).fill(0);
    const halfWindow = Math.floor(windowSize / 2);
    
    for (let i = 0; i < histogram.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - halfWindow); j <= Math.min(histogram.length - 1, i + halfWindow); j++) {
        sum += histogram[j];
        count++;
      }
      
      result[i] = sum / count;
    }
    
    return result;
  }
  
  /**
   * 检测图像中的荧光颜色模式
   */
  private detectUVColorPattern(imageData: ImageData): number {
    // 分析特定组合颜色的出现频率，荧光油墨在可见光下也具有特定的颜色特征
    const { data, width, height } = imageData;
    let uvColorCount = 0;
    
    // 寻找可能为荧光油墨的特定颜色模式
    // 这些颜色通常是特定的蓝紫色调和高对比度
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // 检查是否是荧光油墨特有的颜色范围
      // 这里使用简化的追踪条件，实际应用中应使用更复杂的颜色模型
      if (b > 1.5 * r && b > 1.3 * g && b > 100) {
        uvColorCount++;
      }
    }
    
    // 计算荧光颜色像素占比
    const totalPixels = width * height;
    const uvColorRatio = uvColorCount / totalPixels;
    
    // 对于真实身份证，荧光颜色的占比应该在一定范围内
    // 如果占比过高或过低，可能是伪造的
    const idealRatio = 0.05; // 理想占比
    const deviation = Math.abs(uvColorRatio - idealRatio) / idealRatio;
    
    // 将差异转换为0-1的置信度分数
    return Math.max(0, 1 - Math.min(1, deviation * 2));
  }
  
  /**
   * 分析头像区域是否存在荧光特征
   * 这个方法用于检测伪造的身份证，因为头像区域不应该有荧光特征
   */
  private analyzePortraitArea(imageData: ImageData): boolean {
    // 假设头像区域大约占据图片右上方四分之一的区域
    const { width, height, data } = imageData;
    const portraitX = Math.floor(width * 0.6);
    const portraitY = Math.floor(height * 0.2);
    const portraitWidth = Math.floor(width * 0.3);
    const portraitHeight = Math.floor(height * 0.3);
    
    let uvFeatureCount = 0;
    let totalPixels = 0;
    
    // 检查头像区域的荧光特征
    for (let y = portraitY; y < portraitY + portraitHeight; y++) {
      for (let x = portraitX; x < portraitX + portraitWidth; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // 使用与上面相同的荧光颜色检测标准
          if (b > 1.5 * r && b > 1.3 * g && b > 100) {
            uvFeatureCount++;
          }
          
          totalPixels++;
        }
      }
    }
    
    // 如果头像区域的荧光特征占比过高，可能是伪造的
    return totalPixels > 0 && (uvFeatureCount / totalPixels) > 0.1;
  }

  /**
   * 检测微缩文字
   *
   * @param imageData 图像数据
   * @returns [特征名称, 是否检测到, 置信度]
   * @private
   */
  private async detectMicroText(
    imageData: ImageData
  ): Promise<[string, boolean, number]> {
    // 微缩文字检测 - 身份证上的微缩文字是重要的防伪特征
    // 这些文字很小，但会呈现规则的线条和高频组件
    
    // 1. 转换图像为灰度图
    const grayscale = ImageProcessor.toGrayscale(
      new ImageData(
        new Uint8ClampedArray(imageData.data),
        imageData.width,
        imageData.height
      )
    );
    
    // 2. 执行边缘检测突出微缩文字
    const edgeData = ImageProcessor.detectEdges(grayscale, 40); // 强化的边缘检测
    
    // 3. 分析频率特征 - 微缩文字呈现高频的边缘过渡
    const frequencyFeatures = this.analyzeFrequencyFeatures(edgeData);
    
    // 4. 检测微缩文字的具体区域
    const microTextRegions = this.detectMicroTextRegions(edgeData);
    
    // 5. 综合分析结果计算置信度
    let score = 0;
    
    // 频率特征分数
    score += frequencyFeatures.score * 0.6;
    
    // 区域特征分数
    if (microTextRegions.count > 0) {
      // 过多的区域也可能表示噪声，因此有一个最佳范围
      const normalizedCount = Math.min(microTextRegions.count, 5) / 5;
      score += normalizedCount * 0.4;
    }
    
    // 对置信度进行最终调整
    const confidence = Math.max(0, Math.min(1, score));
    const detected = confidence > 0.5;
    
    return ["微缩文字", detected, confidence];
  }
  
  /**
   * 分析边缘图像的频率特征
   * 微缩文字呈现高频的边缘过渡
   */
  private analyzeFrequencyFeatures(edgeData: ImageData): { score: number, highFreqRatio: number } {
    const { data, width, height } = edgeData;
    let edgeCount = 0;
    let totalPixels = width * height;
    
    // 计算边缘像素的数量
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 200) { // 大于阈值的边缘像素
        edgeCount++;
      }
    }
    
    // 计算高频边缘分布
    // 统计边缘过渡的变化频率
    let highFreqTransitions = 0;
    
    // 检测行方向的边缘变化
    for (let y = 0; y < height; y++) {
      let prevEdge = false;
      let transitions = 0;
      
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        const isEdge = data[i] > 200;
        
        if (isEdge !== prevEdge) {
          transitions++;
          prevEdge = isEdge;
        }
      }
      
      // 每行的过渡频率
      if (transitions > width * 0.1) { // 高频过渡行
        highFreqTransitions++;
      }
    }
    
    // 计算列方向的边缘变化
    let colHighFreqTransitions = 0;
    for (let x = 0; x < width; x++) {
      let prevEdge = false;
      let transitions = 0;
      
      for (let y = 0; y < height; y++) {
        const i = (y * width + x) * 4;
        const isEdge = data[i] > 200;
        
        if (isEdge !== prevEdge) {
          transitions++;
          prevEdge = isEdge;
        }
      }
      
      // 每列的过渡频率
      if (transitions > height * 0.1) { // 高频过渡列
        colHighFreqTransitions++;
      }
    }
    
    // 综合计算高频特征比例
    const rowHighFreqRatio = highFreqTransitions / height;
    const colHighFreqRatio = colHighFreqTransitions / width;
    const highFreqRatio = (rowHighFreqRatio + colHighFreqRatio) / 2;
    
    // 计算最终分数
    // 真实的微缩文字应该有适度的高频特征，而不是极端的高或低
    const idealRatio = 0.15; // 理想的高频比例
    const deviationFactor = Math.abs(highFreqRatio - idealRatio) / idealRatio;
    const score = Math.max(0, 1 - Math.min(1, deviationFactor * 3));
    
    return { score, highFreqRatio };
  }
  
  /**
   * 检测微缩文字区域
   * 微缩文字通常呈现呈现规则的组合排列
   */
  private detectMicroTextRegions(edgeData: ImageData): { count: number, regions: Array<{x: number, y: number, w: number, h: number}> } {
    const { data, width, height } = edgeData;
    const visitedMap = new Array(width * height).fill(false);
    const regions: Array<{x: number, y: number, w: number, h: number}> = [];
    
    // 使用满足条件的连通区域寻找微缩文字区域
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const i = idx * 4;
        
        // 如果是边缘像素且未访问过
        if (data[i] > 200 && !visitedMap[idx]) {
          // 使用深度优先搜索找到连通的边缘区域
          const regionPoints = this.floodFillEdge(edgeData, x, y, visitedMap);
          
          // 分析区域
          if (regionPoints.length > 10) { // 小区域忽略
            const [minX, minY, maxX, maxY] = this.getBoundingBox(regionPoints);
            const regionWidth = maxX - minX + 1;
            const regionHeight = maxY - minY + 1;
            
            // 检查区域大小和纹理特征
            if (regionWidth > 5 && regionHeight > 5 && 
                regionWidth < width * 0.2 && regionHeight < height * 0.2) {
                
              // 计算区域密度
              const density = regionPoints.length / (regionWidth * regionHeight);
              
              // 检查并添加符合微缩文字特征的区域
              if (density > 0.1 && density < 0.5) { // 合适的密度范围
                regions.push({
                  x: minX,
                  y: minY,
                  w: regionWidth,
                  h: regionHeight
                });
              }
            }
          }
        }
      }
    }
    
    return { count: regions.length, regions };
  }
  
  /**
   * 深度优先搜索连通的边缘区域
   */
  private floodFillEdge(edgeData: ImageData, startX: number, startY: number, visitedMap: boolean[]): Array<{x: number, y: number}> {
    const { data, width, height } = edgeData;
    const stack: Array<{x: number, y: number}> = [];
    const points: Array<{x: number, y: number}> = [];
    const dx = [-1, 0, 1, -1, 1, -1, 0, 1];
    const dy = [-1, -1, -1, 0, 0, 1, 1, 1];
    
    // 起始点
    stack.push({x: startX, y: startY});
    visitedMap[startY * width + startX] = true;
    
    while (stack.length > 0) {
      const {x, y} = stack.pop()!;
      points.push({x, y});
      
      // 检查88个相邻方向
      for (let i = 0; i < 8; i++) {
        const nx = x + dx[i];
        const ny = y + dy[i];
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const nidx = ny * width + nx;
          const ni = nidx * 4;
          
          if (data[ni] > 200 && !visitedMap[nidx]) {
            stack.push({x: nx, y: ny});
            visitedMap[nidx] = true;
          }
        }
      }
    }
    
    return points;
  }
  
  /**
   * 获取点集的外接矩形
   */
  private getBoundingBox(points: Array<{x: number, y: number}>): [number, number, number, number] {
    let minX = Number.MAX_SAFE_INTEGER;
    let minY = Number.MAX_SAFE_INTEGER;
    let maxX = 0;
    let maxY = 0;
    
    for (const {x, y} of points) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    
    return [minX, minY, maxX, maxY];
  }

  /**
   * 检测光变图案
   *
   * @param imageData 图像数据
   * @returns [特征名称, 是否检测到, 置信度]
   * @private
   */
  private async detectOpticalVariable(
    imageData: ImageData
  ): Promise<[string, boolean, number]> {
    // 提取特定区域并分析颜色变化
    // 在实际实现中需要定位光变图案区域并分析其特征
    // 这里使用模拟实现

    // 模拟检测: 65%的概率检测到，置信度0.6-0.9
    const detected = Math.random() > 0.35
    const confidence = detected ? 0.6 + Math.random() * 0.3 : 0

    return ["光变图案", detected, confidence]
  }

  /**
   * 检测凹印雕刻特征
   *
   * @param imageData 图像数据
   * @returns [特征名称, 是否检测到, 置信度]
   * @private
   */
  private async detectIntaglioPrinting(
    imageData: ImageData
  ): Promise<[string, boolean, number]> {
    // 使用特定滤镜增强凹印效果
    // 在实际实现中应分析阴影和纹理模式
    // 这里使用模拟实现

    // 模拟检测: 75%的概率检测到，置信度0.65-0.9
    const detected = Math.random() > 0.25
    const confidence = detected ? 0.65 + Math.random() * 0.25 : 0

    return ["雕刻凹印", detected, confidence]
  }

  /**
   * 检测隐形图案(幽灵图像)
   *
   * @param imageData 图像数据
   * @returns [特征名称, 是否检测到, 置信度]
   * @private
   */
  private async detectGhostImage(
    imageData: ImageData
  ): Promise<[string, boolean, number]> {
    // 调整对比度和亮度显现隐形图案
    // 在实际实现中应使用特定滤镜和图像处理算法
    // 这里使用模拟实现

    // 模拟检测: 60%的概率检测到，置信度0.55-0.85
    const detected = Math.random() > 0.4
    const confidence = detected ? 0.55 + Math.random() * 0.3 : 0

    return ["隐形图案", detected, confidence]
  }

  /**
   * 清除结果缓存
   */
  clearCache(): void {
    this.resultCache.clear()
    this.options.logger("防伪检测结果缓存已清除")
  }

  /**
   * 释放资源
   */
  dispose(): void {
    this.resultCache.clear()
  }
}
