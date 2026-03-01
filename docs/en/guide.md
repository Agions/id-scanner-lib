# Quick Start

Get started with ID-Scanner-Lib in minutes.

## Prerequisites

- Node.js 14+
- Modern browser (Chrome 80+, Firefox 75+, Safari 14+, Edge 80+)

## Installation

```bash
npm install id-scanner-lib
```

## Basic Example

### 1. Import the Library

```typescript
import { IDScanner, FaceModule, IDCardModule, QRCodeModule } from 'id-scanner-lib';
```

### 2. Initialize

```typescript
// Initialize the library
await IDScanner.initialize({
  debug: true
});
```

### 3. Use Modules

#### ID Card Recognition

```typescript
const idCardModule = new IDCardModule({
  onSuccess: (result) => {
    console.log('ID Card Data:', result);
  },
  onError: (error) => {
    console.error('Error:', error);
  }
});

await idCardModule.initialize();

// Recognize from image
const imageElement = document.getElementById('idcard');
const result = await idCardModule.recognize(imageElement);
```

#### QR Code Scanning

```typescript
const qrScanner = IDScanner.createQRScanner({
  scanFrequency: 200,
  formats: ['qrcode', 'code_128']
});

await qrScanner.init();

// Start real-time scanning
await qrScanner.startRealtime(videoElement);

qrScanner.on('result', (event) => {
  console.log('Scanned:', event.result.content);
});
```

#### Face Recognition

```typescript
const faceModule = new FaceModule({
  onFaceDetected: (faces) => {
    console.log('Faces detected:', faces);
  }
});

await faceModule.initialize();

await faceModule.startFaceRecognition(videoElement);
```

## Complete Example

```typescript
import { IDScanner } from 'id-scanner-lib';

async function main() {
  // Initialize
  await IDScanner.initialize({ debug: true });

  // Create scanner
  const scanner = new IDScanner();

  // Get modules
  const idCardModule = scanner.getIDCardModule();
  const qrScanner = scanner.getQRCodeModule();
  const faceModule = scanner.getFaceModule();

  // Initialize modules
  await Promise.all([
    idCardModule.initialize(),
    qrScanner.init(),
    faceModule.initialize()
  ]);

  console.log('All modules ready!');
}

main();
```

## Next Steps

- [API Reference](/en/API)
- [ID Card Guide](/en/guide/idcard)
- [QR Code Guide](/en/guide/qrcode)
- [Face Recognition Guide](/en/guide/face)
