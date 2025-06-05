# 配置选项

本文档详细介绍了 ID-Scanner-Lib 库的所有配置选项。通过正确配置这些选项，您可以根据自己的需求自定义库的行为。

## 全局配置选项

在创建 `IDScanner` 实例时，您可以传入全局配置选项：

```typescript
import { IDScanner, LogLevel } from 'id-scanner-lib';

const scanner = new IDScanner({
  logLevel: LogLevel.INFO,
  enableIDCard: true,
  enableQRCode: true,
  enableFace: true,
  idCard: { /* 身份证模块配置 */ },
  qrCode: { /* 二维码模块配置 */ },
  face: { /* 人脸识别模块配置 */ }
});
```

### IDScannerOptions

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `logLevel` | `LogLevel` | `LogLevel.INFO` | 日志级别，可选值：`DEBUG`、`INFO`、`WARN`、`ERROR` |
| `enableIDCard` | `boolean` | `true` | 是否启用身份证识别模块 |
| `enableQRCode` | `boolean` | `true` | 是否启用二维码扫描模块 |
| `enableFace` | `boolean` | `true` | 是否启用人脸识别模块 |
| `idCard` | `IDCardModuleOptions` | `{}` | 身份证模块配置选项 |
| `qrCode` | `QRCodeModuleOptions` | `{}` | 二维码模块配置选项 |
| `face` | `FaceModuleOptions` | `{}` | 人脸识别模块配置选项 |

## 身份证模块配置选项

身份证模块提供以下配置选项：

```typescript
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  idCard: {
    enabled: true,
    detector: {
      minConfidence: 0.7,
      enableOCR: true,
      enableAntiFake: true
    },
    ocr: {
      useWorker: true,
      maxImageDimension: 1280,
      brightness: 0,
      contrast: 0
    },
    antiFake: {
      sensitivity: 0.8,
      minConfidence: 0.6
    }
  }
});
```

### IDCardModuleOptions

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用模块 |
| `detector` | `object` | `{}` | 检测器配置 |
| `detector.minConfidence` | `number` | `0.7` | 最小置信度，低于此值的结果将被过滤 |
| `detector.enableOCR` | `boolean` | `true` | 是否启用OCR识别 |
| `detector.enableAntiFake` | `boolean` | `true` | 是否启用防伪检测 |
| `ocr` | `object` | `{}` | OCR处理器配置 |
| `ocr.useWorker` | `boolean` | `true` | 是否使用Web Worker处理OCR |
| `ocr.maxImageDimension` | `number` | `1280` | 最大图像尺寸 |
| `ocr.brightness` | `number` | `0` | 亮度调整 (-100 到 100) |
| `ocr.contrast` | `number` | `0` | 对比度调整 (-100 到 100) |
| `antiFake` | `object` | `{}` | 防伪检测配置 |
| `antiFake.sensitivity` | `number` | `0.8` | 防伪检测灵敏度 (0-1) |
| `antiFake.minConfidence` | `number` | `0.6` | 防伪检测最小置信度 |

## 二维码模块配置选项

二维码模块提供以下配置选项：

```typescript
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  qrCode: {
    enabled: true,
    scanner: {
      minConfidence: 0.6,
      tryMultipleScan: true,
      returnImage: false
    },
    imageProcess: {
      preprocess: true,
      enhanceContrast: true,
      threshold: 128
    }
  }
});
```

### QRCodeModuleOptions

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用模块 |
| `scanner` | `object` | `{}` | 扫描器配置 |
| `scanner.minConfidence` | `number` | `0.6` | 最小置信度，低于此值的结果将被过滤 |
| `scanner.tryMultipleScan` | `boolean` | `true` | 是否尝试多次扫描提高成功率 |
| `scanner.returnImage` | `boolean` | `false` | 是否在结果中返回原始图像 |
| `imageProcess` | `object` | `{}` | 图像处理配置 |
| `imageProcess.preprocess` | `boolean` | `true` | 是否进行预处理 |
| `imageProcess.enhanceContrast` | `boolean` | `true` | 是否增强对比度 |
| `imageProcess.threshold` | `number` | `128` | 二值化阈值 (0-255) |

## 人脸识别模块配置选项

人脸识别模块提供以下配置选项：

```typescript
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner({
  face: {
    enabled: true,
    detector: {
      minConfidence: 0.8,
      detectLandmarks: true,
      detectAttributes: true,
      returnFaceImage: true
    },
    liveness: {
      enabled: true,
      type: 'passive',
      minConfidence: 0.7,
      timeout: 10000
    },
    comparison: {
      minSimilarity: 0.8
    }
  }
});
```

### FaceModuleOptions

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 是否启用模块 |
| `detector` | `object` | `{}` | 检测器配置 |
| `detector.minConfidence` | `number` | `0.8` | 最小置信度，低于此值的结果将被过滤 |
| `detector.detectLandmarks` | `boolean` | `true` | 是否检测面部特征点 |
| `detector.detectAttributes` | `boolean` | `true` | 是否检测面部属性 |
| `detector.returnFaceImage` | `boolean` | `true` | 是否在结果中返回人脸图像 |
| `liveness` | `object` | `{}` | 活体检测配置 |
| `liveness.enabled` | `boolean` | `true` | 是否启用活体检测 |
| `liveness.type` | `'blink' \| 'mouth' \| 'head' \| 'passive'` | `'passive'` | 活体检测类型 |
| `liveness.minConfidence` | `number` | `0.7` | 活体检测最小置信度 |
| `liveness.timeout` | `number` | `10000` | 检测超时时间（毫秒） |
| `comparison` | `object` | `{}` | 人脸比对配置 |
| `comparison.minSimilarity` | `number` | `0.8` | 最小相似度阈值 (0-1) |

## 配置示例

### 基本配置示例

```typescript
import { IDScanner, LogLevel } from 'id-scanner-lib';

const scanner = new IDScanner({
  logLevel: LogLevel.DEBUG,
  enableIDCard: true,
  enableQRCode: true,
  enableFace: false // 不使用人脸识别模块
});

await scanner.initialize();
```

### 完整配置示例

```typescript
import { IDScanner, LogLevel } from 'id-scanner-lib';

const scanner = new IDScanner({
  logLevel: LogLevel.INFO,
  enableIDCard: true,
  enableQRCode: true,
  enableFace: true,
  
  // 身份证模块配置
  idCard: {
    enabled: true,
    detector: {
      minConfidence: 0.7,
      enableOCR: true,
      enableAntiFake: true
    },
    ocr: {
      useWorker: true,
      maxImageDimension: 1280
    }
  },
  
  // 二维码模块配置
  qrCode: {
    enabled: true,
    scanner: {
      minConfidence: 0.6,
      tryMultipleScan: true
    }
  },
  
  // 人脸识别模块配置
  face: {
    enabled: true,
    detector: {
      minConfidence: 0.8,
      detectLandmarks: true
    },
    liveness: {
      enabled: true,
      type: 'passive'
    }
  }
});

await scanner.initialize();
```

## 动态更新配置

所有模块都支持在运行时更新配置：

```typescript
const idCardModule = scanner.getIDCardModule();
if (idCardModule) {
  // 更新身份证模块配置
  idCardModule.updateConfig({
    detector: {
      minConfidence: 0.8
    },
    ocr: {
      brightness: 10,
      contrast: 15
    }
  });
}
``` 