# 人脸识别

本指南介绍如何使用 ID-Scanner-Lib 实现人脸识别功能，包括人脸检测、活体检测和人脸比对。

## 功能概述

人脸识别模块 (`FaceModule`) 提供以下功能：

- 人脸检测与定位
- 面部特征点提取
- 活体检测（防止照片欺骗）
- 人脸属性分析（年龄、性别、表情等）
- 人脸比对（相似度计算）

## 基本用法

### 1. 初始化模块

首先，创建并初始化人脸识别模块：

```javascript
import { FaceModule } from "id-scanner-lib"

// 创建模块实例
const faceModule = new FaceModule()

// 初始化模块
await faceModule.initialize()
```

### 2. 检测人脸

准备要检测的图像，可以是 `ImageData`、`HTMLImageElement` 或 `HTMLCanvasElement`：

```javascript
// 从图片元素获取
const imageElement = document.getElementById("face-image")

// 检测人脸
const faceResult = await faceModule.detectFace(imageElement)

// 打印检测结果
console.log("人脸检测结果:", faceResult)
```

### 3. 处理检测结果

检测结果是一个 `FaceDetectionResult` 对象，包含以下信息：

```javascript
// 获取人脸信息
if (faceResult) {
  // 人脸位置
  const { boundingBox } = faceResult
  console.log(
    `人脸位置: x=${boundingBox.x}, y=${boundingBox.y}, 宽=${boundingBox.width}, 高=${boundingBox.height}`
  )

  // 特征点
  const { landmarks } = faceResult
  console.log("左眼位置:", landmarks.leftEye)
  console.log("右眼位置:", landmarks.rightEye)
  console.log("鼻子位置:", landmarks.nose)
  console.log("嘴巴位置:", landmarks.mouth)

  // 人脸属性
  if (faceResult.attributes) {
    if (faceResult.attributes.gender) {
      console.log(`性别: ${faceResult.attributes.gender.value}`)
    }

    if (faceResult.attributes.age) {
      console.log(`年龄: ${faceResult.attributes.age.value}`)
    }

    if (faceResult.attributes.emotion) {
      console.log(`表情: ${faceResult.attributes.emotion.value}`)
    }
  }

  // 置信度
  console.log(`检测置信度: ${faceResult.confidence}`)
}
```

## 高级功能

### 活体检测

活体检测用于防止照片欺骗，确保检测到的是真实的人脸：

```javascript
// 进行活体检测
const isLive = await faceModule.detectLiveness(imageElement)

if (isLive) {
  console.log("活体检测通过")
} else {
  console.log("活体检测失败，可能是照片")
}
```

### 人脸比对

人脸比对可用于身份验证，比较两张人脸图像的相似度：

```javascript
// 获取两张人脸图像
const faceImage1 = document.getElementById("face-image-1")
const faceImage2 = document.getElementById("face-image-2")

// 比对人脸
const comparisonResult = await faceModule.compareFaces(faceImage1, faceImage2)

// 处理比对结果
console.log(`相似度: ${comparisonResult.similarity}`)
console.log(`是否匹配: ${comparisonResult.isMatch}`)
```

### 实时人脸检测

以下是实现实时人脸检测的示例代码：

```javascript
import { IDScanner } from "id-scanner-lib"

// DOM元素
const videoElement = document.getElementById("camera")
const canvasElement = document.getElementById("overlay")
const resultElement = document.getElementById("result")

// 创建扫描器实例
const scanner = new IDScanner()
let stream = null

// 初始化
async function initialize() {
  try {
    // 初始化扫描器
    await scanner.initialize()

    // 获取人脸模块
    const faceModule = scanner.getFaceModule({
      detector: {
        minConfidence: 0.7,
        detectLandmarks: true,
        detectAttributes: true,
      },
      liveness: {
        enabled: true,
        type: "passive",
      },
    })

    // 启动摄像头
    await faceModule.startCapture(videoElement, {
      facingMode: "user", // 前置摄像头
      resolution: "hd", // 高清分辨率
    })

    // 初始化画布
    const ctx = canvasElement.getContext("2d")
    canvasElement.width = videoElement.videoWidth
    canvasElement.height = videoElement.videoHeight

    // 开始实时人脸检测
    faceModule.startDetection({
      interval: 100, // 每100ms检测一次
      drawLandmarks: true, // 绘制特征点
    })

    // 监听检测结果
    faceModule.on("face:detected", ({ result }) => {
      // 清除画布
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)

      if (result) {
        // 绘制人脸框
        ctx.strokeStyle =
          result.liveness && result.liveness.passed ? "#00ff00" : "#ff0000"
        ctx.lineWidth = 2
        ctx.strokeRect(
          result.boundingBox.x,
          result.boundingBox.y,
          result.boundingBox.width,
          result.boundingBox.height
        )

        // 绘制特征点
        if (result.landmarks) {
          ctx.fillStyle = "#00ffff"
          Object.values(result.landmarks).forEach((point) => {
            ctx.beginPath()
            ctx.arc(point.x, point.y, 2, 0, 2 * Math.PI)
            ctx.fill()
          })
        }

        // 显示检测结果
        let resultHTML = `<div class="face-result">
          <h3>检测结果</h3>
          <p><strong>置信度:</strong> ${(result.confidence * 100).toFixed(2)}%</p>`

        if (result.liveness) {
          resultHTML += `<p><strong>活体检测:</strong> ${result.liveness.passed ? "通过" : "未通过"}</p>`
        }

        if (result.attributes) {
          if (result.attributes.age) {
            resultHTML += `<p><strong>年龄估计:</strong> ${result.attributes.age.value}</p>`
          }

          if (result.attributes.gender) {
            resultHTML += `<p><strong>性别估计:</strong> ${result.attributes.gender.value}</p>`
          }

          if (result.attributes.emotion) {
            resultHTML += `<p><strong>表情:</strong> ${result.attributes.emotion.value}</p>`
          }
        }

        resultHTML += `</div>`
        resultElement.innerHTML = resultHTML
      } else {
        resultElement.innerHTML = "<p>未检测到人脸</p>"
      }
    })
  } catch (error) {
    console.error("初始化失败:", error)
    resultElement.innerHTML = `<p class="error">启动摄像头失败: ${error.message}</p>`
  }
}

// 停止人脸检测
function stopDetection() {
  const faceModule = scanner.getFaceModule()
  faceModule.stopDetection()
  faceModule.stopCapture()
}

// 页面加载完成后初始化
window.addEventListener("DOMContentLoaded", initialize)
```

