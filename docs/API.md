# API 参考

ID-Scanner-Lib 提供了一套完整的 API，用于身份证识别、二维码扫描和人脸识别。本页面提供 API 的概述，详细信息请参阅各模块的专门文档。

## 核心类

### IDScanner

`IDScanner` 是库的主要入口点，负责协调不同的功能模块。

```typescript
import { IDScanner, LogLevel } from 'id-scanner-lib';

// 创建扫描器实例
const scanner = new IDScanner({
  logLevel: LogLevel.INFO,
  enableIDCard: true,
  enableQRCode: true,
  enableFace: true
});

// 初始化
await scanner.initialize();

// 使用完毕后释放资源
await scanner.dispose();
```

详细信息请参阅 [IDScanner API](/api/idscanner)。

## 功能模块

### IDCardModule

`IDCardModule` 提供身份证识别功能，包括检测、OCR 和信息提取。

```typescript
// 获取模块实例
const idCardModule = scanner.getIDCardModule();

// 识别身份证
const result = await idCardModule.recognize(imageElement);
if (result.isSuccess()) {
  const idCardInfo = result.data;
  console.log('身份证信息:', idCardInfo);
}
```

详细信息请参阅 [IDCardModule API](/api/idcard-module)。

### QRCodeModule

`QRCodeModule` 提供二维码和条形码扫描功能。

```typescript
// 获取模块实例
const qrCodeModule = scanner.getQRCodeModule();

// 从图像扫描二维码
const result = await qrCodeModule.scan(imageElement);
if (result.isSuccess()) {
  console.log('二维码内容:', result.data.data);
}

// 启动实时扫描
await qrCodeModule.startScan(videoElement);
qrCodeModule.on('qrcode:detected', (result) => {
  console.log('扫描到二维码:', result.data);
});
```

详细信息请参阅 [QRCodeModule API](/api/qrcode-module)。

### FaceModule

`FaceModule` 提供人脸检测、活体检测和人脸比对功能。

```typescript
// 获取模块实例
const faceModule = scanner.getFaceModule();

// 检测人脸
const result = await faceModule.detectFace(imageElement);
if (result.isSuccess()) {
  console.log('人脸检测结果:', result.data);
}

// 进行人脸比对
const comparisonResult = await faceModule.compareFaces(faceImage1, faceImage2);
console.log('相似度:', comparisonResult.data.similarity);
```

详细信息请参阅 [FaceModule API](/api/face-module)。

## 核心基础设施

### 模块管理器

`ModuleManager` 负责管理所有功能模块的生命周期。

```typescript
import { ModuleManager } from 'id-scanner-lib';

// 获取模块管理器实例
const moduleManager = ModuleManager.getInstance();

// 注册自定义模块
moduleManager.register(myCustomModule);

// 获取已注册的模块
const idCardModule = moduleManager.getModule('id-card');

// 初始化所有模块
await moduleManager.initialize();
```

### 配置管理器

`ConfigManager` 提供全局配置管理功能。

```typescript
import { ConfigManager } from 'id-scanner-lib';

// 获取配置管理器实例
const config = ConfigManager.getInstance();

// 设置配置
config.set('camera.resolution.width', 1280);

// 获取配置
const width = config.get('camera.resolution.width');

// 监听配置变更
config.onConfigChange('camera.resolution', (newValue, oldValue) => {
  console.log('摄像头分辨率已更改:', newValue);
});
```

### 日志系统

`Logger` 提供多级别的日志记录功能。

```typescript
import { Logger, LogLevel } from 'id-scanner-lib';

// 获取日志实例
const logger = Logger.getInstance();

// 设置日志级别
logger.setLevel(LogLevel.DEBUG);

// 记录不同级别的日志
logger.debug('组件名称', '调试信息');
logger.info('组件名称', '信息消息');
logger.warn('组件名称', '警告信息');
logger.error('组件名称', '错误信息', error);
```

### 结果类

`Result` 封装操作的结果，提供统一的成功/失败处理方式。

```typescript
import { Result } from 'id-scanner-lib';

// 创建成功结果
const successResult = Result.success({ data: 'some data' });

// 创建失败结果
const failureResult = Result.failure(new Error('操作失败'));

// 使用结果
function processResult(result) {
  result
    .onSuccess(data => {
      console.log('操作成功:', data);
    })
    .onFailure(error => {
      console.error('操作失败:', error.message);
    })
    .onFinally(() => {
      console.log('处理完成');
    });
}
```

## 错误处理

