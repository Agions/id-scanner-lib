# 错误处理

ID-Scanner-Lib 提供了完善的错误处理机制，帮助开发者识别和解决在使用库过程中可能遇到的问题。本文档将详细介绍如何有效地处理各种错误情况。

## 错误类型体系

ID-Scanner-Lib 定义了一个完整的错误类型层次结构，所有特定错误都继承自基础的 `IDScannerError` 类：

<div class="error-hierarchy">
```
IDScannerError (基类)
├── InitializationError   - 初始化失败
├── DeviceError           - 设备访问错误
│   └── CameraAccessError - 摄像头访问错误
├── FaceDetectionError    - 人脸检测错误
├── FaceComparisonError   - 人脸比对错误
├── LivenessDetectionError - 活体检测错误
├── OCRProcessingError    - OCR识别错误
├── QRScanError           - 二维码扫描错误
├── IDCardDetectionError  - 身份证检测错误
├── ResourceLoadError     - 资源加载错误
├── InvalidArgumentError  - 参数错误
└── NotSupportedError     - 不支持的功能
```
</div>

## 错误处理方式

### 基本的 try/catch 处理

最简单的错误处理方式是使用 try/catch 块捕获异常：

```typescript
import { IDScanner, CameraAccessError } from 'id-scanner-lib';

async function scanIDCard() {
  const scanner = new IDScanner();
  
  try {
    await scanner.initialize();
    const idCardModule = scanner.getIDCardModule();
    
    if (!idCardModule) {
      throw new Error('身份证模块未加载');
    }
    
    const result = await idCardModule.processImage(imageElement);
    console.log('识别结果:', result);
  } catch (error) {
    if (error instanceof CameraAccessError) {
      console.error('无法访问摄像头:', error.message);
      // 显示友好的用户提示
      showUserFriendlyMessage('请允许摄像头访问权限');
    } else {
      console.error('识别失败:', error);
      showUserFriendlyMessage('识别失败，请重试');
    }
  } finally {
    // 释放资源
    await scanner.dispose();
  }
}
```

### 使用 Result 类处理结果

ID-Scanner-Lib 的许多方法返回 `Result` 对象，它封装了操作的成功或失败结果，提供了更优雅的错误处理方式：

```typescript
import { IDScanner } from 'id-scanner-lib';

async function scanIDCard() {
  const scanner = new IDScanner();
  await scanner.initialize();
  
  const idCardModule = scanner.getIDCardModule();
  if (!idCardModule) {
    console.error('身份证模块未加载');
    return;
  }
  
  // 使用 Result 处理结果
  const result = await idCardModule.recognizeIDCard(imageElement);
  
  result
    .onSuccess(data => {
      console.log('识别成功:', data);
      displayIDCardInfo(data);
    })
    .onFailure(error => {
      console.error('识别失败:', error);
      showErrorMessage(error.message);
    })
    .onFinally(() => {
      // 清理工作
      scanner.dispose();
    });
}
```

### 自定义错误处理器

对于更复杂的应用，您可以创建自定义错误处理器：

```typescript
class ErrorHandler {
  // 错误处理映射
  private handlers = new Map<string, (error: Error) => void>();
  
  // 注册处理器
  register(errorCode: string, handler: (error: Error) => void): void {
    this.handlers.set(errorCode, handler);
  }
  
  // 处理错误
  handle(error: Error): boolean {
    if (error instanceof IDScannerError) {
      const handler = this.handlers.get(error.code);
      if (handler) {
        handler(error);
        return true;
      }
    }
    return false;
  }
}

// 使用示例
const errorHandler = new ErrorHandler();

// 注册各种错误的处理器
errorHandler.register('CAMERA_ACCESS_FAILED', (error) => {
  showPermissionRequest('摄像头访问被拒绝，请授予权限');
});

errorHandler.register('OCR_PROCESSING_FAILED', (error) => {
  showRetryDialog('文字识别失败，请调整光线后重试');
});

// 在捕获到错误时使用
try {
  await idCardModule.scan();
} catch (error) {
  // 如果有注册的处理器，则使用它
  if (!errorHandler.handle(error)) {
    // 否则使用默认处理
    console.error('未处理的错误:', error);
  }
}
```

## 常见错误及解决方案

### 初始化错误

```typescript
try {
  await scanner.initialize();
} catch (error) {
  if (error instanceof InitializationError) {
    console.error('初始化失败:', error.message);
    // 检查浏览器兼容性问题
    checkBrowserCompatibility();
  }
}
```

### 摄像头访问错误

```typescript
try {
  await qrCodeModule.startScan();
} catch (error) {
  if (error instanceof CameraAccessError) {
    if (error.message.includes('Permission denied')) {
      // 权限被拒绝
      showCameraPermissionGuide();
    } else if (error.message.includes('No camera available')) {
      // 无可用摄像头
      showNoCameraMessage();
    } else {
      // 其他摄像头错误
      console.error('摄像头错误:', error);
    }
  }
}
```

