import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import * as path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const isDev = process.env.NODE_ENV !== 'production';

// Build configurations
const configs = [
  // UMD Build
  {
    input: 'src/index.ts',
    output: {
      name: 'IDScannerLib',
      file: pkg.main,
      format: 'umd',
      sourcemap: true,
      exports: 'named',
      globals: {
        '@tensorflow/tfjs': 'tf',
        '@vladmandic/face-api': 'faceapi',
        'jsqr': 'jsQR'
      }
    },
    external: [],
    plugins: [
      resolve({ browser: true, preferBuiltins: false }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: './dist/types'
      }),
      nodePolyfills(),
      !isDev && terser({
        compress: {
          drop_console: true,
          passes: 2
        }
      }),
      copy({
        targets: [
          { src: 'src/types/*.d.ts', dest: 'dist/types' }
        ]
      })
    ].filter(Boolean),
  },
  
  // ESM Build
  {
    input: 'src/index.ts',
    output: {
      file: pkg.module,
      format: 'es',
      sourcemap: true,
      exports: 'named'
    },
    external: ['@tensorflow/tfjs', '@vladmandic/face-api', 'jsqr'],
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      json(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false
      }),
      !isDev && terser({
        compress: {
          drop_console: true
        }
      })
    ].filter(Boolean),
  }
];

export default configs;
