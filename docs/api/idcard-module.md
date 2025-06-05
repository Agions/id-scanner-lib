# IDCardModule 类

`IDCardModule` 类提供身份证检测、OCR识别和信息提取功能，是实现身份证识别的核心模块。

## 导入

```js
import { IDCardModule } from 'id-scanner-lib';
```

## 构造函数

```js
new IDCardModule(options?: IDCardModuleOptions)
```

创建 IDCardModule 实例。

### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| options | `IDCardModuleOptions` | 可选的配置选项对象 |

### IDCardModuleOptions 接口

| 选项 | 类型 | 默认值 | 描述 |
| ---- | ---- | ---- | ---- |
| enabled | `boolean` | `true` | 是否启用模块 |
| detector | `{ minConfidence?: number; enableOCR?: boolean; enableAntiFake?: boolean; }` | `{ minConfidence: 0.7, enableOCR: true, enableAntiFake: false }` | 检测器配置 |
| ocr | `{ useWorker?: boolean; maxImageDimension?: number; brightness?: number; contrast?: number; }` | `{ useWorker: true, maxImageDimension: 1000, brightness: 10, contrast: 20 }` | OCR处理器配置 |
| antiFake | `{ sensitivity?: number; minConfidence?: number; }` | `{ sensitivity: 0.8, minConfidence: 0.7 }` | 防伪检测配置 |

## 方法

### initialize

```js
async initialize(): Promise<void>
```

初始化身份证模块，加载所需资源。必须在使用其他功能之前先调用此方法。

#### 示例

```js
const idCardModule = new IDCardModule();
await idCardModule.initialize();
```

### recognize

```js
async recognize(image: ImageData | HTMLImageElement | HTMLCanvasElement): Promise<IDCardInfo>
```

识别身份证图像，提取信息。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| image | `ImageData \| HTMLImageElement \| HTMLCanvasElement` | 要识别的身份证图像 |

#### 返回值

返回 `IDCardInfo` 对象，包含识别到的身份证信息。

#### IDCardInfo 接口

| 字段 | 类型 | 描述 |
| ---- | ---- | ---- |
| type | `IDCardType` | 身份证类型 |
| edge | `IDCardEdge` | 身份证边缘信息 |
| name | `string` | 姓名 |
| gender | `string` | 性别 |
| ethnicity | `string` | 民族 |
| birthDate | `string` | 出生日期，格式: YYYY-MM-DD |
| address | `string` | 地址 |
| idNumber | `string` | 身份证号码 |
| issueAuthority | `string` | 签发机关 |
| validFrom | `string` | 有效期起始日期，格式: YYYY-MM-DD |
| validTo | `string` | 有效期截止日期，格式: YYYY-MM-DD |
| photoRegion | `{ x: number; y: number; width: number; height: number; }` | 相片区域坐标 |
| image | `ImageData` | 原始身份证图像 |
| confidence | `number` | 置信度 |
| antiFake | `{ passed: boolean; score: number; features?: {...} }` | 防伪检测结果 |

#### 示例

```js
const idCardInfo = await idCardModule.recognize(imageElement);
console.log('身份证信息:', idCardInfo);
```

### verify

```js
verify(idCardInfo: IDCardInfo): IDCardVerificationResult
```

验证身份证信息的有效性。

#### 参数

| 名称 | 类型 | 描述 |
| ---- | ---- | ---- |
| idCardInfo | `IDCardInfo` | 要验证的身份证信息 |

#### 返回值

返回 `IDCardVerificationResult` 对象，包含验证结果。

#### IDCardVerificationResult 接口

| 字段 | 类型 | 描述 |
| ---- | ---- | ---- |
| isValid | `boolean` | 是否验证通过 |
| score | `number` | 验证分数 |
| failureReason | `string` | 失败原因 |
| details | `{ idNumberValid?: boolean; issueDateValid?: boolean; isExpired?: boolean; antiFakePassed?: boolean; }` | 验证详情 |

#### 示例

```js
const idCardInfo = await idCardModule.recognize(imageElement);
const verificationResult = idCardModule.verify(idCardInfo);

if (verificationResult.isValid) {
  console.log('身份证验证通过');
} else {
  console.log('身份证验证失败:', verificationResult.failureReason);
}
```

### getLastRecognitionResult

```js
getLastRecognitionResult(): IDCardInfo | undefined
```

获取最后一次识别结果。

#### 返回值

返回 `IDCardInfo` 对象，或者 `undefined` 如果没有识别结果。

#### 示例

```js
const lastResult = idCardModule.getLastRecognitionResult();
```

### dispose

```js
async dispose(): Promise<void>
```

释放模块使用的所有资源。应在不再需要模块时调用此方法。

#### 示例

```js
await idCardModule.dispose();
```

## 事件

IDCardModule 类继承自 EventEmitter，可以监听以下事件：

### initialized

当模块初始化完成时触发。

```js
idCardModule.on('initialized', () => {
  console.log('身份证模块已初始化');
});
```

### recognized

当识别到身份证信息时触发。

```js
idCardModule.on('recognized', ({ idCardInfo }) => {
  console.log('识别到身份证:', idCardInfo);
});
```

## 枚举

### IDCardType

身份证类型枚举。

| 值 | 描述 |
| ---- | ---- |
| `FRONT` | 第二代居民身份证正面 |
| `BACK` | 第二代居民身份证背面 |
| `FIRST_GENERATION` | 第一代居民身份证 |
| `TEMPORARY` | 临时身份证 |
| `FOREIGN_PERMANENT` | 外国人永久居留证 |
| `HMT_RESIDENT` | 港澳台居民居住证 |
| `UNKNOWN` | 未知类型 | 