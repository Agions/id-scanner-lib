# ID Scanner Lib

[English](./README_EN.md) | [中文](./README.md)

A powerful browser-based identity verification and face recognition library, supporting face detection, face comparison, liveness detection, and QR code scanning.

![Version](https://img.shields.io/npm/v/id-scanner-lib)
![License](https://img.shields.io/npm/l/id-scanner-lib)
![Size](https://img.shields.io/bundlephobia/min/id-scanner-lib)

## Features

- 🚀 **Modular Architecture** - Core components independently encapsulated for easy extension and maintenance
- 👤 **Face Detection** - Fast and accurate face localization and attribute analysis
- 🔍 **Face Comparison** - High-precision face similarity comparison
- 🛡️ **Liveness Detection** - Supports passive and active liveness verification to prevent photo/video spoofing
- 📱 **QR Code Scanning** - Supports QR codes and multiple barcode formats
- ⚡ **Lightweight** - Optimized model loading strategy, load on-demand
- 🌐 **Cross-Platform** - Supports all major browsers and devices

## Installation

### NPM

```bash
npm install id-scanner-lib
```

### CDN

```html
<!-- UMD -->
<script src="https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner-lib.min.js"></script>

<!-- ESM -->
<script type="module">
  import IDScannerLib from 'https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner-lib.esm.js';
</script>
```

## Quick Start

### Basic Usage

```typescript
import { IDScanner, FaceModule } from 'id-scanner-lib';

// Initialize the library
await IDScanner.initialize({
  debug: true
});

// Create face module
const faceModule = new FaceModule({
  onFaceDetected: (faces) => console.log('Face detected:', faces),
  onError: (error) => console.error('Error:', error)
});

// Initialize face module
await faceModule.initialize();

// Start camera and begin face detection
const videoElement = document.getElementById('video');
await faceModule.startFaceRecognition(videoElement);
```

### Face Comparison

```typescript
// Compare two face images
const result = await faceModule.compareFaces(image1, image2);

console.log(`Similarity: ${result.similarity}`);
console.log(`Is Match: ${result.isMatch}`);
```

### Liveness Detection

```typescript
// Passive liveness detection
const result = await faceModule.detectLiveness(image, {
  type: LivenessDetectionType.PASSIVE,
  onlyLive: true,
  minConfidence: 0.7
});

console.log(`Is Live: ${result.isLive}`);
console.log(`Confidence: ${result.score}`);
```

### QR Code Scanning

```typescript
// Create QR code scanner
const qrScanner = IDScanner.createQRScanner({
  scanFrequency: 200,
  formats: ['qrcode', 'code_128', 'code_39', 'ean_13']
});

// Initialize scanner
await qrScanner.init();

// Start real-time scanning
await qrScanner.startRealtime(videoElement);

// Handle scan results
qrScanner.on('module:realtime:result', (event) => {
  console.log('Scan result:', event.result.content);
});
```

## API Documentation

### Core Classes

| Class | Description |
|-------|-------------|
| `IDScanner` | Main entry class, manages all modules |
| `FaceModule` | Face detection, comparison, and liveness detection module |
| `IDCardModule` | ID card recognition module |
| `QRCodeModule` | QR code scanning module |

### Utility Functions

| Function | Description |
|----------|-------------|
| `withRetry()` | Async function wrapper with retry support |
| `AsyncCache` | Async cache class |
| `Semaphore` | Semaphore for concurrency control |
| `ErrorHandler` | Unified error handling |
| `LoadingStateManager` | Loading state management |

### Type Definitions

```typescript
import type {
  ImageSource,
  Rectangle,
  Point,
  ModuleState,
  BaseResult
} from 'id-scanner-lib';
```

## Performance Optimization

### Lazy Model Loading

Only load necessary models by default, load other models on-demand:

```typescript
const faceModule = new FaceModule({
  // Only load detection model, not expression/age models
  extractEmbeddings: false,
  detectExpressions: false,
  detectAgeGender: false
});
```

### Memory Management

Be sure to release resources after use:

```typescript
// Release module
await faceModule.dispose();

// Release entire library
await scanner.dispose();
```

## Browser Compatibility

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 80+ |
| Firefox | 75+ |
| Safari | 14+ |
| Edge | 80+ |

## Project Structure

```
src/
├── core/              # Core functionality
│   ├── camera-manager.ts    # Camera management
│   ├── config.ts           # Configuration management
│   ├── logger.ts           # Logging system
│   └── loading-state.ts    # Loading state
├── modules/           # Feature modules
│   ├── face/         # Face module
│   ├── id-card/      # ID card module
│   └── qrcode/       # QR code module
├── utils/            # Utility functions
│   ├── retry.ts      # Retry mechanism
│   └── error-handler.ts # Error handling
└── types/            # Type definitions
```

## FAQ

### Q: What if model loading fails?

A: Check your network connection or use local models:

```typescript
const faceModule = new FaceModule({
  modelPath: '/local/models'
});
```

### Q: How to handle permission issues?

A: Ensure the page runs under HTTPS and get user authorization:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  video: { facingMode: 'user' }
});
```

### Q: How to handle memory leaks?

A: Be sure to release resources after use:

```typescript
// On component unmount
useEffect(() => {
  return () => {
    faceModule?.dispose();
  };
}, []);
```

### Q: What image formats are supported?

A: Supports common browser image formats like JPEG, PNG, and WebP.

## TypeScript Types

For complete type definitions, see the [types](./src/types/) directory.

### Core Types

```typescript
// Image source
type ImageSource = HTMLImageElement | HTMLCanvasElement | HTMLVideoElement | ImageData;

// Rectangle region
interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Point coordinates
interface Point {
  x: number;
  y: number;
}

// Module state
type ModuleState = 'idle' | 'loading' | 'ready' | 'error' | 'disposed';

// Face detection result
interface FaceDetectionResult {
  faces: Face[];
  image: ImageData;
}

// Face details
interface Face {
  box: Rectangle;
  landmarks: Point[];
  expressions?: Record<string, number>;
  age?: number;
  gender?: string;
  embedding?: number[];
}
```

## Error Handling

### Error Types

```typescript
import { ScannerError, ErrorCode } from 'id-scanner-lib';

try {
  await faceModule.initialize();
} catch (error) {
  if (error instanceof ScannerError) {
    switch (error.code) {
      case ErrorCode.CAMERA_NOT_FOUND:
        // Handle camera not found
        break;
      case ErrorCode.PERMISSION_DENIED:
        // Handle permission denied
        break;
      case ErrorCode.MODEL_LOAD_FAILED:
        // Handle model loading failed
        break;
    }
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `CAMERA_NOT_FOUND` | Camera not found |
| `PERMISSION_DENIED` | Permission denied |
| `MODEL_LOAD_FAILED` | Model loading failed |
| `INITIALIZATION_FAILED` | Initialization failed |
| `PROCESSING_FAILED` | Processing failed |
| `DISPOSED` | Module has been disposed |

## Performance Tuning

### 1. Adjust Detection Frequency

```typescript
const faceModule = new FaceModule({
  // Reduce detection frequency for better performance
  detectionFrequency: 100, // ms
});
```

### 2. Reduce Detection Region

```typescript
const faceModule = new FaceModule({
  // Only detect center region of the frame
  detectionRegion: {
    x: 0.25,
    y: 0.25,
    width: 0.5,
    height: 0.5
  }
});
```

### 3. Use Web Worker

```typescript
// ID card recognition uses Web Worker, doesn't block main thread
const idCardModule = new IDCardModule({
  useWorker: true
});
```

### 4. Model Selection

```typescript
const faceModule = new FaceModule({
  // Use lightweight model
  modelType: 'tiny',
  // Or use full model (more accurate but slower)
  // modelType: 'full'
});
```

## Browser Compatibility

| Browser | Minimum Version | Support Status |
|---------|-----------------|----------------|
| Chrome | 80+ | ✅ Full Support |
| Firefox | 75+ | ✅ Full Support |
| Safari | 14+ | ✅ Full Support |
| Edge | 80+ | ✅ Full Support |
| iOS Safari | 14+ | ✅ Full Support |
| Android Chrome | 80+ | ✅ Full Support |

### Polyfill

To support older browsers, add the following polyfill:

```html
<script src="https://polyfill.io/v3/polyfill.min.js"></script>
```

## Project Structure

```
src/
├── core/              # Core functionality
│   ├── camera-manager.ts    # Camera management
│   ├── config.ts           # Configuration management
│   ├── logger.ts           # Logging system
│   └── loading-state.ts    # Loading state
├── modules/           # Feature modules
│   ├── face/         # Face module
│   ├── id-card/      # ID card module
│   └── qrcode/       # QR code module
├── utils/            # Utility functions
│   ├── retry.ts      # Retry mechanism
│   └── error-handler.ts # Error handling
└── types/            # Type definitions
```

## Contributing

Contributions are welcome! Please submit Issues and Pull Requests.

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/xxx`)
3. Commit your changes (`git commit -m 'Add xxx'`)
4. Push to the branch (`git push origin feature/xxx`)
5. Create a Pull Request

## License

MIT License

## Changelog

See [CHANGELOG](./CHANGELOG.md)
