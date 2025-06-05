---
title: 贡献指南
description: 参与 ID-Scanner-Lib 开发的贡献指南
---

# 贡献指南

感谢您对 ID-Scanner-Lib 的关注！我们非常欢迎社区成员参与项目开发，无论是修复 bug、改进文档还是添加新功能。本指南将帮助您了解如何有效地参与项目贡献。

## 开发环境设置

### 前提条件

在开始之前，请确保您的系统已安装以下工具：

- Node.js (>= 14.0.0)
- npm (>= 6.0.0) 或 yarn (>= 1.22.0)
- Git

### 获取源码

1. Fork 项目仓库到您的 GitHub 账号

2. 克隆您的 Fork 到本地：

```bash
git clone https://github.com/YOUR_USERNAME/id-scanner-lib.git
cd id-scanner-lib
```

3. 添加上游仓库：

```bash
git remote add upstream https://github.com/original-owner/id-scanner-lib.git
```

### 安装依赖

```bash
npm install
# 或
yarn install
```

### 开发构建

启动开发服务器：

```bash
npm run dev
# 或
yarn dev
```

构建生产版本：

```bash
npm run build
# 或
yarn build
```

## 开发工作流

### 分支策略

我们采用以下分支命名规范：

- `main`: 主分支，包含最新的稳定版本
- `develop`: 开发分支，包含下一个版本的开发内容
- `feature/xxx`: 新功能分支
- `bugfix/xxx`: Bug 修复分支
- `docs/xxx`: 文档更新分支
- `refactor/xxx`: 代码重构分支

### 开发新功能或修复 Bug

1. 确保您的 `develop` 分支是最新的：

```bash
git checkout develop
git pull upstream develop
```

2. 创建新的功能分支：

```bash
git checkout -b feature/your-feature-name
# 或
git checkout -b bugfix/issue-number
```

3. 进行开发和测试

4. 提交您的更改：

```bash
git add .
git commit -m "feat: add new feature" # 遵循提交规范
```

5. 将您的分支推送到您的 Fork：

```bash
git push origin feature/your-feature-name
```

6. 创建 Pull Request 到上游仓库的 `develop` 分支

## 代码风格与规范

### 代码风格

我们使用 ESLint 和 Prettier 来保证代码质量和一致性。在提交代码前，请确保您的代码符合项目的代码风格规范：

```bash
npm run lint
# 或
yarn lint
```

自动修复代码风格问题：

```bash
npm run lint:fix
# 或
yarn lint:fix
```

### 提交规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范来格式化提交信息。每个提交消息应该包含类型、范围（可选）和描述：

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

常用的类型包括：

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码风格修改（不影响代码功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 添加或修改测试
- `build`: 构建系统或外部依赖的修改
- `ci`: CI 配置或脚本的修改
- `chore`: 其他不修改源代码或测试的修改

示例：

```
feat(qrcode): 添加多码同时扫描功能

实现了在同一图像中同时检测和解码多个二维码的功能。

Closes #123
```

## 测试指南

### 单元测试

为您的代码添加单元测试是确保代码质量的重要步骤。我们使用 Jest 作为测试框架：

```bash
npm run test
# 或
yarn test
```

运行特定测试：

```bash
npm run test -- -t "test name pattern"
```

### 集成测试

对于涉及多个模块交互的功能，请添加集成测试：

```bash
npm run test:integration
# 或
yarn test:integration
```

### 测试覆盖率

检查测试覆盖率：

```bash
npm run test:coverage
# 或
yarn test:coverage
```

我们的目标是保持至少 80% 的测试覆盖率。

## 文档贡献

### 更新文档

文档是项目的重要组成部分。如果您发现文档中的错误或想要改进文档，请按以下步骤操作：

1. 在 `docs` 目录中找到相应的 Markdown 文件
2. 进行必要的修改
3. 提交 Pull Request

### 文档预览

在本地预览文档：

```bash
npm run docs:dev
# 或
yarn docs:dev
```

构建文档：

```bash
npm run docs:build
# 或
yarn docs:build
```

## 发布流程

### 版本控制

我们使用 [Semantic Versioning](https://semver.org/) 进行版本控制：

- MAJOR 版本：当进行不兼容的 API 更改时
- MINOR 版本：当以向后兼容的方式添加功能时
- PATCH 版本：当进行向后兼容的 bug 修复时

### 发布步骤

1. 更新版本号：

```bash
npm version [major|minor|patch]
# 或
yarn version [major|minor|patch]
```

2. 生成更新日志：

```bash
npm run changelog
# 或
yarn changelog
```

3. 提交版本更新和更新日志：

```bash
git add .
git commit -m "chore(release): v1.2.3"
```

4. 创建标签：

```bash
git tag v1.2.3
```

5. 推送到远程仓库：

```bash
git push origin main --tags
```

6. 发布到 npm：

```bash
npm publish
# 或
yarn publish
```

## 问题报告与功能请求

### 报告 Bug

如果您发现了 Bug，请在 GitHub Issues 中创建一个新的 Issue，并提供以下信息：

- Bug 的简要描述
- 重现步骤
- 预期行为
- 实际行为
- 环境信息（浏览器、操作系统、设备等）
- 可能的解决方案（如果有）

### 功能请求

如果您希望添加新功能或改进现有功能，请在 GitHub Issues 中创建一个新的 Issue，并提供以下信息：

- 功能的简要描述
- 使用场景
- 预期行为
- 可能的实现方式（如果有）

## 代码审查

所有的 Pull Request 都需要通过代码审查才能被合并。在代码审查过程中，请注意以下几点：

- 及时响应审查意见
- 保持礼貌和尊重
- 解释您的设计决策
- 根据反馈进行必要的修改

## 社区行为准则

### 我们的承诺

为了营造一个开放和友好的环境，我们作为贡献者和维护者承诺：

- 尊重所有参与者，无论其经验水平、性别、性取向、残疾、种族、宗教或国籍
- 使用友好和包容的语言
- 尊重不同的观点和经验
- 优雅地接受建设性的批评
- 关注社区的最佳利益

### 不可接受的行为

不可接受的行为包括但不限于：

- 使用性化语言或图像
- 人身攻击或侮辱性评论
- 公开或私下骚扰
- 未经明确许可发布他人的私人信息
- 其他不道德或不专业的行为

### 执行

违反社区行为准则的实例可以通过联系项目团队进行报告。所有投诉将被审查和调查，并将导致被认为必要和适当的回应。

## 许可证

通过贡献代码，您同意您的贡献将根据项目的许可证进行许可。如果您对此有任何疑问，请联系项目维护者。

## 联系方式

如果您有任何问题或需要帮助，可以通过以下方式联系我们：

- GitHub Issues
- 电子邮件：support@id-scanner-lib.com
- 社区论坛：https://forum.id-scanner-lib.com

感谢您的贡献！
