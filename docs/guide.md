# ID-Scanner-Lib 开发者指南

## 简介

ID-Scanner-Lib 是一个纯前端实现的身份证与二维码识别库，专为 Web 应用设计。该库提供高质量的图像处理、OCR 文字识别、身份证信息提取、二维码扫描和人脸识别等功能，所有功能均在浏览器端运行，无需服务器处理，确保用户数据安全。

## 特性

- **身份证识别**：支持中国第二代身份证正反面识别，自动提取姓名、身份证号、住址等信息
- **二维码识别**：支持多种二维码格式，包括 QR Code、Code 128、EAN-13 等
- **人脸识别**：支持人脸检测、特征点定位、活体检测等
- **模块化设计**：按需加载所需功能，减小应用体积
- **多端适配**：支持 PC 和移动端，自适应不同设备
- **高性能**：优化的算法和 Web Worker 支持，提供流畅的用户体验
- **无服务器依赖**：所有功能在浏览器端实现，保护用户隐私

## 快速开始

本指南将帮助你快速上手 ID-Scanner-Lib，实现身份证识别、二维码扫描和人脸识别功能。

## 安装

首先，使用 npm 或 yarn 安装库：

```bash
# 使用 npm
npm install id-scanner-lib --save

# 或使用 yarn
yarn add id-scanner-lib
```

## 基础使用

### 创建扫描器实例

首先创建一个 `IDScanner` 实例，这是库的核心入口：

```javascript
import { IDScanner } from 'id-scanner-lib';

// 创建扫描器实例
const scanner = new IDScanner();

// 初始化扫描器 (必须在使用前调用)
await scanner.initialize();
```

### 身份证识别

识别身份证并提取信息：

```javascript
// 获取身份证模块
const idCardModule = scanner.getIDCardModule();

// 从图像中识别身份证
const imageElement = document.getElementById('idcard-image');
const idCardInfo = await idCardModule.recognize(imageElement);

// 处理识别结果
if (idCardInfo) {
  console.log('姓名:', idCardInfo.name);
  console.log('身份证号:', idCardInfo.idNumber);
  console.log('地址:', idCardInfo.address);
}
```

### 二维码扫描

扫描图像中的二维码：

```javascript
// 获取二维码模块
const qrCodeModule = scanner.getQRCodeModule();

// 扫描图像中的二维码
const imageElement = document.getElementById('qrcode-image');
const qrResult = await qrCodeModule.scan(imageElement);

// 处理扫描结果
if (qrResult) {
  console.log('二维码内容:', qrResult.data);
}
```

### 人脸检测

检测图像中的人脸：

```javascript
// 获取人脸模块
const faceModule = scanner.getFaceModule();

// 检测图像中的人脸
const imageElement = document.getElementById('face-image');
const faceResult = await faceModule.detectFace(imageElement);

// 处理检测结果
if (faceResult) {
  console.log('检测到人脸:', faceResult);
  
  // 获取人脸属性
  if (faceResult.attributes) {
    console.log('性别:', faceResult.attributes.gender?.value);
    console.log('年龄:', faceResult.attributes.age?.value);
  }
}
```

## 实时扫描示例

以下是一个使用摄像头实时扫描二维码的示例：

```javascript
// DOM元素
const videoElement = document.getElementById('camera');
const resultElement = document.getElementById('result');

// 创建扫描器
const scanner = new IDScanner();
await scanner.initialize();

// 获取二维码模块
const qrCodeModule = scanner.getQRCodeModule();

// 启动摄像头
const stream = await scanner.startCamera(videoElement, {
  facingMode: 'environment', // 使用后置摄像头
  width: 1280,
  height: 720
});

// 定时扫描视频帧
let scanning = true;
const scanInterval = setInterval(async () => {
  if (!scanning) return;
  
  try {
    // 捕获当前帧
    const frame = scanner.captureFrame(videoElement);
    
    // 扫描二维码
    const result = await qrCodeModule.scan(frame);
    
    if (result) {
      // 找到二维码，显示结果
      resultElement.textContent = result.data;
      
      // 暂停扫描
      scanning = false;
      
      // 可选：停止摄像头
      // scanner.stopCamera(stream);
    }
  } catch (error) {
    console.error('扫描错误:', error);
  }
}, 500);

// 清理资源
function cleanup() {
  clearInterval(scanInterval);
  scanner.stopCamera(stream);
  scanner.dispose();
}

// 页面关闭时清理资源
window.addEventListener('beforeunload', cleanup);
```

## 下一步

- 查看[安装指南](/installation)了解更多安装选项
- 阅读[身份证识别](/guide/idcard)、[二维码扫描](/guide/qrcode)或[人脸识别](/guide/face)的详细文档
- 参考[API文档](/API)获取完整的API参考

## 模块化架构