ID-Scanner-Lib 提供了完善的错误处理机制，所有特定错误都继承自 `IDScannerError` 基类。

```typescript
import { IDScannerError, CameraAccessError } from 'id-scanner-lib';

try {
  await qrCodeModule.startScan();
} catch (error) {
  if (error instanceof CameraAccessError) {
    console.error('摄像头访问错误:', error.message);
  } else if (error instanceof IDScannerError) {
    console.error('ID扫描错误:', error.code, error.message);
  } else {
    console.error('未知错误:', error);
  }
}
```

详细信息请参阅 [错误处理指南](/guide/error-handling)。

## 类型定义

ID-Scanner-Lib 使用 TypeScript 编写，提供完整的类型定义。以下是主要的类型接口：

### 全局选项

```typescript
interface IDScannerOptions {
  logLevel?: LogLevel;
  enableIDCard?: boolean;
  enableQRCode?: boolean;
  enableFace?: boolean;
  idCard?: IDCardModuleOptions;
  qrCode?: QRCodeModuleOptions;
  face?: FaceModuleOptions;
}
```

### 身份证模块类型

```typescript
interface IDCardInfo {
  type: IDCardType;
  edge?: IDCardEdge;
  name?: string;
  gender?: string;
  ethnicity?: string;
  birthDate?: string;
  address?: string;
  idNumber?: string;
  issueAuthority?: string;
  validFrom?: string;
  validTo?: string;
  photoRegion?: Rect;
  image?: ImageData;
  confidence?: number;
  antiFake?: {
    passed: boolean;
    score: number;
    features?: Record<string, boolean>;
  };
}

enum IDCardType {
  FRONT = 'front',
  BACK = 'back',
  FIRST_GENERATION = 'first_generation',
  TEMPORARY = 'temporary',
  FOREIGN_PERMANENT = 'foreign_permanent',
  HMT_RESIDENT = 'hmt_resident',
  UNKNOWN = 'unknown'
}
```

### 二维码模块类型

```typescript
interface QRCodeResult {
  data: string;
  type?: string;
  boundingBox: {
    topLeft: Point;
    topRight: Point;
    bottomRight: Point;
    bottomLeft: Point;
  };
  center: Point;
  image?: ImageData;
  confidence?: number;
}
```

### 人脸模块类型

```typescript
interface FaceDetectionResult {
  boundingBox: Rect;
  landmarks?: {
    leftEye: Point;
    rightEye: Point;
    nose: Point;
    mouth: Point;
    chin: Point;
  };
  angle?: {
    pitch: number;
    yaw: number;
    roll: number;
  };
  attributes?: {
    gender?: { value: 'male' | 'female'; confidence: number };
    age?: { value: number; confidence: number };
    emotion?: { value: string; confidence: number };
  };
  liveness?: {
    passed: boolean;
    score: number;
    type: 'blink' | 'mouth' | 'head' | 'passive';
  };
  image?: ImageData;
  confidence: number;
}
```

## 事件系统

各模块通过继承 `EventEmitter` 提供了标准的事件系统：

```typescript
// 监听身份证识别事件
idCardModule.on('idcard:detected', (result) => {
  console.log('检测到身份证:', result);
});

// 监听二维码扫描事件
qrCodeModule.on('qrcode:detected', (result) => {
  console.log('扫描到二维码:', result);
});

// 监听人脸检测事件
faceModule.on('face:detected', (result) => {
  console.log('检测到人脸:', result);
});

// 监听模块初始化事件
moduleManager.on('module:initialized', (data) => {
  console.log(`模块 ${data.name} 已初始化`);
});
```

详细的事件列表请参阅各模块的API文档。

## 配置选项

ID-Scanner-Lib 提供了丰富的配置选项，用于自定义各模块的行为。详细信息请参阅 [配置选项](/api/configuration)。

## 进阶用法

### Web Worker 支持

ID-Scanner-Lib 支持在 Web Worker 中运行计算密集型任务，提高性能：

```typescript
// 在创建模块时启用 Web Worker
const scanner = new IDScanner({
  idCard: {
    ocr: {
      useWorker: true
    }
  }
});
```

详细信息请参阅 [Web Worker 指南](/advanced/web-workers)。

### 性能优化

ID-Scanner-Lib 提供了多种性能优化选项：

```typescript
// 配置性能相关选项
const scanner = new IDScanner({
  idCard: {
    ocr: {
      maxImageDimension: 1280 // 限制处理图像的最大尺寸
    }
  }
});
```

详细信息请参阅 [性能优化指南](/advanced/performance)。