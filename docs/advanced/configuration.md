---
title: 自定义配置
description: ID-Scanner-Lib 高级配置选项与自定义设置
---

# 自定义配置

ID-Scanner-Lib 提供了丰富的配置选项，可以根据不同的应用场景和需求进行定制。本文档详细介绍了可用的配置项及其使用方法。

## 全局配置

全局配置适用于整个扫描器实例，在初始化时传入：

```javascript
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  // 基础配置
  debug: process.env.NODE_ENV !== 'production',
  logLevel: 'info', // 'debug' | 'info' | 'warn' | 'error'
  
  // 功能模块配置
  modules: ['idcard', 'qrcode', 'face'],
  
  // 性能配置
  useWorker: true,
  workerCount: 2,
  
  // 视频配置
  video: {
    facingMode: 'environment',
    width: { ideal: 1280 },
    height: { ideal: 720 }
  }
});
```

## 模块级配置

每个功能模块都支持独立的配置选项：

### 身份证模块配置

```javascript
const idcardModule = scanner.getIDCardModule({
  // 识别配置
  recognitionMode: 'accurate', // 'fast' | 'balanced' | 'accurate'
  detectBothSides: true,       // 是否检测身份证正反面
  extractAvatar: true,         // 是否提取头像
  
  // OCR配置
  ocrEngine: 'default',        // 'default' | 'enhanced' | 'legacy'
  ocrLanguage: 'zh-CN',        // OCR语言设置
  
  // 验证配置
  validateID: true,            // 是否验证身份证号码有效性
  validateChecksum: true       // 是否验证校验和
});
```

### 二维码模块配置

```javascript
const qrcodeModule = scanner.getQRCodeModule({
  // 码类型配置
  formats: ['qr', 'ean_13', 'code_128'], // 支持的码格式
  
  // 扫描配置
  continuous: true,           // 连续扫描模式
  scanInterval: 100,          // 扫描间隔(ms)
  maxScanTime: 10000,         // 最大扫描时间(ms)
  
  // 处理配置
  tryHarder: true,            // 尝试更努力地解码
  inverted: false,            // 是否识别反色码
  
  // 视觉反馈
  highlightFound: true,       // 是否高亮显示已找到的码
  beepOnSuccess: true,        // 识别成功时是否发出提示音
  vibrateOnSuccess: true      // 识别成功时是否震动(移动设备)
});
```

### 人脸模块配置

```javascript
const faceModule = scanner.getFaceModule({
  // 检测配置
  minFaceSize: 100,           // 最小人脸尺寸(像素)
  maxFaceSize: 0,             // 最大人脸尺寸(0表示不限制)
  scoreThreshold: 0.7,        // 人脸检测分数阈值
  
  // 特征点配置
  landmarks: true,            // 是否检测面部特征点
  landmarksType: 'full',      // 'minimal' | 'partial' | 'full'
  
  // 活体检测
  livenessCheck: false,       // 是否启用活体检测
  livenessThreshold: 0.85,    // 活体检测阈值
  
  // 额外功能
  age: false,                 // 是否估计年龄
  gender: false,              // 是否检测性别
  emotion: false              // 是否检测情绪
});
```

## 高级自定义

除了预设的配置选项，ID-Scanner-Lib 还支持高级自定义，满足特定需求。

### 自定义处理管道

创建自定义的图像处理管道：

```javascript
// 自定义预处理管道
scanner.setCustomPipeline('enhanced-idcard', [
  { op: 'grayscale' },
  { op: 'gaussianBlur', params: { sigma: 0.8 } },
  { op: 'adaptiveThreshold', params: { blockSize: 11, C: 2 } },
  { op: 'morphology', params: { operation: 'close', kernelSize: 3 } }
]);

// 使用自定义管道
const result = await scanner.getIDCardModule().recognize(image, {
  pipeline: 'enhanced-idcard'
});
```

### 插件系统

通过插件扩展功能：

```javascript
// 注册自定义插件
scanner.registerPlugin('watermark-detector', {
  name: 'Watermark Detector',
  version: '1.0.0',
  initialize(scanner) {
    // 插件初始化逻辑
  },
  methods: {
    detectWatermark(image) {
      // 水印检测逻辑
      return { hasWatermark: true, confidence: 0.92 };
    }
  },
  hooks: {
    'before-recognize': (image, options) => {
      // 识别前钩子
    },
    'after-recognize': (result) => {
      // 识别后钩子
    }
  }
});

// 使用插件方法
const plugin = scanner.getPlugin('watermark-detector');
const watermarkResult = plugin.detectWatermark(image);
```

### 事件与回调

配置事件监听和回调函数：

```javascript
// 配置全局事件处理
scanner.setEventHandlers({
  'scanner:ready': () => console.log('Scanner ready'),
  'recognize:start': (module, image) => console.log(`Started ${module} recognition`),
  'recognize:progress': (progress) => updateProgressBar(progress),
  'recognize:complete': (result) => displayResult(result),
  'recognize:error': (error) => handleError(error)
});

// 为特定模块配置事件
scanner.getIDCardModule().on('field:extracted', (field, value, confidence) => {
  console.log(`Extracted ${field}: ${value} (confidence: ${confidence})`);
  if (confidence < 0.8) {
    highlightLowConfidenceField(field);
  }
});
```

## 配置持久化

保存和恢复配置：

```javascript
// 保存当前配置
const currentConfig = scanner.exportConfig();
localStorage.setItem('scanner-config', JSON.stringify(currentConfig));

// 恢复保存的配置
const savedConfig = JSON.parse(localStorage.getItem('scanner-config'));
scanner.importConfig(savedConfig);

// 重置为默认配置
scanner.resetConfig();
```

## 环境适配配置

根据不同环境自动调整配置：

```javascript
const scanner = new IDScanner({
  adaptiveConfig: true,
  environmentProfiles: {
    // 桌面高性能配置
    desktop: {
      recognitionMode: 'accurate',
      useWorker: true,
      workerCount: 4,
      preferWasm: true
    },
    // 移动设备配置
    mobile: {
      recognitionMode: 'balanced',
      useWorker: true,
      workerCount: 1,
      optimizeForBattery: true
    },
    // 低端设备配置
    lowEnd: {
      recognitionMode: 'fast',
      useWorker: false,
      simplifiedProcessing: true
    }
  }
});
```

## 配置最佳实践

1. **按需配置**：只启用实际需要的功能和模块
2. **性能平衡**：在识别准确率和性能之间找到平衡点
3. **渐进增强**：从基本配置开始，逐步添加高级特性
4. **用户体验**：配置适当的视觉反馈和交互响应
5. **环境感知**：根据设备性能和使用环境调整配置
6. **错误处理**：配置合理的错误处理和降级策略

通过合理配置，可以使ID-Scanner-Lib在各种应用场景中发挥最佳性能，提供出色的用户体验。