## 高级配置

### 配置选项

创建人脸模块时可以指定多种配置选项：

```javascript
const faceModule = new FaceModule({
  // 基本配置
  enabled: true,

  // 检测器配置
  detector: {
    minConfidence: 0.7, // 最小置信度
    detectLandmarks: true, // 检测特征点
    detectAttributes: true, // 检测属性（年龄、性别等）
    returnFaceImage: false, // 是否返回人脸图像
  },

  // 活体检测配置
  liveness: {
    enabled: true, // 启用活体检测
    type: "passive", // 活体检测类型：'passive'(被动)/'blink'(眨眼)/'mouth'(张嘴)/'head'(摇头)
    minConfidence: 0.8, // 最小置信度
    timeout: 10000, // 超时时间（毫秒）
  },

  // 人脸比对配置
  comparison: {
    minSimilarity: 0.8, // 最小相似度阈值
  },
})
```

### 通过IDScanner获取模块

也可以通过 `IDScanner` 实例获取人脸模块，并在获取时指定配置：

```javascript
import { IDScanner } from "id-scanner-lib"

const scanner = new IDScanner()
await scanner.initialize()

const faceModule = scanner.getFaceModule({
  detector: {
    minConfidence: 0.7,
    detectLandmarks: true,
  },
  liveness: {
    enabled: true,
  },
})
```

## 应用场景

### 身份验证

将实时捕获的人脸与身份证照片进行比对，用于身份验证：

```javascript
// 获取身份证模块和人脸模块
const idCardModule = scanner.getIDCardModule()
const faceModule = scanner.getFaceModule()

// 识别身份证
const idCardInfo = await idCardModule.recognize(idCardImage)

// 获取身份证照片
const idCardFaceImage = idCardInfo.faceImage

// 捕获实时人脸
const liveImage = scanner.captureFrame(videoElement)
const liveResult = await faceModule.detectFace(liveImage)

// 进行活体检测
const isLive = await faceModule.detectLiveness(liveImage)

if (!isLive) {
  console.log("活体检测失败，请使用真实人脸")
  return
}

// 比对人脸
const comparisonResult = await faceModule.compareFaces(
  idCardFaceImage,
  liveImage
)

if (comparisonResult.isMatch) {
  console.log("身份验证通过")
} else {
  console.log("身份验证失败，人脸不匹配")
}
```

### 人脸跟踪

跟踪视频流中的人脸，用于交互式应用：

```javascript
// 开始人脸跟踪
faceModule.startTracking({
  interval: 50, // 每50ms跟踪一次
  maxFaces: 3, // 最多跟踪3个人脸
})

// 监听跟踪结果
faceModule.on("face:tracked", ({ faces }) => {
  faces.forEach((face) => {
    // 处理每个跟踪到的人脸
    console.log(`人脸ID: ${face.trackingId}`)
    console.log(`位置: x=${face.boundingBox.x}, y=${face.boundingBox.y}`)

    // 可以根据人脸位置更新UI元素
    updateUIElement(face.trackingId, face.boundingBox)
  })
})
```

## 性能优化

### 调整检测频率

根据应用需求和设备性能调整检测频率：

```javascript
// 低性能设备
faceModule.startDetection({ interval: 500 }) // 每500ms检测一次

// 高性能设备
faceModule.startDetection({ interval: 50 }) // 每50ms检测一次
```

### 使用Web Workers

启用Web Workers可以将计算密集型的人脸检测过程移至后台线程：

```javascript
const scanner = new IDScanner({
  useWorker: true,
  workerOptions: {
    maxConcurrency: 2,
  },
})

const faceModule = scanner.getFaceModule()
```

### 限制检测区域

限制人脸检测的区域可以提高性能：

```javascript
faceModule.startDetection({
  region: {
    x: 100,
    y: 100,
    width: 400,
    height: 300,
  },
})
```

## 错误处理

处理人脸识别过程中可能出现的错误：

```javascript
try {
  const faceResult = await faceModule.detectFace(imageElement)
  // 处理结果
} catch (error) {
  if (error.name === "FaceDetectionError") {
    console.error("人脸检测错误:", error.message)
  } else if (error.name === "LivenessDetectionError") {
    console.error("活体检测错误:", error.message)
  } else {
    console.error("未知错误:", error)
  }
}

// 监听错误事件
faceModule.on("error", (error) => {
  console.error("人脸模块错误:", error)
})
```

## 最佳实践

1. **预热模型**：在用户交互前预先初始化模型，减少首次检测的延迟
2. **合理设置置信度阈值**：根据应用场景调整 `minConfidence` 值
3. **优化图像尺寸**：过大的图像会增加处理时间，建议限制输入图像尺寸
4. **使用Web Workers**：对于复杂的人脸处理任务，启用Web Workers避免阻塞主线程
5. **资源释放**：不再使用时调用 `dispose()` 方法释放资源
6. **渐进增强**：根据设备性能动态调整功能，如在低端设备上禁用属性检测
