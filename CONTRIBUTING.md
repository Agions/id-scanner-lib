/**
 * @file 贡献指南
 * @description 感谢你对 ID Scanner Lib 的兴趣!
 */

# 贡献指南

欢迎贡献 ID Scanner Lib! 本指南将帮助你开始。

## 开发环境设置

### 1. 克隆项目
```bash
git clone https://github.com/Agions/id-scanner-lib.git
cd id-scanner-lib
```

### 2. 安装依赖
```bash
npm install
```

### 3. 开发模式
```bash
npm run dev
```

### 4. 运行测试
```bash
npm test
```

### 5. 构建
```bash
npm run build
```

## 代码规范

### TypeScript
- 使用 TypeScript strict 模式
- 所有新代码必须类型安全
- 使用 JSDoc 注释

### 命名规范
- 类名: PascalCase
- 函数/变量: camelCase
- 常量: UPPER_SNAKE_CASE
- 接口: PascalCase (不带 I 前缀)

### 提交规范
使用 Conventional Commits:

```
feat: 添加新功能
fix: 修复 bug
docs: 文档更新
style: 代码格式
refactor: 代码重构
test: 测试
chore: 构建/工具
```

示例:
```
feat(face): 添加活体检测支持
fix(qrcode): 修复扫码超时问题
docs: 更新 README
```

## 项目结构

```
src/
├── core/              # 核心功能
│   ├── camera-manager.ts
│   ├── config.ts
│   ├── errors.ts
│   ├── logger.ts
│   └── ...
├── modules/           # 功能模块
│   ├── face/        # 人脸模块
│   ├── id-card/     # 身份证模块
│   └── qrcode/      # 二维码模块
├── utils/            # 工具函数
└── types/            # 类型定义
```

## 添加新功能

### 1. 创建模块
在 `src/modules/` 下创建新模块目录

### 2. 导出模块
在 `src/index.ts` 中导出

### 3. 添加测试
在对应模块目录添加 `*.test.ts`

### 4. 更新文档
更新 README.md 和相关文档

## 问题反馈

- GitHub Issues: 报告 bug 或请求功能
- GitHub Discussions: 讨论问题

## 许可证

MIT License - 贡献即表示同意 MIT 许可证
