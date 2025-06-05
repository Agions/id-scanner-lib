---
title: 二维码扫描演示
description: ID-Scanner-Lib 二维码扫描功能演示与代码示例
---

# 二维码扫描演示

此页面展示了 ID-Scanner-Lib 的二维码扫描功能，支持各种类型的二维码和条形码。

## 支持的码类型

- **二维码**：QR Code、Data Matrix、Aztec Code
- **条形码**：Code 128、Code 39、EAN-13、UPC-A、UPC-E、ITF等

## 功能演示

由于浏览器安全限制，在此文档站点无法直接调用摄像头。您可以下载完整的演示代码在本地运行，或参考下方的实现方式进行集成。

## 实时扫描实现

以下是实现实时二维码扫描的核心代码：

```javascript
import { IDScanner } from 'id-scanner-lib';

async function initQRCodeScanner() {
  // 初始化扫描器
  const scanner = new IDScanner();
  await scanner.initialize();
  
  // 获取二维码模块
  const qrcodeModule = scanner.getQRCodeModule({
    formats: ['qr', 'code_128', 'ean_13'], // 指定要扫描的码类型
    continuous: true,                     // 连续扫描模式
    tryHarder: true                       // 增强扫描能力
  });
  
  return qrcodeModule;
}

// 启动摄像头并扫描
async function startLiveScanning(qrcodeModule) {
  const videoElement = document.getElementById('scanner-video');
  const resultElement = document.getElementById('scan-result');
  
  try {
    // 启动摄像头
    await qrcodeModule.startCapture(videoElement, {
      facingMode: 'environment', // 后置摄像头
      resolution: 'hd'           // 高清分辨率
    });
    
    // 开始扫描
    qrcodeModule.startScanning();
    
    // 监听扫描结果
    qrcodeModule.on('scan', (result) => {
      // 显示扫描结果
      resultElement.innerHTML = `
        <div class="scan-result-card">
          <h3>扫描结果</h3>
          <p><strong>码类型:</strong> ${result.format}</p>
          <p><strong>内容:</strong> ${result.text}</p>
        </div>
      `;
      
      // 可选：扫描到结果后暂停
      // qrcodeModule.pauseScanning();
    });
  } catch (error) {
    console.error('启动扫描失败:', error);
    resultElement.innerHTML = `<p class="error">启动摄像头失败: ${error.message}</p>`;
  }
}

// 停止扫描
function stopScanning(qrcodeModule) {
  qrcodeModule.stopScanning();
  qrcodeModule.stopCapture();
}
```

## 从图片扫描

除了实时扫描外，还可以从静态图片中扫描二维码：

```javascript
async function scanFromImage(qrcodeModule, imageElement) {
  try {
    const result = await qrcodeModule.scanImage(imageElement);
    
    if (result.length > 0) {
      // 显示结果
      const resultHTML = result.map(code => `
        <div class="scan-result-item">
          <p><strong>码类型:</strong> ${code.format}</p>
          <p><strong>内容:</strong> ${code.text}</p>
        </div>
      `).join('');
      
      document.getElementById('scan-result').innerHTML = resultHTML;
    } else {
      document.getElementById('scan-result').innerHTML = '<p>未检测到二维码</p>';
    }
  } catch (error) {
    console.error('扫描图片失败:', error);
    document.getElementById('scan-result').innerHTML = `<p class="error">扫描失败: ${error.message}</p>`;
  }
}
```

## 高级功能

### 多码同时扫描

ID-Scanner-Lib 支持同时扫描多个二维码：

```javascript
const qrcodeModule = scanner.getQRCodeModule({
  detectMultiple: true,   // 启用多码检测
  maxCodes: 5            // 最多检测5个码
});
```

### 自定义扫描区域

可以限定扫描区域，提高扫描效率：

```javascript
qrcodeModule.startScanning({
  scanRegion: {
    left: 0.2,    // 左边界（占视频宽度百分比）
    top: 0.2,     // 上边界
    width: 0.6,   // 宽度
    height: 0.6   // 高度
  }
});
```

### 自定义扫描设置

```javascript
const qrcodeModule = scanner.getQRCodeModule({
  // 码类型
  formats: ['qr', 'code_128', 'data_matrix', 'ean_13'],
  
  // 性能选项
  useWorker: true,     // 使用Web Worker
  tryHarder: true,     // 增强扫描能力
  
  // 用户体验
  highlightFound: true, // 高亮显示已检测到的码
  beepOnSuccess: true,  // 扫描成功时发出提示音
  
  // 特殊选项
  inverted: false,     // 反色码扫描
  autostart: true      // 自动开始扫描
});
```

## 常见问题解决

### 扫描不准确

如果扫描结果不准确，可以尝试以下方法：

1. 使用 `tryHarder: true` 选项增强扫描能力
2. 改善光照条件，避免强光和明显阴影
3. 调整扫描距离，保持适当的扫描角度
4. 尝试不同的分辨率设置

### 移动设备摄像头授权

在移动设备上使用摄像头时，需要注意：

1. 确保网站使用 HTTPS 协议
2. 添加适当的摄像头授权请求提示
3. 针对移动设备设置 `facingMode: 'environment'` 使用后置摄像头
