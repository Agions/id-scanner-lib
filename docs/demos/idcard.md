---
title: 身份证识别演示
description: ID-Scanner-Lib 身份证识别功能实时演示与代码示例
---

# 身份证识别演示

此页面展示了 ID-Scanner-Lib 的身份证识别功能，用户可以通过摄像头或上传图片的方式进行身份证识别。

## 功能演示

由于浏览器安全限制，在此文档站点无法直接调用摄像头。您可以下载完整的演示代码在本地运行，或参考下方的实现方式进行集成。

## 实现代码

以下是实现身份证识别功能的核心代码：

```javascript
import { IDScanner } from 'id-scanner-lib';

// 初始化扫描器
async function initializeScanner() {
  const scanner = new IDScanner();
  await scanner.initialize();
  
  // 获取身份证模块
  const idCardModule = scanner.getIDCardModule({
    detectBothSides: true,     // 自动检测正反面
    extractAvatar: true,       // 提取头像
    enhanceImage: true         // 增强图像
  });
  
  return idCardModule;
}

// 从图片中识别身份证
async function recognizeFromImage(idCardModule, imageElement) {
  try {
    const result = await idCardModule.recognize(imageElement);
    displayResult(result);
  } catch (error) {
    displayError(error);
  }
}

// 显示识别结果
function displayResult(result) {
  const resultDiv = document.getElementById('result');
  
  if (result.side === 'front') {
    // 显示身份证正面信息
    resultDiv.innerHTML = `
      <h3>身份证信息</h3>
      <p><strong>姓名:</strong> ${result.name}</p>
      <p><strong>性别:</strong> ${result.gender}</p>
      <p><strong>民族:</strong> ${result.ethnicity}</p>
      <p><strong>出生日期:</strong> ${result.birthDate}</p>
      <p><strong>地址:</strong> ${result.address}</p>
      <p><strong>身份证号:</strong> ${result.idNumber}</p>
    `;
  } else {
    // 显示身份证背面信息
    resultDiv.innerHTML = `
      <h3>身份证背面信息</h3>
      <p><strong>签发机关:</strong> ${result.issuingAuthority}</p>
      <p><strong>有效期限:</strong> ${result.validPeriod}</p>
    `;
  }
}
```

## 高级配置

ID-Scanner-Lib 提供了多种选项以自定义身份证识别行为：

```javascript
const idCardModule = scanner.getIDCardModule({
  // 识别选项
  detectBothSides: true,     // 自动检测正反面
  extractAvatar: true,       // 提取头像
  avatarQuality: 'high',     // 头像质量
  
  // 图像处理选项
  enhanceImage: true,        // 增强图像质量
  autoRotate: true,          // 自动旋转校正
  
  // 验证选项
  validateID: true,          // 验证身份证号码格式
  
  // 性能选项
  recognitionMode: 'balanced', // 识别模式
  useWorker: true            // 使用 Web Worker
});
```

## 性能优化建议

1. 使用合适的图像分辨率（建议 1280×720）
2. 启用 Web Worker 多线程处理
3. 在移动设备上使用 'fast' 识别模式
4. 使用良好光照条件提高识别准确率
