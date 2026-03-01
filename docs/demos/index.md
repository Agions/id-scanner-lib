---
layout: page
title: 在线演示
---

# 在线演示

Try out ID-Scanner-Lib directly in your browser!

## 功能演示

<div class="demo-grid">

### 🆔 身份证识别
识别身份证正反面，自动提取姓名、身份证号、住址等信息

<a href="/demos/idcard" class="demo-btn">打开演示 →</a>

---

### 📷 二维码扫描
支持多种二维码和条形码格式，实时扫描

<a href="/demos/qrcode" class="demo-btn">打开演示 →</a>

---

### 👤 人脸识别
人脸检测、特征点定位、活体检测

<a href="/demos/face" class="demo-btn">打开演示 →</a>

---

### 🔗 条
支持 Code码识别 128、Code 39、EAN-13 等格式

<a href="/demos/barcode" class="demo-btn">打开演示 →</a>

</div>

## 交互示例

### 基础使用

```typescript
import { IDScanner } from 'id-scanner-lib';

// 创建实例
const scanner = new IDScanner();

// 初始化
await scanner.initialize();

// 获取模块
const idCard = scanner.getIDCardModule();
const qr = scanner.getQRCodeModule();
const face = scanner.getFaceModule();
```

### 实时摄像头扫描

```typescript
// 获取摄像头视频流
const video = document.getElementById('video');

// 启动二维码实时扫描
await qr.startRealtime(video);

// 监听结果
qr.on('result', (event) => {
  console.log('扫描结果:', event.result.content);
});
```

## 环境要求

- 现代浏览器 (Chrome 80+, Firefox 75+, Safari 14+)
- 需要摄像头权限 (HTTPS 环境)
- 支持 PC 和移动设备

<style>
.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin: 32px 0;
}

.demo-grid > div {
  padding: 24px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.demo-btn {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 20px;
  background: var(--vp-c-brand);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.demo-btn:hover {
  background: var(--vp-c-brand-dark);
  transform: translateY(-2px);
}
</style>
