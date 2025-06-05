---
title: 二维码扫描
description: ID-Scanner-Lib 二维码扫描功能使用指南
---
# 二维码扫描

ID-Scanner-Lib 提供了强大的二维码和条形码扫描功能，支持多种码类型，并且针对不同场景进行了优化。本指南将介绍如何使用二维码扫描功能。

## 支持的码类型

ID-Scanner-Lib 支持以下类型的二维码和条形码：

- **二维码**

  - QR Code（常见的方形二维码）
  - Data Matrix（常用于工业和医疗领域）
  - Aztec Code（常用于交通票据）
- **条形码**

  - Code 128（高密度字母数字条形码）
  - Code 39（工业领域常用条形码）
  - EAN-13（商品条形码）
  - UPC-A（北美商品条形码）
  - UPC-E（UPC-A的压缩版本）
  - ITF（交叉二五条形码）
  - Codabar（图书馆和医疗领域常用）

## 基本使用

### 初始化扫描器

首先，需要创建并初始化 IDScanner 实例：

```javascript
import { IDScanner } from "id-scanner-lib"

async function initScanner() {
  // 创建扫描器实例
  const scanner = new IDScanner()

  // 初始化扫描器
  await scanner.initialize()

  return scanner
}
```

### 获取二维码模块

初始化扫描器后，可以获取二维码模块：

```javascript
const scanner = await initScanner()

// 获取二维码模块
const qrcodeModule = scanner.getQRCodeModule({
  // 可选配置
  scanner: {
    minConfidence: 0.7, // 最小置信度
    tryMultipleScan: true, // 尝试多次扫描
    returnImage: false, // 是否返回图像数据
  },
  imageProcess: {
    preprocess: true, // 启用图像预处理
    enhanceContrast: true, // 增强对比度
    threshold: 128, // 二值化阈值
  },
})
```

### 从图像扫描二维码

可以从图像元素（如 `<img>`、`<canvas>` 或 `ImageData`）中扫描二维码：

```javascript
async function scanFromImage() {
  const imageElement = document.getElementById("qrcode-image")

  try {
    const result = await qrcodeModule.scan(imageElement)

    if (result) {
      console.log("扫描结果:", result.data)
      console.log("码类型:", result.type)
      console.log("置信度:", result.confidence)
    } else {
      console.log("未检测到二维码")
    }
  } catch (error) {
    console.error("扫描失败:", error)
  }
}
```

### 实时扫描（摄像头）

要实现实时扫描，需要结合摄像头捕获和二维码模块：

```javascript
async function startLiveScanning() {
  const videoElement = document.getElementById("camera-preview")
  const resultElement = document.getElementById("scan-result")

  try {
    // 启动摄像头
    await qrcodeModule.startCapture(videoElement, {
      facingMode: "environment", // 使用后置摄像头
      resolution: "hd", // 高清分辨率
    })

    // 开始实时扫描
    qrcodeModule.startScanning({
      scanFrequency: 3, // 每秒扫描次数
      highlightCode: true, // 高亮显示检测到的码
      highlightColor: "#00FF00", // 高亮颜色
      beepOnSuccess: true, // 成功时发出提示音
      vibrateOnSuccess: true, // 成功时振动（移动设备）
    })

    // 监听扫描结果
    qrcodeModule.on("codeDetected", (result) => {
      resultElement.textContent = `内容: ${result.data} (${result.type})`

      // 可选：检测到结果后停止扫描
      // qrcodeModule.stopScanning();
    })
  } catch (error) {
    console.error("启动实时扫描失败:", error)
  }
}

// 停止扫描
function stopScanning() {
  qrcodeModule.stopScanning()
  qrcodeModule.stopCapture()
}
```

## 高级功能

### 自定义扫描区域

可以限制扫描区域，提高性能并减少误识别：

