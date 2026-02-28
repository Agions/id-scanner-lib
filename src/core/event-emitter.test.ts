/**
 * @file EventEmitter 测试
 * @description 测试事件发射器
 */

import { EventEmitter } from './event-emitter';

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  afterEach(() => {
    emitter.removeAllListeners();
  });

  it('should register and emit event', () => {
    let called = false;
    emitter.on('test', () => { called = true; });
    emitter.emit('test');
    expect(called).toBe(true);
  });

  it('should register one-time event', () => {
    let count = 0;
    emitter.once('test', () => { count++; });
    emitter.emit('test');
    emitter.emit('test');
    expect(count).toBe(1);
  });

  it('should remove listener', () => {
    let called = false;
    const fn = () => { called = true; };
    emitter.on('test', fn);
    emitter.off('test', fn);
    emitter.emit('test');
    expect(called).toBe(false);
  });
});
