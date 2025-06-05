/**
 * @file 事件发射器
 * @description 提供基础的事件发射和订阅功能
 * @module core/event-emitter
 */

/**
 * 事件处理器类型
 */
type EventHandler = (data?: any) => void;

/**
 * 事件发射器基类
 * 提供基础的事件发射和订阅功能
 */
export class EventEmitter {
  /** 事件处理器映射 */
  private eventHandlers: Map<string, Set<EventHandler>> = new Map();
  
  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  on(eventName: string, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventName)) {
      this.eventHandlers.set(eventName, new Set());
    }
    
    this.eventHandlers.get(eventName)!.add(handler);
  }
  
  /**
   * 取消订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器，如果不提供则移除该事件的所有处理器
   */
  off(eventName: string, handler?: EventHandler): void {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    if (handler) {
      this.eventHandlers.get(eventName)!.delete(handler);
      
      // 如果没有处理器了，删除这个事件
      if (this.eventHandlers.get(eventName)!.size === 0) {
        this.eventHandlers.delete(eventName);
      }
    } else {
      // 移除该事件的所有处理器
      this.eventHandlers.delete(eventName);
    }
  }
  
  /**
   * 订阅事件，但只触发一次
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  once(eventName: string, handler: EventHandler): void {
    const onceHandler = (data?: any) => {
      handler(data);
      this.off(eventName, onceHandler);
    };
    
    this.on(eventName, onceHandler);
  }
  
  /**
   * 发射事件
   * @param eventName 事件名称
   * @param data 事件数据
   */
  emit(eventName: string, data?: any): void {
    if (!this.eventHandlers.has(eventName)) {
      return;
    }
    
    for (const handler of this.eventHandlers.get(eventName)!) {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${eventName}":`, error);
      }
    }
  }
  
  /**
   * 获取某个事件的处理器数量
   * @param eventName 事件名称
   */
  listenerCount(eventName: string): number {
    return this.eventHandlers.has(eventName) ? this.eventHandlers.get(eventName)!.size : 0;
  }
  
  /**
   * 移除所有事件处理器
   */
  removeAllListeners(): void {
    this.eventHandlers.clear();
  }
  
  /**
   * 获取所有事件名称
   */
  eventNames(): string[] {
    return Array.from(this.eventHandlers.keys());
  }
} 