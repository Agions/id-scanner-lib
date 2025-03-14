# ID-Scanner-Lib

纯前端实现的TypeScript身份证&二维码识别库，无需后端支持，所有处理在浏览器端完成。

## 主要功能

- **二维码扫描识别**：实时识别摄像头中的二维码
- **条形码扫描识别**：支持常见一维条形码格式识别
- **身份证检测**：自动检测和定位摄像头中的身份证
- **OCR信息提取**：从身份证图像中提取文字信息
- **数据验证与增强**：验证身份证号码格式，并通过多种方式补充缺失信息

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                       IDScanner 主类                        │
├─────────────┬─────────────────┬────────────────────────────┤
│  QRScanner  │  BarcodeScanner │        IDCardDetector      │
├─────────────┴─────────────────┴────────────────────────────┤
│                 Camera (视频流捕获与处理)                    │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   数据处理与识别模块                         │
├─────────────────┬─────────────────┬────────────────────────┤
│  OCRProcessor   │  DataExtractor  │     ImageProcessor     │
│  (文字识别)      │  (数据提取验证)  │     (图像预处理)       │
└─────────────────┴─────────────────┴────────────────────────┘
```

## 安装

```bash
npm install id-scanner-lib
```

## 优化引入方式

本库支持多种引入方式，可根据实际需求选择最优方案，减小应用体积：

### 完整引入
```javascript
// 引入完整包（包含全部功能）
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  onQRCodeScanned: (result) => console.log('扫描结果:', result),
  onIDCardScanned: (info) => console.log('身份证信息:', info)
});
```

### 按需引入
```javascript
// 只引入二维码相关功能，减小应用体积
import { ScannerModule } from 'id-scanner-lib/qr';

const qrScanner = new ScannerModule({
  onQRCodeScanned: (result) => console.log('二维码:', result)
});
```

```javascript
// 只引入OCR身份证识别功能
import { OCRModule } from 'id-scanner-lib/ocr';

const ocrScanner = new OCRModule({
  onIDCardScanned: (info) => console.log('身份证信息:', info)
});
```

```javascript
// 只引入轻量核心功能（无OCR）
import { IDScannerCore } from 'id-scanner-lib/core';

const coreScanner = new IDScannerCore({
  onQRCodeScanned: (result) => console.log('扫描结果:', result)
});
```

## 快速开始

### 基本用法

```javascript
import { IDScanner } from 'id-scanner-lib';

// 创建扫描器实例
const scanner = new IDScanner({
  // 二维码识别回调
  onQRCodeScanned: (result) => {
    console.log('扫描到二维码:', result);
  },
  
  // 条形码识别回调
  onBarcodeScanned: (result) => {
    console.log('扫描到条形码:', result);
  },
  
  // 身份证识别回调
  onIDCardScanned: (info) => {
    console.log('识别到身份证信息:', info);
  },
  
  // 错误处理
  onError: (error) => {
    console.error('扫描出错:', error);
  }
});

// 初始化
await scanner.initialize();

// 启动二维码扫描
const videoElement = document.getElementById('video');
await scanner.startQRScanner(videoElement);

// 切换到身份证识别
scanner.stop();
await scanner.startIDCardScanner(videoElement);

// 使用结束后释放资源
scanner.terminate();
```

### 演示代码

查看 `examples/index.html` 获取完整的演示代码。

## 详细API文档

### IDScanner 主类

```typescript
class IDScanner {
  // 构造函数
  constructor(options?: IDScannerOptions);
  
  // 初始化OCR引擎和资源
  async initialize(): Promise<void>;
  
  // 启动二维码扫描
  async startQRScanner(videoElement: HTMLVideoElement): Promise<void>;
  
  // 启动条形码扫描
  async startBarcodeScanner(videoElement: HTMLVideoElement): Promise<void>;
  
  // 启动身份证扫描
  async startIDCardScanner(videoElement: HTMLVideoElement): Promise<void>;
  
