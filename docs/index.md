---
layout: home
hero:
  name: ID-Scanner-Lib
  text: 纯前端身份证与二维码识别库
  tagline: 高性能、模块化的TypeScript身份证与二维码识别解决方案
  image:
    src: /assets/logo.svg
    alt: ID-Scanner-Lib
  actions:
    - theme: brand
      text: 快速开始
      link: /guide
    - theme: alt
      text: API文档
      link: /API
    - theme: alt
      text: 在GitHub上查看
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
    details: 同时支持PC和移动端，响应式设计
  - icon: ⚡
    title: 高性能处理
    details: 优化的处理算法和Web Worker支持，流畅运行
---

## 简介

ID-Scanner-Lib 是一个纯前端实现的身份证与二维码识别库，用于在浏览器中进行高质量的图像处理、OCR文字识别、身份证信息提取和二维码扫描。所有功能均在浏览器端运行，无需服务器处理，确保用户数据安全。

## 主要特性

- **🆔 身份证识别** - 准确识别身份证正反面，自动提取姓名、身份证号、住址等信息
- **📷 二维码扫描** - 支持多种二维码和条形码格式，实时扫描和图片解析
- **👤 人脸识别** - 人脸检测、特征点定位和活体检测功能
- **🧩 模块化设计** - 按需加载功能模块，优化应用体积
- **📱 多端适配** - 同时支持PC和移动端，响应式设计
- **⚡ 高性能处理** - 优化的处理算法和Web Worker支持，流畅运行
- **🔒 隐私保护** - 纯客户端处理，数据不出浏览器

## 安装

使用 npm:

```bash
npm install id-scanner-lib --save
```

或者使用 yarn:

```bash
yarn add id-scanner-lib
```

## 基本用法

```javascript
import { IDScanner } from 'id-scanner-lib';

// 创建扫描器实例
const scanner = new IDScanner();

// 初始化扫描器
await scanner.initialize();

// 获取身份证模块
const idCardModule = scanner.getIDCardModule();

// 识别身份证
const imageElement = document.getElementById('idcard-image');
const result = await idCardModule.recognize(imageElement);

console.log('识别结果:', result);
```

## 在线演示

<div class="demos">
  <div class="demo-card">
    <h3>身份证识别</h3>
    <p>识别身份证并提取信息</p>
    <a href="./demos/idcard.html">查看演示</a>
  </div>
  <div class="demo-card">
    <h3>二维码扫描</h3>
    <p>实时扫描多种码格式</p>
    <a href="./demos/qrcode.html">查看演示</a>
  </div>
  <div class="demo-card">
    <h3>人脸识别</h3>
    <p>检测人脸和活体验证</p>
    <a href="./demos/face.html">查看演示</a>
  </div>
</div>

## 为什么选择 ID-Scanner-Lib?

- **纯前端实现**: 无需服务器处理，降低部署复杂度和成本
- **完全开源**: 基于MIT许可证，可自由使用和修改
- **专注性能**: 针对移动设备优化，确保流畅体验
- **隐私优先**: 所有数据处理在客户端完成，不会上传敏感信息
- **简单集成**: 提供易用的API和丰富的文档

## 社区与支持

- [GitHub仓库](https://github.com/agions/id-scanner-lib)
- [问题反馈](https://github.com/agions/id-scanner-lib/issues)
- [贡献指南](./contributing.html)

## 许可证

MIT License 