### OCR识别错误

```typescript
try {
  const result = await idCardModule.recognize(image);
  if (!result.success) {
    throw new OCRProcessingError('OCR识别失败');
  }
} catch (error) {
  if (error instanceof OCRProcessingError) {
    // 提供改善建议
    showOCRTips('请确保图像清晰，光线充足，并且身份证放置在框内');
  }
}
```

### 资源加载错误

```typescript
try {
  await faceModule.initialize();
} catch (error) {
  if (error instanceof ResourceLoadError) {
    // 提示用户检查网络连接
    showNetworkErrorMessage('模型资源加载失败，请检查网络连接');
    // 尝试使用备用资源
    tryFallbackResources();
  }
}
```

## 自定义错误

您可以扩展错误类型系统，创建自定义错误：

```typescript
import { IDScannerError } from 'id-scanner-lib';

// 创建自定义错误类型
class CustomProcessingError extends IDScannerError {
  constructor(message: string) {
    super(`自定义处理错误: ${message}`, { code: 'CUSTOM_PROCESSING_ERROR' });
    this.name = 'CustomProcessingError';
  }
}

// 使用自定义错误
function processCustomLogic() {
  if (somethingWrong) {
    throw new CustomProcessingError('处理失败');
  }
}

// 处理自定义错误
try {
  processCustomLogic();
} catch (error) {
  if (error instanceof CustomProcessingError) {
    console.error('自定义处理失败:', error.message);
  }
}
```

## 错误日志记录

ID-Scanner-Lib 提供了内置的日志系统，可用于记录和跟踪错误：

```typescript
import { IDScanner, Logger, LogLevel } from 'id-scanner-lib';

// 获取全局 Logger 实例
const logger = Logger.getInstance();

// 设置日志级别
logger.setLevel(LogLevel.DEBUG);

// 添加自定义日志处理器
logger.addHandler((level, module, message, error) => {
  if (level === LogLevel.ERROR) {
    // 记录到本地存储，稍后可上传分析
    this.saveErrorLog({ level, module, message, error });
  }
});

// 在错误处理中使用
try {
  await scanner.initialize();
} catch (error) {
  // 自动记录错误详情
  logger.error('Main', '初始化失败', error);
  
  // 显示用户友好的错误消息
  showErrorMessage('无法初始化扫描器，请稍后重试');
}
```

## 错误预防最佳实践

### 1. 初始化前检查环境

在初始化前检查运行环境，确保必要的功能可用：

```typescript
// 检查浏览器兼容性
function checkCompatibility() {
  const issues = [];
  
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    issues.push('摄像头访问API不可用');
  }
  
  if (!window.indexedDB) {
    issues.push('IndexedDB不可用，缓存功能将受限');
  }
  
  if (!window.Worker) {
    issues.push('Web Worker不可用，性能将受到影响');
  }
  
  return issues;
}

// 使用检查结果
const compatibilityIssues = checkCompatibility();
if (compatibilityIssues.length > 0) {
  logger.warn('Compatibility', `检测到兼容性问题: ${compatibilityIssues.join(', ')}`);
  showWarningMessage(compatibilityIssues.join('\n'));
}
```

### 2. 渐进增强

采用渐进增强的方法，确保即使在不支持某些功能的环境中也能正常工作：

```typescript
// 根据环境能力选择合适的特性
const scanner = new IDScanner({
  // 根据是否支持Web Worker决定是否启用
  ocr: {
    useWorker: !!window.Worker
  },
  // 根据浏览器性能决定使用的模型精度
  face: {
    detector: {
      modelSize: isLowEndDevice() ? 'tiny' : 'full'
    }
  }
});
```

### 3. 超时处理

为长时间运行的操作添加超时机制：

```typescript
/**
 * 添加超时处理的函数包装器
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    // 设置超时
    const timeoutId = setTimeout(() => {
      reject(new Error(errorMsg));
    }, timeoutMs);
    
    // 执行原始Promise
    promise
      .then(result => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

// 使用超时包装器
try {
  const result = await withTimeout(
    idCardModule.recognize(image),
    10000, // 10秒超时
    '身份证识别超时，请检查图像质量后重试'
  );
  console.log('识别结果:', result);
} catch (error) {
  console.error('识别失败:', error.message);
}
```

### 4. 优雅降级

当遇到不可恢复的错误时，提供替代方案：

```typescript
// 尝试使用高精度模型，失败时降级到低精度模型
async function recognizeWithFallback(image) {
  try {
    // 尝试高精度模型
    return await idCardModule.recognizeWithOptions(image, { mode: 'high-precision' });
  } catch (error) {
    logger.warn('Recognition', '高精度模型失败，降级到标准模式', error);
    
    // 降级到标准模式
    return await idCardModule.recognizeWithOptions(image, { mode: 'standard' });
  }
}
```

## 完整的错误处理示例

以下是一个综合性的错误处理示例，结合了上述所有技术：

