# ID-Scanner-Lib

纯前端实现的TypeScript身份证与二维码识别库，无需后端支持，所有处理均在浏览器端完成。结合高性能图像处理与OCR技术，提供完整的识别解决方案。

[![NPM Version](https://img.shields.io/npm/v/id-scanner-lib.svg)](https://www.npmjs.com/package/id-scanner-lib)
[![License](https://img.shields.io/npm/l/id-scanner-lib.svg)](https://github.com/agions/id-scanner-lib/blob/master/LICENSE)

## 技术特性

- **高性能识别引擎**：针对浏览器环境优化的识别算法，支持实时处理
- **二维码扫描**：基于jsQR实现高精度二维码识别与解码
- **条形码识别**：支持EAN-13、CODE-128等常见一维码格式
- **身份证OCR**：基于Tesseract.js的优化OCR引擎，精确提取身份证信息
- **图像处理优化**：内置多种图像预处理算法，提高识别率
- **支持多种数据源**：摄像头实时视频流、图片文件、URL、Base64等
- **高效缓存机制**：内置LRU缓存，避免重复识别，提升性能
- **Web Worker支持**：耗时操作可在后台线程执行，不阻塞UI
- **模块化设计**：支持按需加载，最小化应用体积
- **TypeScript支持**：完整类型定义，提供良好的开发体验

## 性能指标

| 功能       | 平均识别时间 | 识别率 | 备注             |
| ---------- | ------------ | ------ | ---------------- |
| 二维码识别 | 50-150ms     | >98%   | 取决于图像质量   |
| 条形码识别 | 70-200ms     | >95%   | 支持多种格式     |
| 身份证OCR  | 300-800ms    | >90%   | 优化后的识别速度 |
| 图像处理   | 20-100ms     | -      | 视处理操作而定   |

## 最新版本 (v1.3.0)

- **图像处理引擎升级**：
  - 增强的图像锐化算法，提高低光照环境下的识别率
  - 自适应阈值算法，优化二值化效果
  - 基于OTSU算法的自动阈值选择
- **性能优化**：
  - 代码压缩与Tree-shaking优化，减少30%以上的包体积
  - 引入智能缓存机制，避免重复计算
  - Web Worker支持，提高多核CPU利用率
- **新增功能**：
  - 批量图像处理API
  - 内置图像压缩功能
  - 一体化演示组件
- **架构改进**：
  - 资源自动释放机制
  - 更精细的模块划分
  - 增强的错误处理

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                       IDScanner 主模块                      │
├─────────────┬─────────────────┬────────────────────────────┤
│  QRScanner  │  BarcodeScanner │        IDCardDetector      │
├─────────────┴─────────────────┴────────────────────────────┤
│                 Camera (视频流捕获与处理)                    │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   核心处理引擎                               │
├─────────────────┬─────────────────┬────────────────────────┤
│  OCRProcessor   │  DataExtractor  │     ImageProcessor     │
│  (文字识别)      │  (数据提取验证)  │     (图像预处理)       │
└─────────────────┴─────────────────┴────────────────────────┘
```

## 安装与使用

### NPM安装

```bash
npm install id-scanner-lib --save
```

### CDN引入

```html
<!-- 生产环境 (压缩版) -->
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib@1.3.0/dist/id-scanner.min.js"></script>

<!-- 开发环境 (未压缩) -->
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib@1.3.0/dist/id-scanner.js"></script>
```

## 包体积优化

v1.3.0版本通过代码分割和Tree-shaking极大地优化了包体积：

| 模块            | 大小 (gzip) | 说明             |
| --------------- | ----------- | ---------------- |
| 完整包(min.js)  | 25KB        | 包含所有功能     |
| 核心包(min.js)  | 90KB        | 基础功能，无OCR  |
| OCR模块(min.js) | 14KB        | 仅文字识别       |
| QR模块(min.js)  | 6KB         | 仅二维码识别     |
| ESM模块         | 各模块更小  | 支持Tree-shaking |

## 最佳实践：按需引入

### 完整引入

```javascript
// 引入完整功能
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  onQRCodeScanned: (result) => console.log('扫描结果:', result),
  onIDCardScanned: (info) => console.log('身份证信息:', info)
});
```

### 轻量引入

```javascript
// 只引入二维码相关功能
import { ScannerModule } from 'id-scanner-lib/qr';

const qrScanner = new ScannerModule({
  onQRCodeScanned: (result) => console.log('二维码:', result)
});
```

## 快速开始

### 二维码识别

```javascript
import { IDScanner } from 'id-scanner-lib';

// 创建扫描器实例
const scanner = new IDScanner({
  onQRCodeScanned: (result) => {
    console.log('扫描到二维码:', result);
  }
});

// 初始化
await scanner.initialize();

// 启动扫描
const videoElement = document.getElementById('video');
await scanner.startQRScanner(videoElement);

// 处理静态图片
const qrResult = await scanner.processQRCodeImage('https://example.com/qr.jpg');
```

### 身份证识别

```javascript
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  onIDCardScanned: (info) => {
    console.log('识别到身份证信息:', info);
    document.getElementById('name').textContent = info.name;
    document.getElementById('idNumber').textContent = info.idNumber;
  }
});

