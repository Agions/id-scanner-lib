# 安装指南

在本页面，你将了解如何安装和设置 ID-Scanner-Lib。

## 环境要求

ID-Scanner-Lib 在以下环境中可正常工作:

- **浏览器支持**: 
  - Chrome 60+
  - Firefox 63+
  - Safari 11+
  - Edge 79+
- **Node.js**: 14.0.0 或更高版本 (仅用于开发构建)
- **支持的设备**:
  - 台式机/笔记本电脑 (Windows, macOS, Linux)
  - 移动设备 (iOS 11+, Android 7.0+)

## 安装方法

### 通过 npm 安装

```bash
npm install id-scanner-lib --save
```

### 通过 yarn 安装

```bash
yarn add id-scanner-lib
```

### 通过 CDN 使用

你可以使用 unpkg 或 jsDelivr CDN 直接在浏览器中使用:

```html
<!-- unpkg -->
<script src="https://unpkg.com/id-scanner-lib@latest/dist/id-scanner-lib.js"></script>

<!-- jsDelivr -->
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib@latest/dist/id-scanner-lib.js"></script>
```

## 依赖项

如果以模块形式导入库，ID-Scanner-Lib 依赖以下库：

- [@tensorflow/tfjs](https://www.npmjs.com/package/@tensorflow/tfjs): 人脸检测模型
- [@vladmandic/face-api](https://www.npmjs.com/package/@vladmandic/face-api): 人脸识别和特征点检测
- [jsqr](https://www.npmjs.com/package/jsqr): QR码扫描

当使用 npm 或 yarn 安装时，这些依赖项会自动安装。

## 项目中使用

### 模块导入 (ES6)

```javascript
// 导入整个库
import { IDScanner } from 'id-scanner-lib';

// 或者导入特定模块
import { IDCardModule, QRCodeModule, FaceModule } from 'id-scanner-lib';
```

### CommonJS 导入

```javascript
// 导入整个库
const { IDScanner } = require('id-scanner-lib');

// 或者导入特定模块
const { IDCardModule, QRCodeModule, FaceModule } = require('id-scanner-lib');
```

### 浏览器直接使用

如果通过 CDN 加载，库将以全局变量 `IDScannerLib` 的形式提供。

```html
<script src="https://unpkg.com/id-scanner-lib@latest/dist/id-scanner-lib.js"></script>

<script>
  // 使用全局变量访问
  const scanner = new IDScannerLib.IDScanner();
  
  // 初始化
  scanner.initialize().then(() => {
    console.log('扫描器已初始化');
  });
</script>
```

## TypeScript 支持

ID-Scanner-Lib 使用 TypeScript 编写，并提供内置的类型定义文件。无需额外安装 @types 包。

```typescript
import { IDScanner, IDCardInfo } from 'id-scanner-lib';

// TypeScript 类型检查和自动完成
const scanner = new IDScanner();
const processIdCard = async (image: HTMLImageElement): Promise<IDCardInfo> => {
  await scanner.initialize();
  const idCardModule = scanner.getIDCardModule();
  return await idCardModule.recognize(image);
};
```

## 资源文件

对于人脸识别功能，需要加载额外的模型文件。默认情况下，这些文件会从 CDN 自动加载，但你也可以选择自行托管这些文件。

```javascript
// 自定义模型路径
import { FaceModule } from 'id-scanner-lib';

const faceModule = new FaceModule({
  modelsPath: '/path/to/your/models/'
});

await faceModule.initialize();
```

## 验证安装

安装完成后，你可以通过以下简单代码验证库是否正常工作：

```javascript
import { IDScanner } from 'id-scanner-lib';

async function verifyInstallation() {
  try {
    const scanner = new IDScanner();
    await scanner.initialize();
    console.log('ID-Scanner-Lib 安装成功并正常工作！');
    return true;
  } catch (error) {
    console.error('ID-Scanner-Lib 安装验证失败:', error);
    return false;
  }
}

verifyInstallation();
```

## 设备权限

对于摄像头访问，用户必须授予网页摄像头权限。在实际应用中，建议提前向用户说明为什么需要摄像头权限。

```javascript
async function requestCameraPermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    console.log('摄像头权限获取成功');
    
    // 停止流，我们只是验证权限
    stream.getTracks().forEach(track => track.stop());
    
    return true;
  } catch (error) {
    console.error('摄像头权限获取失败:', error);
    return false;
  }
}
```

## 故障排除

如果你在安装或使用过程中遇到问题，请尝试以下步骤：

1. **检查浏览器兼容性** - 确保你使用的是支持的浏览器版本
2. **验证摄像头权限** - 对于扫描功能，需要摄像头访问权限
3. **网络问题** - 如果模型加载失败，可能是网络问题导致无法下载模型文件
4. **查看控制台错误** - 浏览器开发者工具中的控制台通常会显示有用的错误信息
5. **检查依赖项版本** - 确保所有依赖项是兼容的版本

如需进一步帮助，请查看[常见问题](/faq)或[提交 issue](https://github.com/agions/id-scanner-lib/issues)。 