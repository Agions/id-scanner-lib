#!/usr/bin/env node

/**
 * GitHub更新脚本
 * 自动提交代码并推送到GitHub
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 获取当前文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 执行命令并打印输出
function run(command) {
  console.log(`\n> ${command}\n`);
  execSync(command, { stdio: 'inherit' });
}

// 错误处理
function handleError(message) {
  console.error(`\n❌ ${message}`);
  process.exit(1);
}

// 主流程
async function main() {
  try {
    // 读取package.json获取版本
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
    const version = packageJson.version;
    console.log(`\n📦 准备更新 id-scanner-lib ${version} 到 GitHub\n`);

    // 检查Git状态
    console.log('🔍 检查Git状态...');
    run('git status');

    // 添加所有更改
    console.log('\n➕ 添加所有更改...');
    run('git add .');

    // 提交
    const commitMessage = `v${version}: 实现多种性能优化策略，提升处理速度和降低资源占用`;
    console.log(`\n📝 提交更改: "${commitMessage}"...`);
    run(`git commit -m "${commitMessage}"`);

    // 推送
    console.log('\n🚀 推送到GitHub...');
    run('git push');

    // 版本标签
    console.log(`\n🏷️ 创建版本标签 v${version}...`);
    run(`git tag v${version}`);
    run('git push --tags');

    console.log('\n✅ GitHub更新完成!');

  } catch (error) {
    handleError(`更新过程中出错: ${error.message}`);
  }
}

main(); 