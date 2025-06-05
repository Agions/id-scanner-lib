# 身份证识别

本指南介绍如何使用 ID-Scanner-Lib 实现身份证识别功能，包括身份证检测、文本识别和信息提取。

## 功能概述

身份证识别模块 (`IDCardModule`) 提供以下功能：

- 检测图像中的身份证
- 自动识别身份证正反面
- 提取身份证信息（姓名、性别、民族、出生日期、地址、身份证号码等）
- 验证身份证有效性
- 防伪检测（可选功能）

## 基本用法

### 1. 初始化模块

首先，创建并初始化身份证识别模块：

```javascript
import { IDCardModule } from 'id-scanner-lib';

// 创建模块实例
const idCardModule = new IDCardModule();

// 初始化模块
await idCardModule.initialize();
```

### 2. 识别身份证

准备要识别的身份证图像，可以是 `ImageData`、`HTMLImageElement` 或 `HTMLCanvasElement`：

```javascript
// 从图片元素获取
const imageElement = document.getElementById('idcard-image');

// 识别身份证
const idCardInfo = await idCardModule.recognize(imageElement);

// 打印识别结果
console.log('身份证信息:', idCardInfo);
```

### 3. 处理识别结果

识别结果是一个 `IDCardInfo` 对象，包含以下信息：

```javascript
// 获取身份证信息
if (idCardInfo) {
  // 基本信息
  const { name, gender, ethnicity, birthDate, address, idNumber } = idCardInfo;
  
  // 填充表单
  document.getElementById('name').value = name || '';
  document.getElementById('gender').value = gender || '';
  document.getElementById('birthDate').value = birthDate || '';
  document.getElementById('idNumber').value = idNumber || '';
  document.getElementById('address').value = address || '';
}
```

## 高级配置

### 配置选项

创建身份证模块时可以指定多种配置选项：

```javascript
const idCardModule = new IDCardModule({
  // 基本配置
  enabled: true,
  
  // 检测器配置
  detector: {
    minConfidence: 0.7,      // 最小置信度
    enableOCR: true,         // 启用OCR识别
    enableAntiFake: true     // 启用防伪检测
  },
  
  // OCR处理器配置
  ocr: {
    useWorker: true,         // 使用Web Worker处理
    maxImageDimension: 1000, // 最大图像尺寸
    brightness: 10,          // 亮度调整
    contrast: 20             // 对比度调整
  },
  
  // 防伪检测配置
  antiFake: {
    sensitivity: 0.8,        // 敏感度
    minConfidence: 0.7       // 最小置信度
  }
});
```

### 验证身份证信息

使用 `verify` 方法验证身份证信息的有效性：

```javascript
const idCardInfo = await idCardModule.recognize(imageElement);
const verificationResult = idCardModule.verify(idCardInfo);

if (verificationResult.isValid) {
  console.log('身份证验证通过');
} else {
  console.log('身份证验证失败:', verificationResult.failureReason);
  
  // 检查具体原因
  const { idNumberValid, issueDateValid, isExpired } = verificationResult.details;
  
  if (!idNumberValid) {
    console.log('身份证号码无效');
  }
  
  if (isExpired) {
    console.log('身份证已过期');
  }
}
```

## 实时识别示例

以下是一个完整示例，展示如何实现实时身份证识别：

