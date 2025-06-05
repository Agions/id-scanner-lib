# FaceModule 类

`FaceModule` 类提供人脸检测、活体检测和人脸比对功能。

## 导入

```js
import { FaceModule } from 'id-scanner-lib';
```

## 构造函数

```js
new FaceModule(options?: FaceModuleOptions)
```

创建 FaceModule 实例。

### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| options | `FaceModuleOptions` | 可选的配置选项对象 |

### FaceModuleOptions 接口

| 选项 | 类型 | 默认值 | 描述 |
| ---- | ---- | ---- | ---- |
| enabled | `boolean` | `true` | 是否启用模块 |
| detector | `{ minConfidence?: number; detectLandmarks?: boolean; detectAttributes?: boolean; returnFaceImage?: boolean; }` | `{ minConfidence: 0.7, detectLandmarks: true, detectAttributes: true, returnFaceImage: false }` | 检测器配置 |
| liveness | `{ enabled?: boolean; type?: 'blink' \| 'mouth' \| 'head' \| 'passive'; minConfidence?: number; timeout?: number; }` | `{ enabled: false, type: 'passive', minConfidence: 0.8, timeout: 10000 }` | 活体检测配置 |
| comparison | `{ minSimilarity?: number; }` | `{ minSimilarity: 0.8 }` | 人脸比对配置 |

## 方法

### initialize

```js
async initialize(): Promise<void>
```

初始化人脸模块，加载所需资源。必须在使用其他功能之前先调用此方法。

#### 示例

```js
const faceModule = new FaceModule();
await faceModule.initialize();
```

### detectFace

```js
async detectFace(image: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<FaceDetectionResult | undefined>
```

检测图像中的人脸。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| image | `ImageData \| HTMLImageElement \| HTMLCanvasElement` | 要检测的图像 |

#### 返回值

返回 `FaceDetectionResult` 对象，包含检测结果，如果没有检测到人脸则返回 `undefined`。

#### FaceDetectionResult 接口

| 字段 | 类型 | 描述 |
| ---- | ---- | ---- |
| boundingBox | `{ x: number; y: number; width: number; height: number; }` | 人脸边界框 |
| landmarks | `{ leftEye: Point; rightEye: Point; nose: Point; mouth: Point; chin: Point; }` | 人脸特征点 |
| angle | `{ pitch: number; yaw: number; roll: number; }` | 人脸角度 |
| attributes | `{ gender?: { value: string; confidence: number; }; age?: { value: number; confidence: number; }; emotion?: { value: string; confidence: number; } }` | 人脸属性 |
| liveness | `{ passed: boolean; score: number; type: string; }` | 活体检测结果 |
| image | `ImageData` | 人脸图像 |
| confidence | `number` | 置信度 |

#### 示例

```js
const faceResult = await faceModule.detectFace(imageElement);
if (faceResult) {
  console.log('检测到人脸:', faceResult);
}
```

### detectLiveness

```js
async detectLiveness(image: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<boolean>
```

进行活体检测。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| image | `ImageData \| HTMLImageElement \| HTMLCanvasElement` | 要检测的图像 |

#### 返回值

返回布尔值表示是否通过活体检测。

#### 示例

```js
const isLive = await faceModule.detectLiveness(imageElement);
if (isLive) {
  console.log('通过活体检测');
}
```

### compareFaces

```js
async compareFaces(face1: ImageData | HTMLImageElement | HTMLCanvasElement, face2: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<FaceComparisonResult>
```

比对两个人脸。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| face1 | `ImageData \| HTMLImageElement \| HTMLCanvasElement` | 第一个人脸图像 |
| face2 | `ImageData \| HTMLImageElement \| HTMLCanvasElement` | 第二个人脸图像 |

#### 返回值

返回 `FaceComparisonResult` 对象，包含比对结果。

#### FaceComparisonResult 接口

| 字段 | 类型 | 描述 |
| ---- | ---- | ---- |
| isMatch | `boolean` | 是否匹配 |
| similarity | `number` | 相似度分数 |
| confidence | `number` | 置信度 |

#### 示例