  // 停止当前扫描
  stop(): void;
  
  // 释放所有资源
  async terminate(): Promise<void>;
}
```

### 类型定义

```typescript
// IDScanner配置选项
interface IDScannerOptions {
  // 相机配置
  cameraOptions?: CameraOptions;
  // 二维码扫描配置
  qrScannerOptions?: QRScannerOptions;
  // 条形码扫描配置
  barcodeScannerOptions?: BarcodeScannerOptions;
  // 二维码识别回调
  onQRCodeScanned?: (result: string) => void;
  // 条形码识别回调
  onBarcodeScanned?: (result: string) => void;
  // 身份证识别回调
  onIDCardScanned?: (info: IDCardInfo) => void;
  // 错误处理回调
  onError?: (error: Error) => void;
}

// 相机配置选项
interface CameraOptions {
  width?: number;      // 视频宽度
  height?: number;     // 视频高度
  facingMode?: 'user' | 'environment';  // 前置或后置摄像头
}

// 识别结果的身份证信息
interface IDCardInfo {
  name?: string;         // 姓名
  gender?: string;       // 性别
  nationality?: string;  // 民族
  birthDate?: string;    // 出生日期，如"1990-01-01"
  address?: string;      // 地址
  idNumber?: string;     // 身份证号码 
  issuingAuthority?: string; // 签发机关
  validPeriod?: string;  // 有效期限
}
```

## 高级用法

### 自定义相机配置

```javascript
const scanner = new IDScanner({
  cameraOptions: {
    width: 1280,
    height: 720,
    facingMode: 'environment' // 使用后置摄像头，更适合扫描
  },
  onIDCardScanned: (info) => {
    console.log('识别到身份证信息:', info);
  }
});
```

### 调整扫描频率

```javascript
const scanner = new IDScanner({
  qrScannerOptions: {
    scanInterval: 100 // 每100ms扫描一次，默认为200ms
  },
  onQRCodeScanned: (result) => {
    console.log('扫描到二维码:', result);
  }
});
```

### 直接使用子模块

```javascript
import { QRScanner, ImageProcessor } from 'id-scanner-lib';

// 单独使用二维码扫描功能
const qrScanner = new QRScanner({
  onScan: (result) => {
    console.log('扫描到二维码:', result);
  }
});

