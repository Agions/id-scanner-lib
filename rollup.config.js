import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import json from '@rollup/plugin-json';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';
import { dts as dtsGenerator } from 'rollup-plugin-dts';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import nodePolyfills from 'rollup-plugin-polyfill-node';
import copy from 'rollup-plugin-copy';
import * as path from 'path';

const pkg = require('./package.json');
const isDev = process.env.NODE_ENV !== 'production';

// 获取构建目标配置
const getBuildTargets = () => {
  // 设置基本构建
  const baseBuilds = [
    // Core & Face Module (UMD)
    {
      input: 'src/face-module.ts',
      output: {
        name: 'IDScannerLib',
        file: pkg.main,
        format: 'umd',
        sourcemap: true,
        exports: 'auto',
        globals: {
          '@tensorflow/tfjs': 'tf',
          '@vladmandic/face-api': 'faceapi',
          'jsqr': 'jsQR'
        }
      },
      external: [], // 在UMD构建中需要打包所有依赖
      plugins: [
        // 解析Node.js模块
        resolve({
          browser: true,
          preferBuiltins: false
        }),
        
        // 转换CommonJS模块
        commonjs(),
        
        // 支持JSON导入
        json(),
        
        // 处理TypeScript
        typescript({
          tsconfig: './tsconfig.json',
          declaration: true,
          declarationDir: './dist/types'
        }),
        
        // 提供Node.js模块的浏览器polyfill
        nodePolyfills(),
        
        // 非开发环境时压缩代码
        !isDev && terser()
      ].filter(Boolean),
    },
    
    // Core & Face Module (ESM)
    {
      input: 'src/face-module.ts',
      output: {
        file: pkg.module,
        format: 'es',
        sourcemap: true,
        exports: 'named'
      },
      external: [
        '@tensorflow/tfjs',
        '@vladmandic/face-api',
        'jsqr'
      ],
      plugins: [
        resolve({
          browser: true
        }),
        commonjs(),
        json(),
        typescript({
          tsconfig: './tsconfig.json',
          declaration: false
        }),
        !isDev && terser()
      ].filter(Boolean),
    },
    
    // 类型声明文件
    {
      input: './dist/types/face-module.d.ts',
      output: [{ file: 'dist/types/index.d.ts', format: 'es' }],
      plugins: [
        dts(),
        // 复制dist文件夹中的类型声明文件
        copy({
          targets: [
            { src: 'dist/types/face-module.d.ts', dest: 'dist/types/' }
          ]
        })
      ]
    }
  ];
  
  // 开发环境添加服务器配置
  if (isDev) {
    baseBuilds[0].plugins.push(
      serve({
        open: true,
        contentBase: ['dist', 'examples'],
        port: 3000
      }),
      livereload({
        watch: ['dist', 'examples']
      })
    );
  }
  
  return baseBuilds;
};

export default getBuildTargets();