```javascript
import { IDScanner } from 'id-scanner-lib';

// DOM元素
const videoElement = document.getElementById('camera');
const captureButton = document.getElementById('capture-button');
const resultContainer = document.getElementById('result-container');

// 创建扫描器实例
const scanner = new IDScanner();
let stream = null;

// 初始化
async function initialize() {
  try {
    // 初始化扫描器
    await scanner.initialize();
    
    // 获取身份证模块
    const idCardModule = scanner.getIDCardModule();
    
    // 监听识别结果
    idCardModule.on('recognized', ({ idCardInfo }) => {
      displayResult(idCardInfo);
    });
    
    // 启动摄像头
    stream = await scanner.startCamera(videoElement);
    
    // 添加拍照按钮事件
    captureButton.addEventListener('click', captureAndRecognize);
    captureButton.disabled = false;
    
  } catch (error) {
    console.error('初始化失败:', error);
    alert('初始化失败，请检查摄像头权限');
  }
}

// 拍照并识别
async function captureAndRecognize() {
  try {
    // 捕获当前帧
    const frame = scanner.captureFrame(videoElement);
    
    // 获取身份证模块
    const idCardModule = scanner.getIDCardModule();
    
    // 识别身份证
    const idCardInfo = await idCardModule.recognize(frame);
    
    // 显示结果
    displayResult(idCardInfo);
    
  } catch (error) {
    console.error('识别失败:', error);
    resultContainer.innerHTML = '<p class="error">识别失败，请重试</p>';
  }
}

// 显示识别结果
function displayResult(idCardInfo) {
  if (!idCardInfo || !idCardInfo.idNumber) {
    resultContainer.innerHTML = '<p class="warning">未检测到有效身份证，请调整角度和光线</p>';
    return;
  }
  
  // 验证身份证
  const idCardModule = scanner.getIDCardModule();
  const verificationResult = idCardModule.verify(idCardInfo);
  
  // 构建结果HTML
  let html = '<div class="card-info">';
  html += `<h3>身份证信息 ${verificationResult.isValid ? '<span class="valid">有效</span>' : '<span class="invalid">无效</span>'}</h3>`;
  
  if (idCardInfo.name) html += `<p><strong>姓名:</strong> ${idCardInfo.name}</p>`;
  if (idCardInfo.gender) html += `<p><strong>性别:</strong> ${idCardInfo.gender}</p>`;
  if (idCardInfo.ethnicity) html += `<p><strong>民族:</strong> ${idCardInfo.ethnicity}</p>`;
  if (idCardInfo.birthDate) html += `<p><strong>出生日期:</strong> ${idCardInfo.birthDate}</p>`;
  if (idCardInfo.address) html += `<p><strong>地址:</strong> ${idCardInfo.address}</p>`;
  if (idCardInfo.idNumber) html += `<p><strong>身份证号:</strong> ${idCardInfo.idNumber}</p>`;
  
  if (!verificationResult.isValid) {
    html += `<p class="error"><strong>错误原因:</strong> ${verificationResult.failureReason}</p>`;
  }
  
  html += '</div>';
  resultContainer.innerHTML = html;
}

// 清理资源
function cleanup() {
  if (stream) {
    scanner.stopCamera(stream);
    stream = null;
  }
  
  scanner.dispose();
}

// 初始化页面
initialize();

// 页面关闭时清理资源
window.addEventListener('beforeunload', cleanup);
```

## 最佳实践

### 提高识别率

1. **调整光线** - 确保身份证在均匀光线下，避免强烈反光
2. **保持平整** - 身份证应尽量平整放置，避免弯曲变形
3. **合适距离** - 使身份证占据图像的70%以上区域
4. **清晰图像** - 避免模糊或亮度过低的图像
5. **图像增强** - 调整OCR配置中的亮度和对比度参数

### 图像预处理

对图像进行预处理可以明显提高识别率：

```javascript
import { ImageProcessor } from 'id-scanner-lib';

// 载入图像
const originalImage = await ImageProcessor.createImageDataFromFile(fileInput.files[0]);

// 应用图像预处理
const processedImage = ImageProcessor.batchProcess(originalImage, {
  brightness: 10,       // 适度提高亮度
  contrast: 20,         // 增加对比度
  sharpen: true,        // 锐化
  grayscale: false      // 保留彩色信息
});

// 识别预处理后的图像
const idCardInfo = await idCardModule.recognize(processedImage);
```

### 性能优化

1. **使用Web Worker** - 启用 `useWorker: true` 选项将OCR处理放在后台线程
2. **降低分辨率** - 对大尺寸图像，设置合理的 `maxImageDimension` 值
3. **缓存结果** - 对于相同或相似图像，可以缓存识别结果

```javascript
const idCardModule = new IDCardModule({
  ocr: {
    useWorker: true,
    maxImageDimension: 1200,
    enableCache: true,
    cacheSize: 10  // 缓存最近的10个结果
  }
});
```

## 常见问题

### 1. 识别速度慢

- 检查图像大小，过大的图像会导致识别变慢
- 启用Web Worker进行后台处理
- 降低图像分辨率到合适级别

### 2. 识别率低

- 检查光线条件，避免过亮或过暗
- 调整图像亮度和对比度
- 确保身份证在图像中清晰可见
- 尝试不同的预处理参数

### 3. 信息提取不完整

- 确保身份证文本区域未被遮挡
- 清洁身份证表面，去除污渍或反光
- 将OCR参数中的对比度调高些

### 4. 小图像识别问题

对于小尺寸图像，可以禁用自动缩放：

```javascript
const idCardModule = new IDCardModule({
  ocr: {
    maxImageDimension: 2000, // 设置更大值避免缩小
    // 其他配置...
  }
});
``` 