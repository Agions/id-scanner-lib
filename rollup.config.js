import typescript from "@rollup/plugin-typescript"
import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import terser from "@rollup/plugin-terser"
import json from "@rollup/plugin-json"

// 优化的terser配置，更激进地压缩代码
const terserOptions = {
  compress: {
    drop_console: true, // 移除console语句
    drop_debugger: true, // 移除debugger语句
    pure_funcs: ["console.log", "console.debug", "console.info"], // 移除指定的函数调用
    passes: 2, // 多次压缩，可以获得更好的压缩效果
    unsafe: true, // 启用"不安全"的压缩
    toplevel: true, // 在顶层作用域中删除未使用的变量和函数
  },
  mangle: {
    properties: {
      regex: /^_/, // 只混淆以下划线开头的私有属性
    },
  },
  format: {
    comments: false, // 删除所有注释
  },
}

// 基础配置
const baseConfig = {
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
      noEmitOnError: false, // 即使有错误也继续构建
      // 排除类型声明文件
      exclude: ["**/*.d.ts"],
    }),
    resolve({
      browser: true, // 针对浏览器优化
      preferBuiltins: false,
    }),
    commonjs(),
    json({
      // 仅包含必要的JSON数据
      compact: true,
    }),
  ],
}

// 导出多个配置
export default [
  // 核心包 - 不包含OCR功能的轻量版
  {
    ...baseConfig,
    input: "src/core.ts",
    output: [
      {
        file: "dist/id-scanner-core.js",
        format: "umd",
        name: "IDScannerCore",
        sourcemap: false, // 生产环境不需要sourcemap
      },
      {
        file: "dist/id-scanner-core.min.js",
        format: "umd",
        name: "IDScannerCore",
        plugins: [terser(terserOptions)],
        sourcemap: false,
      },
      {
        file: "dist/id-scanner-core.esm.js",
        format: "es",
        sourcemap: false,
      },
    ],
    // 优化chunking
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },

  // OCR模块
  {
    ...baseConfig,
    input: "src/ocr-module.ts",
    output: [
      {
        file: "dist/id-scanner-ocr.js",
        format: "umd",
        name: "IDScannerOCR",
        sourcemap: false,
        globals: {
          "tesseract.js": "Tesseract",
        },
      },
      {
        file: "dist/id-scanner-ocr.min.js",
        format: "umd",
        name: "IDScannerOCR",
        plugins: [terser(terserOptions)],
        sourcemap: false,
        globals: {
          "tesseract.js": "Tesseract",
        },
      },
      {
        file: "dist/id-scanner-ocr.esm.js",
        format: "es",
        sourcemap: false,
      },
    ],
    external: ["tesseract.js"],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },

  // 二维码扫描模块
  {
    ...baseConfig,
    input: "src/qr-module.ts",
    output: [
      {
        file: "dist/id-scanner-qr.js",
        format: "umd",
        name: "IDScannerQR",
        sourcemap: false,
        globals: {
          jsqr: "jsQR",
        },
      },
      {
        file: "dist/id-scanner-qr.min.js",
        format: "umd",
        name: "IDScannerQR",
        plugins: [terser(terserOptions)],
        sourcemap: false,
        globals: {
          jsqr: "jsQR",
        },
      },
      {
        file: "dist/id-scanner-qr.esm.js",
        format: "es",
        sourcemap: false,
      },
    ],
    external: ["jsqr"],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },

  // 只构建 UMD 版本，ESM 版本通过单独的命令生成
  {
    ...baseConfig,
    input: "src/index-umd.ts",
    output: [
      {
        file: "dist/id-scanner.js",
        format: "umd",
        name: "IDScanner",
        exports: "auto", // 自动处理导出
        sourcemap: false,
        globals: {
          jsqr: "jsQR",
          "tesseract.js": "Tesseract",
        },
        // 防止代码分割
        inlineDynamicImports: true,
      },
      {
        file: "dist/id-scanner.min.js",
        format: "umd",
        name: "IDScanner",
        exports: "auto", // 自动处理导出
        plugins: [terser(terserOptions)],
        sourcemap: false,
        globals: {
          jsqr: "jsQR",
          "tesseract.js": "Tesseract",
        },
        // 防止代码分割
        inlineDynamicImports: true,
      },
    ],
    external: ["jsqr", "tesseract.js"],
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
  },
]
