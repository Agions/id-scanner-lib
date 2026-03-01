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

### Q: 如何处理内存泄漏？

A: 确保在使用完毕后释放资源：

```typescript
// 组件卸载时
useEffect(() => {
  return () => {
    faceModule?.dispose();
  };
}, []);
```

### Q: 支持哪些图片格式？

A: 支持 JPEG、PNG、WebP 等浏览器常见的图片格式。

## TypeScript 类型

完整类型定义请参考 [types](./src/types/) 目录。

### 核心类型

```typescript
// 图像源
type ImageSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData;

// 矩形区域
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 点坐标
interface Point {
  x: number;
  y: number;
}

// 模块状态
type ModuleState = 'idle' | 'loading' | 'ready' | 'error' | 'disposed';

// 人脸检测结果
interface FaceDetectionResult {
  faces: Face[];
  image: ImageData;
}

// 人脸详情
interface Face {
  box: Rectangle;
  landmarks: Point[];
  expressions?: Record<string, number>;
  age?: number;
  gender?: string;
  embedding?: number[];
}
```

## 错误处理

### 错误类型

```typescript
import { ScannerError, ErrorCode } from 'id-scanner-lib';

try {
  await faceModule.initialize();
} catch (error) {
  if (error instanceof ScannerError) {
    switch (error.code) {
      case ErrorCode.CAMERA_NOT_FOUND:
        // 处理摄像头未找到
        break;
      case ErrorCode.PERMISSION_DENIED:
        // 处理权限被拒绝
        break;
      case ErrorCode.MODEL_LOAD_FAILED:
        // 处理模型加载失败
        break;
    }
  }
}
```

### 错误代码

| 代码 | 说明 |
|------|------|
| `CAMERA_NOT_FOUND` | 摄像头未找到 |
| `PERMISSION_DENIED` | 权限被拒绝 |
| `MODEL_LOAD_FAILED` | 模型加载失败 |
| `INITIALIZATION_FAILED` | 初始化失败 |
| `PROCESSING_FAILED` | 处理失败 |
| `DISPOSED` | 模块已释放 |

## 性能调优

### 1. 调整检测频率

```typescript
const faceModule = new FaceModule({
  // 降低检测频率以提升性能
  detectionFrequency: 100, // ms
});
```

### 2. 缩小检测区域

```typescript
const faceModule = new FaceModule({
  // 只检测画面中心区域
  detectionRegion: {
    x: 0.25,
    y: 0.25,
    width: 0.5,
    height: 0.5
  }
});
```

### 3. 使用 Web Worker

```typescript
// 身份证识别使用 Web Worker，不阻塞主线程
const idCardModule = new IDCardModule({
  useWorker: true
});
```

### 4. 模型选择

```typescript
const faceModule = new FaceModule({
  // 使用轻量级模型
  modelType: 'tiny',
  // 或者使用完整模型（更准确但更慢）
  // modelType: 'full'
});
```

## 浏览器兼容性

| 浏览器 | 最低版本 | 支持情况 |
|--------|---------|---------|
| Chrome | 80+ | ✅ 完全支持 |
| Firefox | 75+ | ✅ 完全支持 |
| Safari | 14+ | ✅ 完全支持 |
| Edge | 80+ | ✅ 完全支持 |
| iOS Safari | 14+ | ✅ 完全支持 |
| Android Chrome | 80+ | ✅ 完全支持 |

### Polyfill

如需支持旧版浏览器，请添加以下 polyfill：

```html
<script src="https://polyfill.io/v3/polyfill.min.js"></script>
```

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

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -m 'Add xxx'`)
4. 推送分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 许可证

MIT License

## 更新日志

See [CHANGELOG](./CHANGELOG.md)
