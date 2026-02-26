# ID Scanner Lib

[English](./README_EN.md) | [中文](./README.md)

一个功能强大的浏览器端身份验证和人脸识别库，支持人脸检测、人脸比对、活体检测和二维码扫描。

![Version](https://img.shields.io/npm/v/id-scanner-lib)
![License](https://img.shields.io/npm/l/id-scanner-lib)
![Size](https://img.shields.io/bundlephobia/min/id-scanner-lib)

## 特性

- 🚀 **模块化架构** - 核心组件独立封装，便于扩展和维护
- 👤 **人脸检测** - 快速准确的人脸定位和属性分析
- 🔍 **人脸比对** - 高精度的人脸相似度比对
- 🛡️ **活体检测** - 支持被动式和主动式活体验证，防止照片、视频欺骗
- 📱 **二维码扫描** - 支持QR码和多种条形码格式
- ⚡ **轻量级** - 优化的模型加载策略，按需加载
- 🌐 **跨平台** - 支持所有主流浏览器和设备

## 安装

### NPM

```bash
npm install id-scanner-lib
```

### CDN

```html
<!-- UMD -->
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner-lib.min.js"></script>

<!-- ESM -->
<script type="module">
  import IDScannerLib from 'https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner-lib.esm.js';
</script>
```

## 快速开始

### 基础使用

```typescript
import { IDScanner, FaceModule } from 'id-scanner-lib';

// 初始化库
await IDScanner.initialize({
  debug: true
});

// 创建人脸模块
const faceModule = new FaceModule({
  onFaceDetected: (faces) => console.log('检测到人脸:', faces),
  onError: (error) => console.error('错误:', error)
});

// 初始化人脸模块
await faceModule.initialize();

// 启动摄像头并开始人脸检测
const videoElement = document.getElementById('video');
await faceModule.startFaceRecognition(videoElement);
```

### 人脸比对

```typescript
// 比对两张人脸图片
const result = await faceModule.compareFaces(image1, image2);

console.log(`相似度: ${result.similarity}`);
console.log(`是否匹配: ${result.isMatch}`);
```

### 活体检测

```typescript
// 被动式活体检测
const result = await faceModule.detectLiveness(image, {
  type: LivenessDetectionType.PASSIVE,
  onlyLive: true,
  minConfidence: 0.7
});

console.log(`是否为真人: ${result.isLive}`);
console.log(`置信度: ${result.score}`);
```

### 二维码扫描

```typescript
// 创建二维码扫描器
const qrScanner = IDScanner.createQRScanner({
  scanFrequency: 200,
  formats: ['qrcode', 'code_128', 'code_39', 'ean_13']
});

// 初始化扫描器
await qrScanner.init();

// 启动实时扫描
await qrScanner.startRealtime(videoElement);

// 处理扫描结果
qrScanner.on('module:realtime:result', (event) => {
  console.log('扫描结果:', event.result.content);
});
```

## API 文档

### 核心类

| 类 | 说明 |
|---|---|
| `IDScanner` | 主入口类，管理所有模块 |
| `FaceModule` | 人脸检测、比对、活体检测模块 |
| `IDCardModule` | 身份证识别模块 |
| `QRCodeModule` | 二维码扫描模块 |

### 工具函数

| 函数 | 说明 |
|---|---|
| `withRetry()` | 带重试的异步函数包装器 |
| `AsyncCache` | 异步缓存类 |
| `Semaphore` | 信号量，并发控制 |
| `ErrorHandler` | 统一错误处理 |
| `LoadingStateManager` | 加载状态管理 |

### 类型定义

```typescript
import type {
  ImageSource,
  Rectangle,
  Point,
  ModuleState,
  BaseResult
} from 'id-scanner-lib';
```

## 性能优化

### 模型懒加载

默认只加载必要的模型，按需加载其他模型：

```typescript
const faceModule = new FaceModule({
  // 只加载检测模型，不加载表情、年龄等模型
  extractEmbeddings: false,
  detectExpressions: false,
  detectAgeGender: false
});
```

### 内存管理

使用完成后务必释放资源：

```typescript
// 释放模块
await faceModule.dispose();

// 释放整个库
await scanner.dispose();
```

## 浏览器兼容性

| 浏览器 | 最低版本 |
|--------|---------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |

## 项目结构

```
src/
├── core/              # 核心功能
│   ├── camera-manager.ts    # 摄像头管理
│   ├── config.ts           # 配置管理
│   ├── logger.ts           # 日志系统
│   └── loading-state.ts    # 加载状态
├── modules/           # 功能模块
│   ├── face/         # 人脸模块
│   ├── id-card/      # 身份证模块
│   └── qrcode/       # 二维码模块
├── utils/            # 工具函数
│   ├── retry.ts      # 重试机制
│   └── error-handler.ts # 错误处理
└── types/            # 类型定义
```

## 常见问题

### Q: 模型加载失败怎么办？

A: 检查网络连接，或使用本地模型：

```typescript
const faceModule = new FaceModule({
  modelPath: '/local/models'
});
```

### Q: 如何处理权限问题？

A: 确保页面在 HTTPS 环境下运行，并获取用户授权：

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user' }
});
```

## 许可证

MIT License

## 更新日志

See [CHANGELOG](./CHANGELOG.md)
