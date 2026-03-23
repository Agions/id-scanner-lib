---
layout: home

hero:
  name: ID-Scanner-Lib
  text: 纯前端身份证与二维码识别
  tagline: 高性能、模块化的 TypeScript 身份验证解决方案
  image:
    src: /assets/logo.svg
    alt: ID-Scanner-Lib Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide
    - theme: alt
      text: API 参考
      link: /API
    - theme: alt
      text: GitHub
      link: https://github.com/agions/id-scanner-lib

features:
  - icon: 🪪
    title: 身份证识别
    details: 精准识别身份证正反面，自动提取姓名、身份证号、地址、有效期等关键信息
  - icon: 📷
    title: 二维码扫描
    details: 支持 QR Code、Data Matrix、PDF417 等多种格式，兼容图片和实时视频流
  - icon: 👤
    title: 人脸识别
    details: 先进的人脸检测、特征点定位与活体检测，保障身份真实性
  - icon: ⚡
    title: 高性能
    details: WebAssembly 加速 + Web Worker 异步处理，轻松应对高帧率视频流
  - icon: 🔒
    title: 隐私安全
    details: 纯前端处理，数据永不离开浏览器，敏感信息安全有保障
  - icon: 📦
    title: 轻量模块化
    details: 按需加载Tree-shakable，打包体积可控
---

<div class="hero-stats">

::: primary
**173KB** 轻量级包体积
:::
::: success
**100%** TypeScript 类型覆盖
:::
::: info
**MIT** 开源可商用
:::

</div>

<div class="capabilities">

## 核心能力

### 🏢 企业级身份验证

```typescript
import { IDScanner } from 'id-scanner-lib';

// 一行代码初始化
const scanner = await IDScanner.create();
scanner.useAllModules(); // 使用全部模块

// 身份证识别
const idCard = scanner.getIDCardModule();
const result = await idCard.recognizeFromImage(imageElement);

console.log(result.name);     // 姓名
console.log(result.idNumber); // 身份证号
console.log(result.address);  // 地址
```

### 📱 跨平台兼容

| 平台 | 最低版本 |
|------|----------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |
| iOS Safari | 14+ |
| Android Chrome | 80+ |

</div>

<div class="comparison">

## 为什么选择我们？

| 特性 | ID-Scanner-Lib | 其他方案 |
|------|-----------------|----------|
| 部署方式 | 仅前端，零后端 | 需要服务器 |
| 数据隐私 | 100% 本地处理 | 数据上传云端 |
| 离线支持 | ✅ 完全支持 | ❌ 依赖网络 |
| 包体积 | ~173KB | 500KB+ |
| 许可证 | MIT 自由商用 | 商业授权 |

</div>

<div class="quick-start">

## 快速接入

### 1. 安装

```bash
npm install id-scanner-lib
# 或
pnpm add id-scanner-lib
```

### 2. 初始化

```typescript
import { IDScanner } from 'id-scanner-lib';

const scanner = await IDScanner.create({
  // 配置模块（按需加载）
  modules: {
    idCard: true,
    qrCode: true,
    face: true
  }
});
```

### 3. 使用

```typescript
// 身份证识别
const idCardModule = scanner.getIDCardModule();
const result = await idCardModule.recognize(imageData);

// 二维码扫描
const qrModule = scanner.getQRCodeModule();
const { data } = await qrModule.scan(videoElement);
```

</div>

<div class="demo-cards">

## 在线演示

<div class="demo-grid">

```card
### 🪪 身份证识别
支持正反面、多场景
[立即体验](/demos/idcard)
```

```card
### 📷 二维码扫描
支持多种格式
[立即体验](/demos/qrcode)
```

```card
### 👤 人脸识别
活体检测保障安全
[立即体验](/demos/face)
```

</div>

</div>

<style>

/* 英雄区统计 */
.hero-stats {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin: 40px 0;
  flex-wrap: wrap;
}

.hero-stats > div {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 14px;
}

.hero-stats .primary {
  background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  color: white;
}

.hero-stats .success {
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.hero-stats .info {
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

/* 核心能力 */
.capabilities {
  margin: 48px 0;
}

.capabilities h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
  color: var(--vp-c-text-1);
}

.capabilities pre {
  border-radius: 12px;
  margin: 16px 0;
  border: 1px solid var(--vp-c-divider);
}

/* 特性对比 */
.comparison {
  margin: 48px 0;
}

.comparison h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
}

.comparison table th:first-child,
.comparison table td:first-child {
  width: 30%;
}

/* 快速开始 */
.quick-start {
  margin: 48px 0;
  padding: 32px;
  background: var(--vp-c-bg-soft);
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
}

.quick-start h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 16px;
}

.quick-start pre {
  border-radius: 8px;
  margin: 12px 0;
}

/* 演示卡片 */
.demo-cards {
  margin: 48px 0;
}

.demo-cards h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 20px;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.demo-grid > div {
  padding: 24px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  transition: all 0.2s ease;
}

.demo-grid > div:hover {
  transform: translateY(-4px);
  border-color: var(--vp-c-brand);
  box-shadow: 0 8px 24px rgba(37, 99, 235, 0.15);
}

.demo-grid h4 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
}

.demo-grid p {
  font-size: 13px;
  color: var(--vp-c-text-2);
  margin-bottom: 16px;
}

.demo-grid a {
  display: inline-block;
  padding: 8px 16px;
  background: var(--vp-c-brand);
  color: white !important;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none !important;
  transition: background 0.2s;
}

.demo-grid a:hover {
  background: var(--vp-c-brand-dark);
}

/* 响应式 */
@media (max-width: 640px) {
  .hero-stats {
    flex-direction: column;
    align-items: center;
  }
  
  .demo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
