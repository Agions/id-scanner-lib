# ID Scanner Lib 优化方案

## 优化进度

- [x] 构建问题修复
- [x] TypeScript 类型错误修复
- [x] 模型懒加载
- [x] 内存优化
- [x] 统一错误处理
- [x] 加载状态管理
- [x] 重试工具
- [x] 异步缓存
- [x] 信号量
- [x] 通用类型

---

## 新增 API

### 1. Retry 工具
```typescript
import { withRetry, createRetryable, AsyncCache, Semaphore } from 'id-scanner-lib';

// 带重试的函数调用
const result = await withRetry(async () => {
  return await riskyOperation();
}, { maxAttempts: 3, initialDelay: 1000 });

// 异步缓存
const cache = new AsyncCache<string>(5 * 60 * 1000); // 5分钟 TTL
const data = await cache.getOrSet('key', () => fetchData());

// 信号量 (控制并发)
const semaphore = new Semaphore(3); // 最多3个并发
await semaphore.acquire();
try {
  // 执行操作
} finally {
  semaphore.release();
}
```

### 2. 通用类型
```typescript
import { ModuleState, ImageSource, Rectangle, Point } from 'id-scanner-lib';
```

---

## 提交记录

```
d794105 feat: 添加重试工具和通用类型
0e14cde feat: 添加内存优化和加载状态管理
18459d8 feat: 优化构建和添加模型懒加载
```