```javascript
qrcodeModule.startScanning({
  scanRegion: {
    left: 0.2, // 左边界（相对于视频宽度的比例，0-1）
    top: 0.3, // 上边界（相对于视频高度的比例，0-1）
    width: 0.6, // 宽度（相对于视频宽度的比例，0-1）
    height: 0.4, // 高度（相对于视频高度的比例，0-1）
  },
})
```

### 多码同时扫描

支持在同一图像中识别多个二维码：

```javascript
const results = await qrcodeModule.scanMultiple(imageElement)

results.forEach((result, index) => {
  console.log(`码 ${index + 1}:`, result.data)
})
```

### 过滤特定码类型

可以指定只扫描特定类型的码：

```javascript
const qrcodeModule = scanner.getQRCodeModule({
  formats: ["qr", "ean_13", "code_128"], // 只扫描这些类型
})
```

### 处理复杂场景

对于难以识别的二维码（如低对比度、部分遮挡等），可以调整高级参数：

```javascript
const qrcodeModule = scanner.getQRCodeModule({
  scanner: {
    tryHarder: true, // 更努力地尝试识别
    tryInverted: true, // 尝试反色识别
    tryRotate: true, // 尝试旋转图像识别
    maxRotation: 45, // 最大旋转角度
    minConfidence: 0.5, // 降低置信度阈值
  },
  imageProcess: {
    preprocess: true,
    enhanceContrast: true,
    adaptiveThreshold: true, // 使用自适应阈值
    denoiseLevel: 2, // 降噪级别
  },
})
```

## 性能优化

### 调整扫描频率

在实时扫描中，可以根据设备性能调整扫描频率：

```javascript
// 低端设备
qrcodeModule.startScanning({ scanFrequency: 1 }) // 每秒扫描1次

// 高性能设备
qrcodeModule.startScanning({ scanFrequency: 5 }) // 每秒扫描5次
```

### 使用 Web Workers

启用 Web Workers 可以将扫描过程移至后台线程，避免阻塞主线程：

```javascript
const scanner = new IDScanner({
  useWorker: true,
  qrCode: {
    workerEnabled: true,
  },
})
```

详细信息请参阅 [Web Workers 多线程处理](/advanced/web-workers) 和 [性能优化](/advanced/performance) 文档。

## 错误处理

二维码扫描过程中可能遇到各种错误，应当妥善处理：

```javascript
try {
  const result = await qrcodeModule.scan(imageElement)
  // 处理结果
} catch (error) {
  if (error.name === "QRScanError") {
    console.error("二维码扫描错误:", error.message)
  } else if (error.name === "CameraAccessError") {
    console.error("摄像头访问错误:", error.message)
  } else {
    console.error("未知错误:", error)
  }
}
```

更多错误处理信息，请参阅 [错误处理](/guide/error-handling) 文档。

## 实际应用示例

### 商品条码扫描

```javascript
const barcodeScanner = scanner.getQRCodeModule({
  formats: ["ean_13", "upc_a", "upc_e"], // 只扫描商品条码
  scanner: {
    minConfidence: 0.8, // 提高置信度要求
  },
})

// 扫描后查询商品信息
barcodeScanner.on("codeDetected", async (result) => {
  const productInfo = await fetchProductInfo(result.data)
  displayProductInfo(productInfo)
})
```

### 二维码登录

```javascript
const loginScanner = scanner.getQRCodeModule({
  formats: ["qr"], // 只扫描QR码
})

loginScanner.on("codeDetected", async (result) => {
  try {
    // 假设二维码内容是登录令牌
    const loginToken = result.data
    const loginResult = await verifyLoginToken(loginToken)

    if (loginResult.success) {
      showLoginSuccess(loginResult.user)
      loginScanner.stopScanning()
    }
  } catch (error) {
    showLoginError(error.message)
  }
})
```

## 总结

ID-Scanner-Lib 的二维码扫描功能强大而灵活，可以满足各种应用场景的需求。通过合理配置和优化，可以实现高效、准确的二维码识别体验。