await scanner.initialize();
await scanner.startIDCardScanner(document.getElementById('camera'));

// 使用文件输入处理
document.getElementById('fileInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  try {
    // 先压缩图片提高处理速度
    const compressed = await scanner.compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920
    });
  
    // 处理身份证图像
    const idInfo = await scanner.processIDCardImage(compressed);
    console.log('身份证信息:', idInfo);
  } catch (error) {
    console.error('处理失败:', error);
  }
});
```

### 使用内置演示组件

```javascript
import { IDScannerDemo } from 'id-scanner-lib';

// 快速创建完整功能演示
const demo = new IDScannerDemo(
  'video',         // 视频元素ID
  'result',        // 结果显示元素ID
  'switchButton',  // 切换按钮ID
  'imageInput'     // 图片输入元素ID
);

await demo.initialize();
```

## 高级图像处理

```javascript
import { ImageProcessor } from 'id-scanner-lib';

// 从文件创建ImageData
const file = document.getElementById('fileInput').files[0];
const imageData = await ImageProcessor.createImageDataFromFile(file);

// 批量图像处理
const enhancedImage = ImageProcessor.batchProcess(imageData, {
  brightness: 15,     // 增加亮度
  contrast: 25,       // 提高对比度
  sharpen: true,      // 锐化图像
  grayscale: false    // 不转换为灰度
});

// 二值化处理
const binaryImage = ImageProcessor.toBinaryImage(enhancedImage);

// 显示处理结果
const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
ctx.putImageData(binaryImage, 0, 0);

// 转换为文件并上传
const processedFile = await ImageProcessor.imageDataToFile(
  enhancedImage, 
  'processed.jpg', 
  'image/jpeg', 
  0.9
);
```

## 技术实现细节

### OCR引擎优化

OCR引擎基于Tesseract.js进行了一系列优化：

1. **预处理流水线**：图像经过多阶段处理，包括大小调整、增强对比度、锐化等
2. **字符集约束**：针对身份证特定字符集进行了优化，提高识别准确度
3. **多线程处理**：使用Web Worker避免主线程阻塞
4. **结果缓存**：相同图像指纹不重复计算，提高响应速度

### 图像增强算法

针对不同场景提供最佳图像处理策略：

- **弱光环境**：自动提高亮度和对比度
- **模糊图像**：应用锐化算法提高清晰度
- **过度曝光**：自适应调整对比度
- **特殊角度**：透视校正（开发中）

## 浏览器兼容性

完整支持所有现代浏览器：

| 浏览器         | 最低版本 | 功能限制                    |
| -------------- | -------- | --------------------------- |
| Chrome         | 60+      | 完整支持                    |
| Firefox        | 55+      | 完整支持                    |
| Safari         | 11+      | 完整支持                    |
| Edge           | 79+      | 完整支持                    |
| iOS Safari     | 11+      | 仅支持Safari，不支持WebView |
| Android Chrome | 60+      | 完整支持                    |
| 微信浏览器     | 最新版   | 仅支持静态图像处理          |

## 性能优化建议

1. **按需加载**：仅引入所需模块，减少首次加载时间
2. **预加载模型**：提前加载OCR模型，避免首次识别延迟
3. **适当降低分辨率**：处理前将图像缩小到合适尺寸（约1000px宽）
4. **开启缓存**：对于相似图像，启用结果缓存
5. **使用Web Worker**：处理大量图像时开启多线程

## 应用场景

- **网上银行身份验证**：快速验证用户身份信息
- **酒店登记系统**：自动录入住客信息
- **自助服务终端**：无需人工，自动处理证件信息
- **企业内部系统**：员工证件信息采集
- **活动签到系统**：快速扫码签到与证件登记

## 后续开发计划

- [ ] 身份证防伪识别功能
- [ ] 护照和其他证件支持
- [ ] 离线模型支持
- [ ] 人脸比对功能
- [ ] WebAssembly优化

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议。请通过GitHub Issues或Pull Requests参与项目。

## 许可证

本项目采用MIT许可证。详见[LICENSE](LICENSE)文件。

---

<p align="center">
  <a href="https://github.com/agions/id-scanner-lib">GitHub</a> • 
  <a href="https://www.npmjs.com/package/id-scanner-lib">NPM</a> • 
  <a href="https://github.com/agions/id-scanner-lib/issues">Issues</a>
</p>
