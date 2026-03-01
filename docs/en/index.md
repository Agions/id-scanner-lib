---
layout: home
hero:
  name: ID-Scanner-Lib
  text: Browser-based ID Card & QR Code Scanner
  tagline: High-performance, modular TypeScript library for ID card recognition and QR code scanning
  image:
    src: /assets/logo.svg
    alt: ID-Scanner-Lib
  actions:
    - theme: brand
      text: Quick Start
      link: /en/guide
    - theme: alt
      text: API Docs
      link: /en/API
    - theme: alt
      text: View on GitHub
      link: https://github.com/agions/id-scanner-lib
features:
  - icon: 🆔
    title: ID Card Recognition
    details: Accurately recognize ID card front/back, auto-extract name, ID number, address and more
  - icon: 📷
    title: QR Code Scanning
    details: Support multiple QR code and barcode formats, real-time scanning and image parsing
  - icon: 👤
    title: Face Recognition
    details: Face detection, landmark positioning and liveness detection
  - icon: 🧩
    title: Modular Design
    details: Load modules on-demand to optimize application size
  - icon: 📱
    title: Cross-Platform
    details: Support both PC and mobile devices with responsive design
  - icon: ⚡
    title: High Performance
    details: Optimized processing algorithms with Web Worker support
---

## Introduction

ID-Scanner-Lib is a pure browser-based ID card and QR code recognition library for high-quality image processing, OCR text recognition, ID card information extraction, and QR code scanning in the browser. All features run on the client side without server processing, ensuring user data security.

## Key Features

- **🆔 ID Card Recognition** - Recognize ID card front/back, extract name, ID number, address
- **📷 QR Code Scanning** - Support multiple QR code and barcode formats
- **👤 Face Recognition** - Face detection, landmark positioning, liveness detection
- **🧩 Modular Design** - Load modules on-demand
- **📱 Cross-Platform** support
- ** - PC and mobile⚡ High Performance** - Optimized algorithms with Web Worker
- **🔒 Privacy First** - All processing done client-side

## Installation

```bash
npm install id-scanner-lib --save
```

## Basic Usage

```javascript
import { IDScanner } from 'id-scanner-lib';

const scanner = new IDScanner();
await scanner.initialize();

const idCardModule = scanner.getIDCardModule();
const result = await idCardModule.recognize(imageElement);

console.log('Result:', result);
```

## Why ID-Scanner-Lib?

- **Pure Frontend** - No server processing required
- **Open Source** - MIT licensed
- **Performance** - Optimized for mobile devices
- **Privacy** - Data stays in browser
- **Easy Integration** - Simple API and comprehensive docs

## License

MIT License
