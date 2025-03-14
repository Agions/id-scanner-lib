#!/usr/bin/env node

/**
 * NPM发布脚本
 * 自动执行构建、版本检查和发布流程
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
    // 检查Git工作区是否干净
    try {
      const status = execSync('git status --porcelain').toString();
      if (status.trim() !== '') {
        handleError('Git工作区不干净，请先提交或暂存所有更改');
      }
    } catch (error) {
      console.warn('无法检查Git状态，可能不是Git仓库或git命令不可用');
    }

    // 读取package.json获取版本
    const packageJson = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
    const version = packageJson.version;
    console.log(`\n📦 准备发布 id-scanner-lib 版本 ${version}\n`);

    // 构建
    console.log('🔨 构建库...');
    run('npm run build');

    // 检查构建结果
    const distFiles = [
      'dist/id-scanner.min.js',
      'dist/id-scanner-core.min.js',
      'dist/id-scanner-ocr.min.js',
      'dist/id-scanner-qr.min.js'
    ];
    
    for (const file of distFiles) {
      if (!fs.existsSync(path.resolve(process.cwd(), file))) {
        handleError(`构建失败：找不到 ${file}`);
      }
    }
    console.log('✅ 构建成功');

    // 发布确认
    console.log('\n⚠️ 准备发布到NPM...');
    console.log('请确认以下信息:');
    console.log(`- 发布版本: ${version}`);
    console.log('- 已更新README.md');
    console.log('- 所有测试已通过');
    
    // 发布
    console.log('\n🚀 正在发布...');
    run('npm publish');
    console.log('✅ 发布成功!');

    // 创建Git标签
    try {
      console.log('\n🏷️ 创建Git标签...');
      run(`git tag v${version}`);
      run('git push --tags');
      console.log('✅ Git标签已创建并推送');
    } catch (error) {
      console.warn('无法创建Git标签，可能不是Git仓库或git命令不可用');
    }

  } catch (error) {
    handleError(`发布过程中出错: ${error.message}`);
  }
}

main(); 