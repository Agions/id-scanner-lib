# QRCodeModule 类

`QRCodeModule` 类提供二维码和条形码的检测与解析功能。

## 导入

```js
import { QRCodeModule } from 'id-scanner-lib';
```

## 构造函数

```js
new QRCodeModule(options?: QRCodeModuleOptions)
```

创建 QRCodeModule 实例。

### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| options | `QRCodeModuleOptions` | 可选的配置选项对象 |

### QRCodeModuleOptions 接口

| 选项 | 类型 | 默认值 | 描述 |
| ---- | ---- | ---- | ---- |
| enabled | `boolean` | `true` | 是否启用模块 |
| scanner | `{ minConfidence?: number; tryMultipleScan?: boolean; returnImage?: boolean; }` | `{ minConfidence: 0.6, tryMultipleScan: true, returnImage: false }` | 扫描器配置 |
| imageProcess | `{ preprocess?: boolean; enhanceContrast?: boolean; threshold?: number; }` | `{ preprocess: true, enhanceContrast: true, threshold: 128 }` | 图像处理配置 |

## 方法

### initialize

```js
async initialize(): Promise<void>
```

初始化二维码模块，加载所需资源。必须在使用其他功能之前先调用此方法。

#### 示例

```js
const qrCodeModule = new QRCodeModule();
await qrCodeModule.initialize();
```

### scan

```js
async scan(image: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<QRCodeResult | undefined>
```

扫描图像中的二维码。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| image | `ImageData \| HTMLImageElement \| HTMLCanvasElement` | 要扫描的图像 |

#### 返回值

返回 `QRCodeResult` 对象，包含扫描结果，如果没有检测到二维码则返回 `undefined`。

#### QRCodeResult 接口

| 字段 | 类型 | 描述 |
| ---- | ---- | ---- |
| data | `string` | 二维码内容 |
| type | `string` | 二维码类型 |
| boundingBox | `{ topLeft: Point; topRight: Point; bottomRight: Point; bottomLeft: Point; }` | 二维码边界框 |
| center | `{ x: number; y: number; }` | 二维码中心点 |
| image | `ImageData` | 原始图像 |
| confidence | `number` | 置信度 |

#### 示例

```js
const qrResult = await qrCodeModule.scan(imageElement);
if (qrResult) {
  console.log('扫描结果:', qrResult.data);
}
```

### getLastScanResult

```js
getLastScanResult(): QRCodeResult | undefined
```

获取最后一次扫描结果。

#### 返回值

返回 `QRCodeResult` 对象，或者 `undefined` 如果没有扫描结果。

#### 示例

```js
const lastResult = qrCodeModule.getLastScanResult();
```

### parseQRCodeData

```js
parseQRCodeData(data: string): Record<string, any> | string
```

解析二维码数据，尝试将其解析为结构化数据。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| data | `string` | 要解析的二维码数据 |

#### 返回值

返回解析后的对象或原始字符串。

#### 示例

```js
const qrResult = await qrCodeModule.scan(imageElement);
if (qrResult) {
  const parsedData = qrCodeModule.parseQRCodeData(qrResult.data);
  console.log('解析数据:', parsedData);
}
```

### dispose

```js
async dispose(): Promise<void>
```

释放模块使用的所有资源。应在不再需要模块时调用此方法。

#### 示例

```js
await qrCodeModule.dispose();
```

## 事件

QRCodeModule 类继承自 EventEmitter，可以监听以下事件：

### initialized

当模块初始化完成时触发。

```js
qrCodeModule.on('initialized', () => {
  console.log('二维码模块已初始化');
});
```

### qrcode:scanned

当扫描到二维码时触发。

```js
qrCodeModule.on('qrcode:scanned', ({ result }) => {
  console.log('扫描到二维码:', result.data);
});
```

## 使用示例

### 基本用法

```js
import { QRCodeModule } from 'id-scanner-lib';

// 创建模块实例
const qrModule = new QRCodeModule();

// 初始化模块
await qrModule.initialize();

// 扫描图像中的二维码
const image = document.getElementById('qrcode-image');
const result = await qrModule.scan(image);

if (result) {
  console.log('二维码内容:', result.data);
  
  // 解析二维码数据
  const parsedData = qrModule.parseQRCodeData(result.data);
  console.log('解析后的数据:', parsedData);
}
```

### 实时扫描

```js
import { IDScanner, QRCodeModule } from 'id-scanner-lib';

// 创建扫描器实例
const scanner = new IDScanner();

// 初始化扫描器
await scanner.initialize();

// 获取二维码模块
const qrModule = scanner.getQRCodeModule();

// 启动摄像头
const videoElement = document.getElementById('camera');
const stream = await scanner.startCamera(videoElement);

// 定时扫描视频帧
const scanInterval = setInterval(async () => {
  // 捕获当前帧
  const frame = scanner.captureFrame(videoElement);
  
  // 扫描帧中的二维码
  const result = await qrModule.scan(frame);
  
  if (result) {
    console.log('扫描到二维码:', result.data);
    clearInterval(scanInterval);
    scanner.stopCamera(stream);
  }
}, 500);

// 注册事件监听
qrModule.on('qrcode:scanned', ({ result }) => {
  console.log('扫描到二维码事件:', result.data);
});
``` 