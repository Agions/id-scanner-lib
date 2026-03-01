---
layout: home
hero:
  name: ID-Scanner-Lib
  text: 纯前端身份证与二维码识别库
  tagline: 高性能、模块化的 TypeScript 身份验证解决方案
  image:
    src: /assets/logo.svg
    alt: ID-Scanner-Lib
  actions:
    - theme: brand
      text: 快速开始
      link: /guide
    - theme: alt
      text: API 文档
      link: /API
    - theme: alt
      text: 在 GitHub 上查看
      link: https://github.com/agions/id-scanner-lib
features:
  - icon: 🆔
    title: 身份证识别
    details: 准确识别身份证正反面，自动提取姓名、身份证号、住址等信息
  - icon: 📷
    title: 二维码扫描
    details: 支持多种二维码和条形码格式，实时扫描和图片解析
  - icon: 👤
    title: 人脸识别
    details: 人脸检测、特征点定位和活体检测功能
  - icon: 🧩
    title: 模块化设计
    details: 按需加载功能模块，优化应用体积
  - icon: 📱
    title: 多端适配
    details: 同时支持 PC 和移动端，响应式设计
  - icon: ⚡
    title: 高性能处理
    details: 优化的处理算法和 Web Worker 支持，流畅运行

---

<div class="stats">

| 指标 | 数值 |
|------|------|
| 包体积 | <kbd>173KB</kbd> (gzip: ~60KB) |
| TypeScript | ✅ 100% 类型支持 |
| 浏览器兼容 | Chrome 80+ / Firefox 75+ / Safari 14+ |
| 模块数量 | 3+ 核心模块 |

</div>

## 为什么选择 ID-Scanner-Lib?

<div class="benefits">

### 🔒 隐私优先
所有数据处理在客户端完成，敏感信息永不离开浏览器

### ⚡ 高性能
优化的 WebAssembly + Web Worker 架构，流畅处理高帧率视频流

### 🧩 模块化
按需加载，打包体积可控

### 🌐 跨平台
支持所有现代浏览器，PC / 移动端一致体验

### 📖 完整文档
中文文档 + 英文文档 + API 参考 + 在线演示

### MIT 许可证
开源免费，可商用

</div>

## 快速开始

```bash
# 安装
npm install id-scanner-lib
```

```typescript
import { IDScanner } from 'id-scanner-lib';

// 初始化
await IDScanner.initialize({ debug: true });

// 使用模块
const idCard = scanner.getIDCardModule();
const result = await idCard.recognize(imageElement);
```

## 在线演示

<div class="demos">

[🆔 身份证识别 →](/demos/idcard)
[📷 二维码扫描 →](/demos/qrcode)
[👤 人脸识别 →](/demos/face)

</div>

## 生态

<div class="ecosystem">

| 项目 | 说明 |
|------|------|
| [id-scanner-lib](https://npmjs.com/package/id-scanner-lib) | 核心库 |
| [id-scanner-react](https://npmjs.com/package/id-scanner-react) | React 组件 |
| [id-scanner-vue](https://npmjs.com/package/id-scanner-vue) | Vue 3 组件 |

</div>

<style>
.stats {
  margin: 32px 0;
}

.stats table {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.stats kbd {
  padding: 4px 8px;
  background: var(--vp-c-bg-soft);
  border-radius: 4px;
  font-size: 14px;
}

.benefits {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin: 32px 0;
}

.benefits h3 {
  font-size: 16px;
  margin-bottom: 8px;
}

.demos {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 24px 0;
}

.demos a {
  padding: 12px 24px;
  background: var(--vp-c-brand);
  color: white;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s;
}

.demos a:hover {
  background: var(--vp-c-brand-dark);
}

.ecosystem {
  margin: 24px 0;
}

.ecosystem table {
  max-width: 500px;
}
</style>
