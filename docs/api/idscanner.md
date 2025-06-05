# IDScanner 类

`IDScanner` 是 ID-Scanner-Lib 的核心类，它负责协调不同的功能模块，提供统一的接口进行身份证识别、二维码扫描和人脸识别。

## 导入

```js
import { IDScanner } from 'id-scanner-lib';
```

## 构造函数

```js
new IDScanner(options?: IDScannerOptions)
```

创建 IDScanner 实例。

### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| options | `IDScannerOptions` | 可选的配置选项对象 |

### IDScannerOptions 接口

| 选项 | 类型 | 默认值 | 描述 |
| ---- | ---- | ---- | ---- |
| debug | `boolean` | `false` | 是否启用调试模式 |
| modules | `Record<string, boolean>` | `{}` | 模块启用状态配置 |
| idCard | `IDCardModuleOptions` | - | 身份证模块配置 |
| qrCode | `QRCodeModuleOptions` | - | 二维码模块配置 |
| face | `FaceModuleOptions` | - | 人脸模块配置 |

## 方法

### initialize

```js
async initialize(): Promise<void>
```

初始化扫描器并加载所需资源。必须在使用其他功能之前先调用此方法。

#### 示例

```js
const scanner = new IDScanner();
await scanner.initialize();
```

### getIDCardModule

```js
getIDCardModule(): IDCardModule
```

获取身份证模块的实例。

#### 返回值

返回 `IDCardModule` 实例，用于身份证识别功能。

#### 示例

```js
const idCardModule = scanner.getIDCardModule();
const idCardInfo = await idCardModule.recognize(imageElement);
```

### getQRCodeModule

```js
getQRCodeModule(): QRCodeModule
```

获取二维码模块的实例。

#### 返回值

返回 `QRCodeModule` 实例，用于二维码扫描功能。

#### 示例

```js
const qrModule = scanner.getQRCodeModule();
const qrResult = await qrModule.scan(imageElement);
```

### getFaceModule

```js
getFaceModule(): FaceModule
```

获取人脸识别模块的实例。

#### 返回值

返回 `FaceModule` 实例，用于人脸检测、识别和比对功能。

#### 示例

```js
const faceModule = scanner.getFaceModule();
const faceResult = await faceModule.detectFace(imageElement);
```

### startCamera

```js
async startCamera(videoElement: HTMLVideoElement, options?: CameraOptions): Promise<MediaStream>
```

启动摄像头并将视频流连接到指定的视频元素。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| videoElement | `HTMLVideoElement` | 用于显示相机流的视频元素 |
| options | `CameraOptions` | 可选的相机配置选项 |

#### 返回值

返回 `MediaStream` 实例，代表相机的媒体流。

#### CameraOptions 接口

| 选项 | 类型 | 默认值 | 描述 |
| ---- | ---- | ---- | ---- |
| width | `number` | `1280` | 请求的相机宽度 |
| height | `number` | `720` | 请求的相机高度 |
| facingMode | `'user' \| 'environment'` | `'environment'` | 使用前置或后置摄像头 |
| frameRate | `number` | `30` | 请求的帧率 |

#### 示例

```js
const videoElement = document.getElementById('camera');
const stream = await scanner.startCamera(videoElement);
```

### stopCamera

```js
stopCamera(stream: MediaStream): void
```

停止相机流并释放资源。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| stream | `MediaStream` | 要停止的媒体流 |

#### 示例

```js
scanner.stopCamera(stream);
```

### captureFrame

```js
captureFrame(videoElement: HTMLVideoElement): ImageData
```

从视频元素捕获当前帧作为ImageData。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| videoElement | `HTMLVideoElement` | 视频元素 |

#### 返回值

返回 `ImageData` 对象，包含捕获的帧数据。

#### 示例

```js
const frame = scanner.captureFrame(videoElement);
const idCardInfo = await idCardModule.recognize(frame);
```

### dispose

```js
async dispose(): Promise<void>
```

释放扫描器使用的所有资源。应在不再需要扫描器时调用此方法。

#### 示例

```js
await scanner.dispose();
```

## 事件

IDScanner 类继承自 EventEmitter，可以监听以下事件：

### initialized

当扫描器初始化完成时触发。

```js
scanner.on('initialized', () => {
  console.log('扫描器已初始化');
});
```

### error

当发生错误时触发。

```js
scanner.on('error', (error) => {
  console.error('扫描器错误:', error);
});
```

### disposed

当扫描器资源被释放时触发。

```js
scanner.on('disposed', () => {
  console.log('扫描器资源已释放');
});
``` 