// 使用图像处理工具
const enhancedImage = ImageProcessor.adjustBrightnessContrast(
  originalImageData,
  10,  // 亮度调整
  20   // 对比度调整
);
```

## 性能优化建议

1. **预加载OCR引擎**：在用户可能需要识别身份证前就初始化`OCRProcessor`，避免用户等待。

```javascript
// 页面加载后即初始化，而不是等到用户点击按钮才初始化
document.addEventListener('DOMContentLoaded', async () => {
  const scanner = new IDScanner();
  await scanner.initialize(); // 预先加载OCR引擎
  
  // 保存scanner实例供后续使用
  window.idScanner = scanner;
});
```

2. **减小分辨率**：如果识别速度太慢，可以尝试降低相机分辨率。

```javascript
const scanner = new IDScanner({
  cameraOptions: {
    width: 640,
    height: 480 // 降低分辨率提高处理速度
  }
});
```

3. **关闭不必要的扫描**：不使用时及时停止扫描，节省资源。

## 常见问题解答

**Q: 为什么我在移动设备上无法访问摄像头？**

A: 确保你的网站使用HTTPS协议，现代浏览器要求在安全上下文中才能访问摄像头。

**Q: 身份证识别准确率不高怎么办？**

A: 
- 确保光线充足，避免反光和阴影
- 调整相机对准身份证，使其占据画面大部分区域
- 保持身份证平整，避免弯曲
- 尝试增强图像对比度：`ImageProcessor.adjustBrightnessContrast()`

**Q: 库的大小会不会影响页面加载速度？**

A: 库的大小约为1MB，主要是因为包含OCR引擎。可以考虑按需加载，只在用户需要识别身份证时才加载OCR相关模块。

## 浏览器兼容性

| 浏览器        | 版本要求              | 备注                      |
|--------------|---------------------|--------------------------|
| Chrome       | 60+                 | 全功能支持                 |
| Firefox      | 55+                 | 全功能支持                 |
| Edge         | 79+ (Chromium)      | 全功能支持                 |
| Safari       | 11+                 | iOS需要用户主动点击激活相机  |
| 安卓WebView   | 60+                 | 需要应用授予相机权限        |
| iOS WebView  | 11+                 | 需要用户主动点击激活相机     |

## 体积优化与性能优化

本库设计时考虑了多种使用场景和设备性能限制，提供了多种优化选项：

### 包体积优化
1. **按需引入模块**：基于ES模块可以实现tree-shaking，只引入需要的功能，如：
   ```javascript
   // 只需要二维码功能时，包体积减小约65%
   import { ScannerModule } from 'id-scanner-lib/qr';
   ```

2. **延迟加载OCR引擎**：OCR引擎体积较大，默认采用延迟加载策略：
   ```javascript
   // OCR引擎只在实际使用身份证识别功能时才会加载
   const scanner = new IDScanner();
   
   // 这一步不会加载OCR引擎
   await scanner.startQRScanner(videoElement);
   
   // 只有在需要识别身份证时才会加载OCR引擎
   await scanner.startIDCardScanner(videoElement);
   ```

3. **分包构建**：完整库约1MB，但按功能拆分后最小可达200KB：
   - 核心包 (无OCR): 约200KB
   - 二维码扫描: 约350KB
   - OCR模块: 约650KB

4. **CDN加载**：可以通过CDN加载以加快访问速度：
   ```html
   <!-- 完整版 -->
   <script src="https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner.min.js"></script>
   
   <!-- 或仅加载核心功能 -->
   <script src="https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner-core.min.js"></script>
   ```

5. **版本更新记录**：
   - v1.0.0: 首次发布版本
   - v1.1.0: 模块化重构，实现按需加载，大幅减小体积

### 运行时性能
1. **摄像头参数自动优化**：根据设备性能自动调整摄像头分辨率
2. **OCR引擎缓存**：OCR引擎加载后会缓存，避免重复加载
3. **资源释放**：不使用时自动释放内存资源
4. **图像预处理**：针对不同光线条件优化识别准确率

### 推荐做法
- 在应用初始化阶段，先使用核心功能
- 为OCR等重型功能设置单独的入口或交互按钮
- 在用户可能需要OCR前预加载，但不立即初始化
- 实现加载状态UI反馈，提升用户体验

## 开发与贡献

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/agions/id-scanner-lib.git

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建生产版本
npm run build
```

### 目录结构

```
src/
├── index.ts                # 主入口
├── scanner/                # 扫描模块
│   ├── qr-scanner.ts       # 二维码扫描
│   └── barcode-scanner.ts  # 条形码扫描
├── id-recognition/         # 身份证识别模块
│   ├── id-detector.ts      # 身份证检测
│   ├── ocr-processor.ts    # OCR文字识别
│   └── data-extractor.ts   # 数据提取和验证
└── utils/                  # 工具类
    ├── camera.ts           # 相机访问
    ├── image-processing.ts # 图像处理
    └── types.ts            # 类型定义
```

## 技术实现

- 使用 WebRTC 获取摄像头视频流
- 使用 jsQR 进行二维码识别
- 使用 Tesseract.js 进行OCR文字识别
- 基于 Canvas API 进行图像处理

## 许可证

本项目基于MIT许可证开源。

## 致谢

本项目使用了以下开源库：
- [jsQR](https://github.com/cozmo/jsQR) - 二维码扫描
- [Tesseract.js](https://github.com/naptha/tesseract.js) - OCR文字识别 