# ID Scanner lib

一个功能强大的浏览器端身份验证和人脸识别库，支持人脸检测、人脸比对、活体检测和二维码扫描。

## 特性

- **模块化架构**：核心组件独立封装，便于扩展和维护
- **人脸检测**：快速准确的人脸定位和属性分析
- **人脸比对**：高精度的人脸相似度比对
- **活体检测**：支持被动式和主动式活体验证，防止照片、视频欺骗
- **二维码扫描**：支持QR码和多种条形码格式
- **轻量级**：优化的模型加载策略，按需加载
- **跨平台**：支持所有主流浏览器和设备

## 安装

### NPM

```bash
npm install id-scanner-lib
```

### CDN

```html
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner-lib.min.js"></script>
```

## 快速开始

### 基本使用

```javascript
import { IDScannerLib, FaceModule } from 'id-scanner-lib';

// 初始化库
await IDScannerLib.initialize({
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

```javascript
// 比对两张人脸图片
const result = await faceModule.compareFaces(image1, image2);

console.log(`相似度: ${result.similarity}`);
console.log(`是否匹配: ${result.isMatch}`);
```

### 活体检测

```javascript
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

```javascript
// 创建二维码扫描器
const qrScanner = IDScannerLib.createQRScanner({
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

## 项目结构

```
/src
  /core              - 核心组件
    errors.ts        - 错误处理系统
    event-emitter.ts - 事件发布订阅系统
    result.ts        - 统一结果处理
    config.ts        - 配置管理器
    logger.ts        - 日志系统
    resource-manager.ts - 资源管理器
    camera-manager.ts   - 摄像头管理器
    scanner-factory.ts  - 扫描器工厂
  /interfaces        - 接口定义
    scanner-module.ts  - 扫描模块接口
    face-detection.ts  - 人脸检测接口
    external-types.ts  - 外部类型定义
  /modules           - 功能模块
    /face              - 人脸相关模块
      face-detector.ts   - 人脸检测器
      liveness-detector.ts - 活体检测器
    /qr                - 二维码相关模块
      qr-scanner.ts      - 二维码扫描器
  /utils             - 工具函数
  index.ts           - 主入口
  face-module.ts     - 人脸模块
  version.ts         - 版本信息
/examples            - 示例代码
  face-detection-demo.html - 人脸检测演示
  liveness-detection-demo.html - 活体检测演示
  qr-scanner-demo.html - 二维码扫描演示
  combined-demo.html - 综合功能演示
/docs               - 文档
  API.md            - API文档
```

## 演示示例

项目包含多个演示示例，位于 `examples` 目录下：

- **人脸检测演示** (`face-detection-demo.html`): 展示基本的人脸检测功能
- **活体检测演示** (`liveness-detection-demo.html`): 展示活体检测功能
- **二维码扫描演示** (`qr-scanner-demo.html`): 展示二维码和条形码扫描功能
- **综合功能演示** (`combined-demo.html`): 展示多功能同时使用的场景

运行示例：

```bash
# 安装依赖
npm install

# 构建库
npm run build

# 启动开发服务器
npm run dev
```

然后在浏览器中访问 `http://localhost:8080/examples/`

## API文档

详细的API文档可在 [docs/API.md](docs/API.md) 中找到。

## 浏览器兼容性

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## 性能优化

为了获得最佳性能，请考虑以下建议：

1. **选择合适的模型**：对于移动设备，可使用轻量级模型
2. **按需初始化**：只初始化需要使用的模块
3. **资源释放**：不使用时调用dispose()方法释放资源
4. **设置合理的扫描频率**：根据设备性能调整scanFrequency
5. **减少同时检测的人脸数**：通过maxFaces限制
6. **仅加载需要的特性**：如不需要表情识别，将withAttributes设为false

## 贡献

欢迎贡献代码、报告问题或提出改进建议。请先fork项目，然后提交拉取请求。

## 许可证

MIT