```js
const comparisonResult = await faceModule.compareFaces(faceImage1, faceImage2);
if (comparisonResult.isMatch) {
  console.log('人脸匹配，相似度:', comparisonResult.similarity);
} else {
  console.log('人脸不匹配');
}
```

### getLastDetectionResult

```js
getLastDetectionResult(): FaceDetectionResult | undefined
```

获取最后一次人脸检测结果。

#### 返回值

返回 `FaceDetectionResult` 对象，或者 `undefined` 如果没有检测结果。

#### 示例

```js
const lastResult = faceModule.getLastDetectionResult();
```

### dispose

```js
async dispose(): Promise<void>
```

释放模块使用的所有资源。应在不再需要模块时调用此方法。

#### 示例

```js
await faceModule.dispose();
```

## 事件

FaceModule 类继承自 EventEmitter，可以监听以下事件：

### initialized

当模块初始化完成时触发。

```js
faceModule.on('initialized', () => {
  console.log('人脸模块已初始化');
});
```

### face:detected

当检测到人脸时触发。

```js
faceModule.on('face:detected', ({ result }) => {
  console.log('检测到人脸:', result);
});
```

### face:liveness

当完成活体检测时触发。

```js
faceModule.on('face:liveness', ({ passed }) => {
  console.log('活体检测结果:', passed ? '通过' : '未通过');
});
```

### face:compared

当完成人脸比对时触发。

```js
faceModule.on('face:compared', ({ result }) => {
  console.log('人脸比对结果:', result.isMatch ? '匹配' : '不匹配', '相似度:', result.similarity);
});
```

## 使用示例

### 基本人脸检测

```js
import { FaceModule } from 'id-scanner-lib';

// 创建模块实例
const faceModule = new FaceModule();

// 初始化模块
await faceModule.initialize();

// 检测图像中的人脸
const image = document.getElementById('face-image');
const result = await faceModule.detectFace(image);

if (result) {
  console.log('检测到人脸:');
  console.log('- 位置:', result.boundingBox);
  console.log('- 置信度:', result.confidence);
  
  if (result.attributes?.gender) {
    console.log('- 性别:', result.attributes.gender.value);
  }
  
  if (result.attributes?.age) {
    console.log('- 年龄:', result.attributes.age.value);
  }
}
```

### 人脸比对示例

```js
import { FaceModule } from 'id-scanner-lib';

// 创建模块实例
const faceModule = new FaceModule({
  comparison: {
    minSimilarity: 0.75 // 设置较低的阈值
  }
});

// 初始化模块
await faceModule.initialize();

// 比对两个人脸
const faceImage1 = document.getElementById('face1');
const faceImage2 = document.getElementById('face2');

const comparisonResult = await faceModule.compareFaces(faceImage1, faceImage2);

console.log('比对结果:', comparisonResult.isMatch ? '匹配' : '不匹配');
console.log('相似度:', (comparisonResult.similarity * 100).toFixed(2) + '%');
```

### 活体检测示例

```js
import { IDScanner, FaceModule } from 'id-scanner-lib';

// 创建扫描器实例
const scanner = new IDScanner({
  face: {
    liveness: {
      enabled: true,
      type: 'blink', // 设置为眨眼活体检测
      timeout: 15000 // 15秒超时
    }
  }
});

// 初始化扫描器
await scanner.initialize();

// 获取人脸模块
const faceModule = scanner.getFaceModule();

// 启动摄像头
const videoElement = document.getElementById('camera');
const stream = await scanner.startCamera(videoElement, { facingMode: 'user' }); // 使用前置摄像头

// 注册事件监听
faceModule.on('face:liveness', async ({ passed }) => {
  if (passed) {
    console.log('活体检测通过');
    
    // 捕获当前帧，可用于后续处理
    const frame = scanner.captureFrame(videoElement);
    
    // 释放资源
    scanner.stopCamera(stream);
  } else {
    console.log('活体检测未通过，请重试');
  }
});

// 开始活体检测
try {
  console.log('请眨眼完成活体检测...');
  const isLive = await faceModule.detectLiveness(videoElement);
  if (isLive) {
    console.log('活体检测成功');
  }
} catch (error) {
  console.error('活体检测错误:', error);
}
``` 