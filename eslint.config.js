// @ts-check
import eslint from '@eslint/js';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: await import('@typescript-eslint/parser').then(m => m.default),
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        // Browser globals
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        Worker: 'readonly',
        URL: 'readonly',
        Blob: 'readonly',
        File: 'readonly',
        FormData: 'readonly',
        XMLHttpRequest: 'readonly',
        WebSocket: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        history: 'readonly',
        location: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        crypto: 'readonly',
        performance: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        
        // Canvas/DOM globals
        HTMLCanvasElement: 'readonly',
        HTMLImageElement: 'readonly',
        HTMLVideoElement: 'readonly',
        CanvasRenderingContext2D: 'readonly',
        ImageData: 'readonly',
        CanvasGradient: 'readonly',
        TextMetrics: 'readonly',
        
        // WebGL globals
        WebGLRenderingContext: 'readonly',
        WebGL2RenderingContext: 'readonly',
        WebGLProgram: 'readonly',
        WebGLShader: 'readonly',
        WebGLBuffer: 'readonly',
        WebGLFramebuffer: 'readonly',
        WebGLRenderbuffer: 'readonly',
        WebGLTexture: 'readonly',
        
        // Timer globals
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        
        // Promise
        Promise: 'readonly',
        Symbol: 'readonly',
        
        // Typed arrays
        ArrayBuffer: 'readonly',
        Uint8Array: 'readonly',
        Int8Array: 'readonly',
        Uint16Array: 'readonly',
        Int16Array: 'readonly',
        Uint32Array: 'readonly',
        Int32Array: 'readonly',
        Float32Array: 'readonly',
        Float64Array: 'readonly',
        DataView: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': await import('@typescript-eslint/eslint-plugin').then(m => m.default),
    },
    rules: {
      // Disable all rules
      ...eslint.configs.recommended.rules,
      // Then enable specific rules we want
      // Or just disable problematic ones
      '@typescript-eslint/preserve-caught-error': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/use-unknown-in-catch-variables': 'off',
      'no-console': 'off',
      'no-useless-escape': 'off',
      'prefer-const': 'off',
      'no-irregular-whitespace': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'no-useless-assignment': 'off',
    },
  },
  {
    files: ['**/*.js'],
    rules: {
      'no-console': 'off',
      'no-undef': 'off',
    },
  },
];
