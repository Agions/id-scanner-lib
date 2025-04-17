# ID-Scanner-Lib

纯前端实现的TypeScript身份证与二维码识别库，无需后端支持，所有处理均在浏览器端完成。结合高性能图像处理与OCR技术，提供完整的识别解决方案。

[![NPM Version](https://img.shields.io/npm/v/id-scanner-lib.svg)](https://www.npmjs.com/package/id-scanner-lib)
[![GitHub Stars](https://img.shields.io/github/stars/agions/id-scanner-lib.svg?style=social)](https://github.com/agions/id-scanner-lib)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/id-scanner-lib)](https://bundlephobia.com/package/id-scanner-lib)
[![License](https://img.shields.io/npm/l/id-scanner-lib.svg)](https://github.com/agions/id-scanner-lib/blob/master/LICENSE)

## 技术特性

- **高性能识别引擎**：针对浏览器环境优化的识别算法，支持实时处理
- **二维码扫描**：基于jsQR实现高精度二维码识别与解码
- **条形码识别**：支持EAN-13、CODE-128等常见一维码格式
- **身份证OCR**：基于Tesseract.js的优化OCR引擎，精确提取身份证信息
- **身份证防伪检测**：检测多种防伪特征，有效识别伪造证件
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
| 防伪检测   | 100-200ms    | >85%   | 多特征综合分析   |
| 图像处理   | 20-100ms     | -      | 视处理操作而定   |

## 最新版本 (v1.3.2)

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
  - **身份证防伪检测**：识别多种防伪特征，检测伪造证件
    - 支持荧光油墨、微缩文字、光变图案等5种防伪特征检测
    - 基于多特征综合评分，提供置信度评估
    - 缓存机制提高重复检测性能
- **架构改进**：
  - 资源自动释放机制
  - 更精细的模块划分
  - 增强的错误处理

## 版本路线图

### v1.4.0：人脸比对与活体检测

- **人脸比对模块**：
  - 身份证照片与现场采集照片的比对功能
  - 基于深度学习的人脸特征提取与分析
  - 提供相似度评分与置信度
- **活体检测**：
  - 眨眼、张嘴等动作检测防止照片欺骗
  - 基于光线反射的3D检测技术
  - 多帧分析提高检测准确率
- **安全增强**：
  - 本地处理所有数据，保护隐私
  - 结果加密存储选项
  - 合规性验证工具

### v1.5.0：多证件类型支持

- **护照识别**：
  - MRZ码（机读区）解析
  - 多国护照模板适配
  - 芯片信息读取（ePassport支持）
- **驾驶证识别**：
  - 驾驶证OCR识别
  - 驾驶资格与限制条件解析
  - 国际驾照支持
- **营业执照识别**：
  - 企业信息提取
  - 统一社会信用代码验证
  - 经营范围解析
- **银行卡识别**：
  - 卡号、有效期识别
  - 银行标识解析
  - BIN码验证

### v1.6.0：UI/UX改进与组件库升级

- **现代化UI框架**：
  - 基于Web Components的组件系统
  - 自适应扫描界面
  - 多主题支持（含暗色模式）
- **交互体验优化**：
  - 实时扫描引导框
  - 智能对焦与取景提示
  - 证件边缘自动检测与校正
- **可访问性支持**：
  - 屏幕阅读器兼容
  - 键盘导航
  - 多语言本地化
- **动效与反馈**：
  - 平滑过渡动画
  - 触觉反馈（移动设备）
  - 声音反馈与语音提示

### v1.7.0：性能与架构优化

- **WebAssembly实现**：
  - 核心图像处理算法WASM化
  - 性能提升3-5倍
  - 更低的CPU占用
- **离线支持**：
  - 完整离线运行能力
  - 基于IndexedDB的本地缓存
  - Service Worker支持
- **微前端集成**：
  - React/Vue/Angular专用组件
  - 更简单的集成API
  - TypeScript类型增强
- **渐进式加载**：
  - 核心功能快速加载
  - 按需延迟加载附加模块
  - 预测性加载提高响应速度

### v2.0.0：企业级解决方案

- **云端协同验证**：
  - 可选云端验证API
  - 本地与云端结果比对
  - 多级安全验证
- **高级分析功能**：
  - 证件使用统计与分析
  - 风险评估模型
  - 异常检测系统
- **行业解决方案包**：
  - 金融行业KYC流程集成
  - 酒店/零售快速登记系统
  - 政务/安防高安全性验证
- **企业级管理功能**：
  - 多租户支持
  - 批量处理队列
  - 完整审计日志

## 系统架构

```
┌────────────────────────────────────────────────────────────┐
│                       IDScanner 主模块                      │
├─────────────┬─────────────────┬────────────────────────────┤
│  QRScanner  │  BarcodeScanner │        IDCardDetector      │
├─────────────┴─────────────────┴────────────────────────────┤
│                 Camera (视频流捕获与处理)                     │
└────────────────────────────────────────────────────────────┘
                           ▲
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│                   核心处理引擎                               │
├─────────────────┬─────────────────┬────────────────────────┤
│  OCRProcessor   │  DataExtractor  │     ImageProcessor     │
│  (文字识别)      │  (数据提取验证)   │    (图像预处理)          │
├─────────────────┴─────────────────┴────────────────────────┤
│              AntiFakeDetector (身份证防伪检测)                │
└────────────────────────────────────────────────────────────┘
```

## 安装与使用

### NPM安装

```bash
npm install id-scanner-lib --save
```

### CDN引入

```html
<!-- 生产环境 (压缩版) -->
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib@1.3.1/dist/id-scanner.min.js"></script>

<!-- 开发环境 (未压缩) -->
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib@1.3.1/dist/id-scanner.js"></script>
```

## 包体积优化

v1.3.1版本通过代码分割和Tree-shaking极大地优化了包体积：

| 模块            | 大小 (gzip) | 说明             |
| --------------- | ----------- | ---------------- |
| 完整包(min.js)  | 93KB        | 包含所有功能     |
| 核心包(min.js)  | 186KB       | 基础功能，无OCR  |
| OCR模块(min.js) | 70KB        | 仅文字识别       |
| QR模块(min.js)  | 60KB        | 仅二维码识别     |
| ESM模块         | 各模块更小  | 支持Tree-shaking |

## 最佳实践：按需引入

### 完整引入

```javascript
// 引入完整功能
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  onQRCodeScanned: (result) => console.log('扫描结果:', result),
  onIDCardScanned: (info) => console.log('身份证信息:', info),
  onAntiFakeDetected: (result) => console.log('防伪检测结果:', result)
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
  
    // 检查防伪检测结果
    if (idInfo.antiFakeResult) {
      console.log('防伪检测结果:', idInfo.antiFakeResult);
      if (idInfo.antiFakeResult.isAuthentic) {
        console.log('证件验证通过');
      } else {
        console.log('警告：可能为伪造证件');
      }
    }
  } catch (error) {
    console.error('处理失败:', error);
  }
});
```

### 身份证防伪检测

```javascript
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  // 防伪检测结果回调
  onAntiFakeDetected: (result) => {
    if (result.isAuthentic) {
      console.log('身份证验证通过，检测到的防伪特征：', result.detectedFeatures);
    } else {
      console.log('警告：可能是伪造证件！', result.message);
      // 显示安全提示
      document.getElementById('warning').style.display = 'block';
    }
  }
});

await scanner.initialize();

// 方法1：单独进行防伪检测
const antiFakeResult = await scanner.detectIDCardAntiFake(idCardImage);
console.log('防伪检测结果：', antiFakeResult);
console.log('检测置信度：', antiFakeResult.confidence);

// 方法2：身份证识别时自动进行防伪检测
const idInfo = await scanner.processIDCardImage(idCardImage);
// 防伪检测结果包含在返回的信息中
if (idInfo.antiFakeResult && idInfo.antiFakeResult.isAuthentic) {
  // 身份证真实，继续处理
} else {
  // 提示可能为伪造证件
}
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

### 身份证防伪检测技术

防伪检测模块能识别身份证中的多种防伪特征：

1. **荧光油墨特征**：检测特定区域的荧光反应模式
2. **微缩文字**：识别证件上的微小文字，伪造证件难以复制
3. **光变图案**：检测特定角度下的光变效果
4. **雕刻凹印**：通过纹理检测特定的凹印模式
5. **隐形图案**：识别证件上的幽灵图像和隐形水印

算法结合多种图像处理技术：

- 特定光谱通道提取与分析
- 边缘检测与微文字模式识别
- 对比度与光照调整突出隐形特征
- 自适应阈值处理增强识别准确度

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

- **网上银行身份验证**：快速验证用户身份信息，检测伪造证件
- **酒店登记系统**：自动录入住客信息并验证证件真伪
- **自助服务终端**：无需人工，自动处理证件信息
- **企业内部系统**：员工证件信息采集与验证
- **活动签到系统**：快速扫码签到与证件登记

## 发布指南

### 发布到NPM

```bash
# 1. 确保版本号正确
npm version [patch|minor|major]

# 2. 构建生产版本
npm run build:prod

# 3. 发布到NPM
npm publish

# 4. 生成标签
git push origin --tags
```

### 发布到GitHub

```bash
# 1. 提交代码变更
git add .
git commit -m "发布 v1.x.x"

# 2. 推送到GitHub
git push origin main

# 3. 创建Release
# 访问 https://github.com/agions/id-scanner-lib/releases/new
# 选择对应的标签，填写Release说明
```

## 贡献指南

欢迎贡献代码、报告问题或提出新功能建议。请通过GitHub Issues或Pull Requests参与项目。

1. Fork项目仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m '添加一些很棒的功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 许可证

本项目采用MIT许可证。详见[LICENSE](LICENSE)文件。

---

<p align="center">
  <a href="https://github.com/agions/id-scanner-lib">GitHub</a> • 
  <a href="https://www.npmjs.com/package/id-scanner-lib">NPM</a> • 
  <a href="https://github.com/agions/id-scanner-lib/issues">Issues</a> •
  <a href="https://github.com/agions/id-scanner-lib/releases">Releases</a>
</p>