```typescript
import { 
  IDScanner, 
  Logger, 
  LogLevel, 
  CameraAccessError, 
  OCRProcessingError, 
  InitializationError
} from 'id-scanner-lib';

class IDCardScannerApp {
  private scanner: IDScanner;
  private logger: Logger;
  
  constructor() {
    // 初始化日志系统
    this.logger = Logger.getInstance();
    this.logger.setLevel(LogLevel.DEBUG);
    
    // 添加日志处理器
    this.logger.addHandler((level, module, message, error) => {
      if (level === LogLevel.ERROR) {
        // 记录到本地存储，稍后可上传分析
        this.saveErrorLog({ level, module, message, error });
      }
    });
    
    // 创建Scanner实例
    this.scanner = new IDScanner({
      logLevel: LogLevel.INFO
    });
  }
  
  /**
   * 初始化应用
   */
  async initialize() {
    try {
      // 检查兼容性
      const issues = this.checkCompatibility();
      if (issues.length > 0) {
        this.showWarning(`检测到兼容性问题:\n${issues.join('\n')}`);
      }
      
      // 带超时的初始化
      await this.withTimeout(
        this.scanner.initialize(),
        15000,
        '初始化超时，请检查网络连接并重试'
      );
      
      this.logger.info('App', '初始化成功');
      this.showStatus('准备就绪');
    } catch (error) {
      this.handleInitializationError(error);
    }
  }
  
  /**
   * 扫描身份证
   */
  async scanIDCard(imageElement) {
    try {
      const idCardModule = this.scanner.getIDCardModule();
      if (!idCardModule) {
        throw new Error('身份证模块未加载');
      }
      
      this.showStatus('正在识别...');
      
      // 执行识别
      const result = await this.withTimeout(
        idCardModule.recognize(imageElement),
        10000,
        '识别超时，请检查图像质量'
      );
      
      if (result) {
        this.showResult(result);
        return result;
      } else {
        throw new Error('未检测到有效身份证');
      }
    } catch (error) {
      this.handleScanError(error);
    } finally {
      this.showStatus('识别完成');
    }
  }
  
  /**
   * 处理初始化错误
   */
  private handleInitializationError(error) {
    this.logger.error('App', '初始化失败', error);
    
    if (error instanceof CameraAccessError) {
      this.showError('无法访问摄像头，请检查权限设置');
    } else if (error instanceof InitializationError) {
      this.showError(`初始化失败: ${error.message}`);
    } else {
      this.showError('应用初始化失败，请刷新页面重试');
    }
  }
  
  /**
   * 处理扫描错误
   */
  private handleScanError(error) {
    this.logger.error('App', '扫描失败', error);
    
    if (error instanceof OCRProcessingError) {
      this.showError('文字识别失败，请确保图像清晰');
    } else if (error.message.includes('timeout')) {
      this.showError('识别超时，请重试');
    } else {
      this.showError(`识别失败: ${error.message}`);
    }
  }
  
  /**
   * 检查浏览器兼容性
   */
  private checkCompatibility() {
    const issues = [];
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('摄像头访问API不可用');
    }
    
    if (!window.Worker) {
      issues.push('Web Worker不可用，性能将受限');
    }
    
    return issues;
  }
  
  /**
   * 添加超时处理
   */
  private withTimeout(promise, timeoutMs, errorMsg) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(errorMsg));
      }, timeoutMs);
      
      promise
        .then(result => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }
  
  // UI相关方法（示例）
  private showStatus(message) {
    document.getElementById('status').textContent = message;
  }
  
  private showError(message) {
    const errorElement = document.getElementById('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
  
  private showWarning(message) {
    const warningElement = document.getElementById('warning');
    warningElement.textContent = message;
    warningElement.style.display = 'block';
  }
  
  private showResult(result) {
    // 显示识别结果
    const resultElement = document.getElementById('result');
    resultElement.innerHTML = `
      <h3>识别结果</h3>
      <p>姓名: ${result.name || '-'}</p>
      <p>身份证号: ${result.idNumber || '-'}</p>
      <p>地址: ${result.address || '-'}</p>
    `;
    resultElement.style.display = 'block';
  }
  
  private saveErrorLog(logData) {
    // 保存到本地存储
    const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
    logs.push({
      ...logData,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('error_logs', JSON.stringify(logs));
  }
}

// 使用示例
const app = new IDCardScannerApp();
app.initialize().then(() => {
  console.log('应用初始化完成');
});
```

## 总结

有效的错误处理是构建健壮应用程序的关键。通过使用 ID-Scanner-Lib 提供的错误处理机制，您可以：

1. **提供更好的用户体验** - 用户友好的错误消息和恢复选项
2. **简化调试** - 详细的错误信息和日志记录
3. **提高应用可靠性** - 优雅降级和故障恢复策略
4. **收集错误数据** - 用于持续改进您的应用

遵循本文档中的最佳实践，将帮助您构建更加稳定和用户友好的应用程序。 