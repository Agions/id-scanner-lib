---
title: 人脸识别演示
description: ID-Scanner-Lib 人脸检测与识别功能演示
---

# 人脸识别演示

此页面展示了 ID-Scanner-Lib 的人脸识别功能，包括人脸检测、特征点定位和活体检测等。

## 功能演示

由于浏览器安全限制，在此文档站点无法直接调用摄像头。您可以下载完整的演示代码在本地运行，或参考下方的实现方式进行集成。

## 实现代码

以下是实现人脸识别功能的核心代码：

```javascript
import { IDScanner } from 'id-scanner-lib';

// 初始化人脸检测模块
async function initFaceDetection() {
  // 创建扫描器实例
  const scanner = new IDScanner();
  await scanner.initialize();
  
  // 获取人脸模块
  const faceModule = scanner.getFaceModule({
    landmarks: true,         // 检测面部特征点
    landmarksType: 'full',  // 完整特征点
    livenessCheck: true,    // 启用活体检测
    minFaceSize: 100        // 最小人脸尺寸（像素）
  });
  
  return faceModule;
}

// 启动实时人脸检测
async function startLiveFaceDetection(faceModule) {
  const videoElement = document.getElementById('face-video');
  const canvasElement = document.getElementById('face-canvas');
  const resultElement = document.getElementById('face-result');
  
  try {
    // 启动摄像头
    await faceModule.startCapture(videoElement, {
      facingMode: 'user',  // 前置摄像头
      resolution: 'hd'     // 高清分辨率
    });
    
    // 初始化画布
    const ctx = canvasElement.getContext('2d');
    canvasElement.width = videoElement.videoWidth;
    canvasElement.height = videoElement.videoHeight;
    
    // 开始实时人脸检测
    faceModule.startDetection({
      interval: 100,  // 每100ms检测一次
      drawLandmarks: true  // 绘制特征点
    });
    
    // 监听检测结果
    faceModule.on('detection', (result) => {
      // 清除画布
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      
      if (result.faces.length > 0) {
        // 绘制检测结果
        result.faces.forEach(face => {
          // 绘制人脸框
          ctx.strokeStyle = face.live ? '#00ff00' : '#ff0000';
          ctx.lineWidth = 2;
          ctx.strokeRect(face.box.x, face.box.y, face.box.width, face.box.height);
          
          // 绘制特征点
          if (face.landmarks) {
            ctx.fillStyle = '#00ffff';
            face.landmarks.forEach(point => {
              ctx.beginPath();
              ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI);
              ctx.fill();
            });
          }
          
          // 显示检测结果
          resultElement.innerHTML = `
            <div class="face-result-card">
              <h3>检测结果</h3>
              <p><strong>检测到人脸:</strong> ${result.faces.length}</p>
              <p><strong>置信度:</strong> ${(face.score * 100).toFixed(2)}%</p>
              <p><strong>活体检测:</strong> ${face.live ? '通过' : '未通过'}</p>
              ${face.age ? `<p><strong>年龄估计:</strong> ${face.age}</p>` : ''}
              ${face.gender ? `<p><strong>性别估计:</strong> ${face.gender}</p>` : ''}
            </div>
          `;
        });
      } else {
        resultElement.innerHTML = '<p>未检测到人脸</p>';
      }
    });
  } catch (error) {
    console.error('启动人脸检测失败:', error);
    resultElement.innerHTML = `<p class="error">启动摄像头失败: ${error.message}</p>`;
  }
}

// 从图片中检测人脸
async function detectFromImage(faceModule, imageElement) {
  try {
    const result = await faceModule.detectFaces(imageElement);
    return result;
  } catch (error) {
    console.error('人脸检测失败:', error);
    throw error;
  }
}

// 停止人脸检测
function stopFaceDetection(faceModule) {
  faceModule.stopDetection();
  faceModule.stopCapture();
}
```

## 人脸对比功能

ID-Scanner-Lib 还支持人脸对比功能，可以用于身份验证等场景：

```javascript
// 人脸对比
async function compareFaces(faceModule, faceImage1, faceImage2) {
  try {
    // 提取人脸特征
    const face1 = await faceModule.extractFaceFeatures(faceImage1);
    const face2 = await faceModule.extractFaceFeatures(faceImage2);
    
    // 计算相似度
    const similarity = await faceModule.compareFaceFeatures(face1, face2);
    
    // 显示结果
    const resultElement = document.getElementById('comparison-result');
    resultElement.innerHTML = `
      <div class="comparison-result">
        <h3>人脸对比结果</h3>
        <p><strong>相似度:</strong> ${(similarity * 100).toFixed(2)}%</p>
        <p><strong>判定:</strong> ${similarity > 0.75 ? '同一人' : '不同人'}</p>
      </div>
    `;
    
    return similarity;
  } catch (error) {
    console.error('人脸对比失败:', error);
    throw error;
  }
}
```

## 高级配置

ID-Scanner-Lib 的人脸模块支持多种高级配置选项：

```javascript
const faceModule = scanner.getFaceModule({
  // 检测选项
  scoreThreshold: 0.7,       // 人脸检测置信度阈值
  minFaceSize: 100,          // 最小人脸尺寸（像素）
  maxFaceSize: 0,            // 最大人脸尺寸（0表示不限制）
  
  // 特征点选项
  landmarks: true,           // 是否检测面部特征点
  landmarksType: 'full',     // 'minimal' | 'partial' | 'full'
  
  // 活体检测
  livenessCheck: true,       // 是否启用活体检测
  livenessThreshold: 0.85,   // 活体检测置信度阈值
  
  // 额外功能
  age: true,                 // 是否估计年龄
  gender: true,              // 是否检测性别
  emotion: false,            // 是否检测表情
  
  // 性能选项
  useWorker: true,           // 使用Web Worker
  modelPath: './models/',    // 模型路径
  modelType: 'standard'      // 'lite' | 'standard' | 'advanced'
});
```

## 应用场景

人脸识别模块可应用于多种场景：

1. **身份验证**：将实时人脸与身份证照片对比
2. **访问控制**：基于人脸识别的身份验证
3. **用户体验增强**：为应用添加人脸滤镜、表情识别等功能
4. **安全验证**：结合活体检测防止照片欺骗

## 性能优化建议

1. **选择合适的模型**：移动设备使用 'lite' 模型，高性能设备可使用 'advanced' 模型
2. **调整检测频率**：非关键场景可降低检测频率，减轻资源占用
3. **使用 Web Workers**：将计算密集型的人脸检测过程移至后台线程
4. **按需加载功能**：只启用实际需要的功能，如不需要表情识别可将 emotion 设为 false
