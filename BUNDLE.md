# Bundle Analysis

## Bundle Size

| Bundle | Size | Gzipped |
|--------|------|---------|
| id-scanner-lib.js | ~500KB | ~150KB |
| id-scanner-lib.esm.js | ~450KB | ~140KB |

## Dependencies

### Runtime Dependencies
- `@tensorflow/tfjs` - TensorFlow.js (~400KB)
- `@vladmandic/face-api` - Face API (~300KB)
- `jsQR` - QR code scanner (~50KB)

### Optional Dependencies
- `browser-image-compression` - Image compression
- `tesseract.js` - OCR (lazy loaded)

## Optimization Tips

### 1. Tree Shaking
The library supports tree shaking. Import only what you need:

```typescript
// Instead of importing everything
import { IDScanner } from 'id-scanner-lib';

// Import specific modules
import { FaceModule } from 'id-scanner-lib/modules/face';
import { QRCodeScanner } from 'id-scanner-lib/modules/qrcode';
```

### 2. Lazy Loading Models
Only load models when needed:

```typescript
const faceModule = new FaceModule({
  // Disable features you don't need
  extractEmbeddings: false,
  detectExpressions: false,
  detectAgeGender: false
});
```

### 3. Use ESM Bundle
The ESM bundle has better tree shaking support:

```html
<script type="module">
  import { FaceModule } from 'https://cdn.jsdelivr.net/npm/id-scanner-lib/dist/id-scanner-lib.esm.js';
</script>
```

## Bundle Analysis Commands

```bash
# Install bundle analyzer
npm install --save-dev rollup-plugin-analyzer

# Run with analysis
npm run build -- --config rollup.analyzer.config.js
```
