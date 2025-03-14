import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

// 基础配置
const baseConfig = {
  plugins: [
    typescript({ 
      tsconfig: './tsconfig.json',
      noEmitOnError: false, // 即使有错误也继续构建
    }),
    resolve(),
    commonjs(),
    json()
  ]
};

// 导出多个配置
export default [
  // 核心包 - 不包含OCR功能的轻量版
  {
    ...baseConfig,
    input: 'src/core.ts',
    output: [
      {
        file: 'dist/id-scanner-core.js',
        format: 'umd',
        name: 'IDScannerCore',
        sourcemap: true
      },
      {
        file: 'dist/id-scanner-core.min.js',
        format: 'umd',
        name: 'IDScannerCore',
        plugins: [terser()],
        sourcemap: true
      },
      {
        file: 'dist/id-scanner-core.esm.js',
        format: 'es',
        sourcemap: true
      }
    ]
  },
  
  // OCR模块
  {
    ...baseConfig,
    input: 'src/ocr-module.ts',
    output: [
      {
        file: 'dist/id-scanner-ocr.js',
        format: 'umd',
        name: 'IDScannerOCR',
        sourcemap: true,
        globals: {
          'tesseract.js': 'Tesseract'
        }
      },
      {
        file: 'dist/id-scanner-ocr.min.js',
        format: 'umd',
        name: 'IDScannerOCR',
        plugins: [terser()],
        sourcemap: true,
        globals: {
          'tesseract.js': 'Tesseract'
        }
      },
      {
        file: 'dist/id-scanner-ocr.esm.js',
        format: 'es',
        sourcemap: true
      }
    ],
    external: ['tesseract.js']
  },
  
  // 二维码扫描模块
  {
    ...baseConfig,
    input: 'src/qr-module.ts',
    output: [
      {
        file: 'dist/id-scanner-qr.js',
        format: 'umd',
        name: 'IDScannerQR',
        sourcemap: true,
        globals: {
          'jsqr': 'jsQR'
        }
      },
      {
        file: 'dist/id-scanner-qr.min.js',
        format: 'umd',
        name: 'IDScannerQR',
        plugins: [terser()],
        sourcemap: true,
        globals: {
          'jsqr': 'jsQR'
        }
      },
      {
        file: 'dist/id-scanner-qr.esm.js',
        format: 'es',
        sourcemap: true
      }
    ],
    external: ['jsqr']
  },
  
  // 只构建 UMD 版本，ESM 版本通过单独的命令生成
  {
    ...baseConfig,
    input: 'src/index-umd.ts',
    output: [
      {
        file: 'dist/id-scanner.js',
        format: 'umd',
        name: 'IDScanner',
        sourcemap: true,
        globals: {
          'jsqr': 'jsQR',
          'tesseract.js': 'Tesseract'
        }
      },
      {
        file: 'dist/id-scanner.min.js',
        format: 'umd',
        name: 'IDScanner',
        plugins: [terser()],
        sourcemap: true,
        globals: {
          'jsqr': 'jsQR',
          'tesseract.js': 'Tesseract'
        }
      }
    ],
    external: ['jsqr', 'tesseract.js']
  }
]; 