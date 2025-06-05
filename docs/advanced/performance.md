---
title: 性能优化
description: ID-Scanner-Lib 性能优化最佳实践与技巧
---

# 性能优化

ID-Scanner-Lib 提供了多种性能优化选项，帮助您在不同设备和网络环境下获得最佳体验。本文档将介绍如何优化库的性能，减少资源消耗，提高识别速度。

## 图像处理优化

### 图像尺寸控制

较大的图像会增加处理时间和内存消耗。可以通过以下方式控制图像尺寸：

```javascript
import { IDScanner } from "id-scanner-lib"

const scanner = new IDScanner({
  idCard: {
    ocr: {
      // 限制处理图像的最大尺寸
      maxImageDimension: 1000,
    },
  },
})
```

### 图像预处理

根据实际需求调整图像预处理参数：

```javascript
const idCardModule = scanner.getIDCardModule({
  imageProcessing: {
    // 仅应用必要的预处理步骤
    preprocess: true,
    enhance: true,
    denoise: false, // 如果图像质量较好，可以禁用降噪
    binarize: false, // 二值化可能在某些场景下不需要
  },
})
```

## 缓存策略

ID-Scanner-Lib 内置了 LRU 缓存机制，可以避免重复处理相同的图像：

```javascript
const scanner = new IDScanner({
  idCard: {
    ocr: {
      // 启用结果缓存
      enableCache: true,
      // 设置缓存大小
      cacheSize: 50,
    },
  },
})
```

## Web Workers 多线程处理

启用 Web Workers 可以将计算密集型任务移至后台线程，避免阻塞主线程：

```javascript
const scanner = new IDScanner({
  useWorker: true,
  workerOptions: {
    maxConcurrency: 2, // 最大并发 Worker 数量
    terminateAfterIdle: true, // 空闲后自动终止 Worker
    idleTimeout: 30000, // Worker 空闲 30 秒后终止
  },
})
```

详细信息请参阅 [Web Workers 多线程处理](/advanced/web-workers)。

## 模型选择

针对不同设备性能选择合适的模型：

```javascript
import { IDScanner, DevicePerformance } from "id-scanner-lib"

// 检测设备性能
const devicePerformance = DevicePerformance.detect()

const scanner = new IDScanner({
  face: {
    detector: {
      // 根据设备性能选择模型
      modelSize: devicePerformance.isLowEnd ? "tiny" : "full",
    },
  },
})
```

## 按需加载

只初始化和加载需要使用的模块：

```javascript
const scanner = new IDScanner({
  // 只启用需要的模块
  enableIDCard: true,
  enableQRCode: false,
  enableFace: false,
})
```

## 资源释放

不再使用时，及时释放资源：

```javascript
// 使用完毕后释放资源
await scanner.dispose()
```

## 性能监控

ID-Scanner-Lib 提供了性能监控功能，帮助您识别性能瓶颈：

```javascript
import { IDScanner, PerformanceMonitor } from "id-scanner-lib"

// 创建性能监控实例
const monitor = new PerformanceMonitor()

// 监听性能事件
scanner.on("performance", (stats) => {
  console.log("处理时间:", stats.processingTime)
  console.log("内存使用:", stats.memoryUsage)
})

// 获取性能报告
const report = monitor.getReport()
console.log(report)
```

## 环境适配

根据不同环境自动调整配置：

```javascript
const scanner = new IDScanner({
  adaptiveConfig: true,
  environmentProfiles: {
    // 桌面高性能配置
    desktop: {
      recognitionMode: "accurate",
      useWorker: true,
      workerCount: 4,
    },
    // 移动设备配置
    mobile: {
      recognitionMode: "balanced",
      useWorker: true,
      workerCount: 1,
      optimizeForBattery: true,
    },
    // 低端设备配置
    lowEnd: {
      recognitionMode: "fast",
      useWorker: false,
      lowResolutionModel: true,
    },
  },
})
```

## 性能优化最佳实践

1. **选择合适的模型**：对于移动设备，使用轻量级模型
2. **按需初始化**：只初始化需要使用的模块
3. **资源释放**：不使用时调用 `dispose()` 方法释放资源
4. **设置合理的扫描频率**：根据设备性能调整 `scanFrequency`
5. **减少同时检测的人脸数**：通过 `maxFaces` 限制
6. **仅加载需要的特性**：如不需要表情识别，将 `withAttributes` 设为 `false`
7. **优化图像尺寸**：处理前调整图像尺寸，减少内存占用
8. **使用 Web Workers**：将计算密集型任务移至后台线程
9. **启用缓存**：避免重复处理相同的图像
10. **渐进增强**：根据设备能力启用高级特性
