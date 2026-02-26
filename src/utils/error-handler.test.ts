/**
 * @file 错误处理工具测试
 * @description 测试 ErrorHandler
 */

import { ErrorHandler, ErrorSeverity } from './error-handler';

describe('ErrorHandler', () => {
  // Mock Logger
  const mockLogger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };

  beforeAll(() => {
    // Replace logger with mock
    (ErrorHandler as any).logger = mockLogger;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle error with ERROR severity', () => {
    ErrorHandler.handle('TestModule', 'Test error', new Error('test error'));
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      'TestModule',
      'Test error',
      expect.any(Error)
    );
  });

  it('should handle error with WARN severity', () => {
    ErrorHandler.handle('TestModule', 'Warning message', null, ErrorSeverity.WARN);
    
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'TestModule',
      'Warning message',
      undefined
    );
  });

  it('should handle error with INFO severity', () => {
    ErrorHandler.handle('TestModule', 'Info message', null, ErrorSeverity.INFO);
    
    expect(mockLogger.info).toHaveBeenCalledWith(
      'TestModule',
      'Info message',
      undefined
    );
  });

  it('should handle error with DEBUG severity', () => {
    ErrorHandler.handle('TestModule', 'Debug message', null, ErrorSeverity.DEBUG);
    
    expect(mockLogger.debug).toHaveBeenCalledWith(
      'TestModule',
      'Debug message',
      undefined
    );
  });

  it('should convert string error to Error object', () => {
    ErrorHandler.handle('TestModule', 'Test error', 'string error');
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      'TestModule',
      'Test error',
      expect.any(Error)
    );
  });

  it('should convert unknown error to Error object', () => {
    ErrorHandler.handle('TestModule', 'Test error', { code: 123 });
    
    expect(mockLogger.error).toHaveBeenCalledWith(
      'TestModule',
      'Test error',
      expect.any(Error)
    );
  });

  describe('asyncHandler', () => {
    it('should create error handler function', () => {
      const handler = ErrorHandler.asyncHandler('TestModule', 'Operation failed');
      
      handler(new Error('test'));
      
      expect(mockLogger.error).toHaveBeenCalledWith(
        'TestModule',
        'Operation failed',
        expect.any(Error)
      );
    });
  });

  describe('safeExecute', () => {
    it('should return result on success', async () => {
      const fn = async () => 'success';
      const result = await ErrorHandler.safeExecute(fn, 'TestModule', 'fallback');
      
      expect(result).toBe('success');
    });

    it('should return fallback on error', async () => {
      const fn = async () => {
        throw new Error('error');
      };
      const result = await ErrorHandler.safeExecute(fn, 'TestModule', 'fallback');
      
      expect(result).toBe('fallback');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('safeExecuteSync', () => {
    it('should return result on success', () => {
      const fn = () => 'success';
      const result = ErrorHandler.safeExecuteSync(fn, 'TestModule', 'fallback');
      
      expect(result).toBe('success');
    });

    it('should return fallback on error', () => {
      const fn = () => {
        throw new Error('error');
      };
      const result = ErrorHandler.safeExecuteSync(fn, 'TestModule', 'fallback');
      
      expect(result).toBe('fallback');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