ID-Scanner-Lib 采用模块化设计，核心功能被划分为不同的模块：

### 核心模块

- **ModuleManager**: 负责管理所有功能模块的生命周期
- **Logger**: 提供日志记录功能
- **EventEmitter**: 事件发布订阅系统

### 功能模块

- **IDCardModule**: 身份证识别模块
  - OCRProcessor: OCR 文字识别
  - IDCardDetector: 身份证检测与定位
  - AntiFakeDetector: 防伪特征检测

- **QRCodeModule**: 二维码识别模块
  - QRScanner: 二维码扫描器
  - BarcodeReader: 条形码阅读器

- **FaceModule**: 人脸识别模块
  - FaceDetector: 人脸检测
  - FaceLandmark: 人脸特征点
  - LivenessDetector: 活体检测

## 详细 API

### IDScanner 类

主要的入口类，用于创建和管理扫描器实例。

#### 构造函数

```javascript
const scanner = new IDScanner(options);
```

**选项**:

- `logLevel`: 日志级别
- `enableIDCard`: 是否启用身份证识别（默认: true）
- `enableQRCode`: 是否启用二维码识别（默认: true）
- `enableFace`: 是否启用人脸识别（默认: false）
- `idCard`: 身份证模块配置
- `qrCode`: 二维码模块配置
- `face`: 人脸识别模块配置

#### 方法

- **initialize()**: 初始化扫描器
- **dispose()**: 释放资源
- **getIDCardModule()**: 获取身份证模块
- **getQRCodeModule()**: 获取二维码模块
- **getFaceModule()**: 获取人脸识别模块

### IDCardModule 类

身份证识别模块，提供身份证检测与信息提取功能。

#### 方法

- **initialize()**: 初始化模块
- **recognize(image)**: 识别身份证图像
- **verify(idCardInfo)**: 验证身份证信息
- **dispose()**: 释放资源

**识别结果示例**:

```javascript
{
  type: 'front', // 'front' 或 'back'
  name: '张三',
  gender: '男',
  nationality: '汉族',
  birthDate: '1990-01-01',
  address: '北京市朝阳区...',
  idNumber: '110101199001011234',
  issuingAuthority: '北京市公安局',
  validFrom: '2010-01-01',
  validTo: '2020-01-01',
  confidence: 0.95 // 识别置信度
}
```

### QRCodeModule 类

二维码识别模块，支持多种格式的二维码和条形码识别。

#### 方法

- **initialize()**: 初始化模块
- **scan(image)**: 扫描图像中的二维码
- **startScanner(videoElement)**: 启动实时扫描
- **stopScanner()**: 停止实时扫描
- **dispose()**: 释放资源

### FaceModule 类

人脸识别模块，提供人脸检测、特征提取和活体检测功能。

#### 方法

- **initialize()**: 初始化模块
- **detect(image)**: 检测图像中的人脸
- **getLandmarks(image)**: 获取人脸特征点
- **verifyLiveness(image)**: 活体检测
- **dispose()**: 释放资源

## 高级功能

### Web Worker

为提高性能，ID-Scanner-Lib 支持在 Web Worker 中进行繁重的计算任务，使应用界面保持流畅：

```javascript
const idCardModule = scanner.getIDCardModule();

// 使用 Web Worker 处理 OCR
const result = await idCardModule.recognize(imageElement, {
  useWorker: true
});
```

### 性能优化

处理大型图像时，可以配置缩放和预处理选项以提高性能：

```javascript
const result = await idCardModule.recognize(imageElement, {
  maxImageDimension: 1000, // 限制图像最大尺寸
  preprocessing: {
    brightness: 10,  // 亮度调整
    contrast: 20,    // 对比度调整
    sharpen: true    // 锐化
  }
});
```

### 自定义事件

使用事件系统监听识别过程中的事件：

```javascript
const idCardModule = scanner.getIDCardModule();

// 监听识别完成事件
idCardModule.on('recognized', (event) => {
  console.log('识别完成:', event.idCardInfo);
});

// 监听错误事件
idCardModule.on('error', (event) => {
  console.error('识别错误:', event.error);
});
```

## 兼容性

ID-Scanner-Lib 支持以下浏览器环境：

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

移动端支持：
- iOS Safari 11+
- Android Chrome 60+

## 常见问题

### 识别精度

为获得最佳识别效果，建议：
- 确保图像清晰、光线充足
- 避免强烈反光或阴影
- 身份证在图像中占据足够大的比例

### 性能问题

如果遇到性能问题，可以：
- 减小处理图像的尺寸
- 启用 Web Worker 选项
- 减少同时加载的模块数量

### 调试模式

启用调试模式获取更详细的日志信息：

```javascript
const scanner = new IDScanner({
  logLevel: 'DEBUG'
});
```

## 许可证

MIT License 