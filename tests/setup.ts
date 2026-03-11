/**
 * ID Scanner Lib - 测试入口配置
 */

import '@testing-library/jest-dom';

// 全局测试配置
beforeAll(() => {
  // Mock fetch
  global.fetch = jest.fn();
  
  // Mock RequestAnimationFrame
  global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
  global.cancelAnimationFrame = jest.fn((id) => clearTimeout(id));
  
  // Mock WebGL
  global.WebGLRenderingContext = jest.fn();
  global.WebGL2RenderingContext = jest.fn();
});

// Mock canvas
HTMLCanvasElement.prototype.getContext = jest.fn();
HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock');
HTMLCanvasElement.prototype.toBlob = jest.fn();

// Mock media devices
Object.defineProperty(navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(),
    getDisplayMedia: jest.fn(),
  },
  writable: true,
});

// Mock window
Object.defineProperty(window, 'DeviceOrientationEvent', {
  value: {},
  writable: true,
});
