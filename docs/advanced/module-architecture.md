# 模块架构

ID-Scanner-Lib 采用了高度模块化的架构设计，使得库可以灵活地按需加载各种功能，同时保持较小的体积和高性能。本文档将详细介绍该架构的设计理念和实现细节。

## 架构概述

整个库的架构可以概括为以下几个核心部分：

1. **核心层**：提供基础设施和公共功能
2. **模块管理器**：负责模块的生命周期管理
3. **功能模块**：实现具体的业务功能
4. **工具层**：提供通用工具和辅助功能

![模块架构图](/assets/images/architecture.svg)

## 核心层

核心层提供了库的基础设施和公共功能，包括：

- **ConfigManager**：全局配置管理
- **Logger**：日志系统
- **EventEmitter**：事件发射与订阅
- **Result**：统一的结果封装
- **错误处理**：统一的错误类型和处理机制

这些组件为整个库提供了稳定的基础，确保各个模块能够协同工作。

### 配置管理

`ConfigManager` 采用单例模式，提供全局配置的存储和访问：

```typescript
const config = ConfigManager.getInstance();
config.set('camera.resolution.width', 1280);
const width = config.get('camera.resolution.width');
```

### 日志系统

`Logger` 提供多级别的日志记录和多种日志处理器：

```typescript
const logger = Logger.getInstance();
logger.info('ModuleManager', '初始化完成');
logger.error('OCRProcessor', '处理失败', error);
```

### 事件系统

`EventEmitter` 提供基础的事件发射和订阅功能：

```typescript
moduleManager.on('module:initialized', (data) => {
  console.log(`模块 ${data.name} 已初始化`);
});
```

## 模块管理器

`ModuleManager` 是整个架构的核心，负责管理所有功能模块的生命周期，包括注册、初始化、卸载等。它实现了单例模式，确保全局只有一个模块管理器实例。

主要功能：

- **模块注册**：将功能模块注册到管理器中
- **模块初始化**：统一初始化所有注册的模块
- **模块卸载**：释放模块资源
- **模块获取**：根据名称获取特定模块实例

```typescript
// 获取模块管理器实例
const moduleManager = ModuleManager.getInstance();

// 注册模块
moduleManager.register(new IDCardModule());

// 初始化所有模块
await moduleManager.initialize();

// 获取特定模块
const idCardModule = moduleManager.getModule<IDCardModule>('id-card');

// 卸载所有模块
await moduleManager.dispose();
```

## 基础模块接口

所有功能模块都实现了 `Module` 接口，确保模块具有统一的行为：

```typescript
interface Module {
  /** 模块名称 */
  name: string;
  
  /** 模块版本 */
  version: string;
  
  /** 模块是否已初始化 */
  isInitialized: boolean;
  
  /** 初始化模块 */
  initialize(): Promise<void>;
  
  /** 释放模块资源 */
  dispose(): Promise<void>;
}
```

## 功能模块

ID-Scanner-Lib 目前包含三个主要的功能模块：

1. **IDCardModule**：身份证识别模块
2. **QRCodeModule**：二维码扫描模块
3. **FaceModule**：人脸识别模块

每个模块都是完全独立的，可以单独使用，也可以组合使用。

### 模块实现

每个功能模块都遵循相似的结构：

```
modules/
  ├── id-card/
  │   ├── index.ts          # 模块入口
  │   ├── types.ts          # 类型定义
  │   ├── id-card-detector.ts  # 身份证检测器
  │   ├── ocr-processor.ts  # OCR处理器
  │   └── anti-fake-detector.ts  # 防伪检测器
  ├── qrcode/
  │   ├── index.ts
  │   ├── types.ts
  │   └── qr-code-scanner.ts
  └── face/
      ├── index.ts
      ├── types.ts
      ├── face-detector.ts
      └── liveness-detector.ts
```

## 按需加载机制

ID-Scanner-Lib 支持按需加载模块，这意味着您只需加载您实际需要的功能，从而减小应用的体积。

在创建 `IDScanner` 实例时，可以通过选项来控制加载哪些模块：

```typescript
// 只加载身份证和二维码模块
const scanner = new IDScanner({
  enableIDCard: true,
  enableQRCode: true,
  enableFace: false  // 不加载人脸识别模块
});
```

## 模块间通信

模块之间可以通过以下方式进行通信：

1. **事件系统**：模块可以发射事件，其他模块可以订阅这些事件
2. **模块管理器**：通过模块管理器获取其他模块的实例
3. **共享配置**：通过 `ConfigManager` 共享配置

## 扩展性设计

ID-Scanner-Lib 的架构设计使其具有很好的扩展性，可以轻松添加新的功能模块：

1. 创建新的模块类，实现 `Module` 接口
2. 在模块中实现特定功能
3. 在 `IDScanner` 类中添加相应的选项和获取方法
4. 注册到 `ModuleManager` 中

## 最佳实践

### 模块使用建议

- 只加载您需要的模块，减小应用体积
- 在应用启动时初始化 `IDScanner`，避免用户操作时的延迟
- 在不需要时及时释放资源，调用 `dispose()` 方法

### 自定义模块

您可以根据自己的需求创建自定义模块：

```typescript
import { Module } from 'id-scanner-lib';

class CustomModule implements Module {
  name = 'custom-module';
  version = '1.0.0';
  isInitialized = false;
  
  async initialize(): Promise<void> {
    // 初始化逻辑
    this.isInitialized = true;
  }
  
  async dispose(): Promise<void> {
    // 释放资源
    this.isInitialized = false;
  }
  
  // 自定义功能
  async doSomething(): Promise<void> {
    // ...
  }
}
```

## 模块依赖关系

虽然模块设计为独立工作，但某些模块可能会有依赖关系。例如，身份证识别模块可能会使用人脸模块来验证照片中的人脸。在这种情况下，模块会在运行时检查依赖是否可用，并相应地调整行为。

```typescript
const faceModule = moduleManager.getModule<FaceModule>('face');
if (faceModule) {
  // 使用人脸模块功能
  const faceResult = await faceModule.detectFace(image);
} else {
  // 回退到替代方案
}
```

## 总结

ID-Scanner-Lib 的模块化架构使其具有高度的灵活性和可扩展性，同时保持了较小的体积和高性能。通过理解这一架构，您可以更有效地使用库，并根据需要进行定制和扩展。 