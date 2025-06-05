#!/usr/bin/env node

/**
 * @file ID Scanner 快速脚手架工具
 * @description 帮助开发者快速生成基本的扫描器配置和初始化代码
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// 创建交互式命令行界面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// 模板配置
const templates = {
  face: {
    filename: 'face-recognition.js',
    content: `import { IDScannerLib, FaceModule } from 'id-scanner-lib';

/**
 * 人脸识别初始化函数
 * @param {Object} options - 配置选项
 * @returns {Promise<FaceModule>} 人脸模块实例
 */
async function initializeFaceRecognition(options = {}) {
  // 初始化库
  await IDScannerLib.initialize({
    debug: options.debug || false
  });

  // 创建人脸模块
  const faceModule = new FaceModule({
    cameraOptions: options.cameraOptions || {
      facingMode: 'user',
      idealResolution: { width: 1280, height: 720 }
    },
    onFaceDetected: options.onFaceDetected || ((faces) => {
      console.log(\`检测到 \${faces.length} 个人脸\`);
    }),
    onError: options.onError || ((error) => {
      console.error('人脸识别错误:', error);
    })
  });

  // 初始化人脸模块
  await faceModule.initialize();
  console.log('人脸识别模块初始化成功');

  return faceModule;
}

/**
 * 启动人脸识别
 * @param {FaceModule} faceModule - 人脸模块实例
 * @param {HTMLVideoElement} videoElement - 视频元素
 */
async function startFaceRecognition(faceModule, videoElement) {
  try {
    await faceModule.startFaceRecognition(videoElement);
    console.log('人脸识别已启动');
  } catch (error) {
    console.error('启动人脸识别失败:', error);
  }
}

export { initializeFaceRecognition, startFaceRecognition };
`
  },
  qr: {
    filename: 'qr-scanner.js',
    content: `import { IDScannerLib } from 'id-scanner-lib';

/**
 * 二维码扫描初始化函数
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 二维码扫描器实例
 */
async function initializeQRScanner(options = {}) {
  // 初始化库
  await IDScannerLib.initialize({
    debug: options.debug || false
  });

  // 创建二维码扫描器
  const qrScanner = IDScannerLib.createQRScanner({
    scanFrequency: options.scanFrequency || 200,
    formats: options.formats || ['qrcode', 'code_128', 'code_39', 'ean_13'],
    minConfidence: options.minConfidence || 0.6
  });

  // 初始化扫描器
  await qrScanner.init();
  console.log('二维码扫描器初始化成功');

  return qrScanner;
}

/**
 * 启动实时扫描
 * @param {Object} qrScanner - 二维码扫描器实例
 * @param {HTMLVideoElement} videoElement - 视频元素
 * @param {Function} onResult - 结果回调函数
 */
async function startQRScanning(qrScanner, videoElement, onResult) {
  try {
    // 注册结果处理回调
    if (onResult) {
      qrScanner.on('module:realtime:result', onResult);
    }

    // 启动实时扫描
    await qrScanner.startRealtime(videoElement);
    console.log('二维码实时扫描已启动');
  } catch (error) {
    console.error('启动二维码扫描失败:', error);
  }
}

export { initializeQRScanner, startQRScanning };
`
  },
  combined: {
    filename: 'combined-scanner.js',
    content: `import { IDScannerLib, FaceModule, CameraManager } from 'id-scanner-lib';

/**
 * 组合扫描器初始化函数
 * @param {Object} options - 配置选项
 * @returns {Promise<Object>} 组合扫描器实例
 */
async function initializeCombinedScanner(options = {}) {
  // 初始化库
  await IDScannerLib.initialize({
    debug: options.debug || false
  });

  // 获取摄像头管理器
  const cameraManager = CameraManager.getInstance();

  // 创建人脸模块
  const faceModule = new FaceModule({
    onFaceDetected: options.onFaceDetected || ((faces) => {
      console.log(\`检测到 \${faces.length} 个人脸\`);
    }),
    onError: options.onFaceError || ((error) => {
      console.error('人脸识别错误:', error);
    })
  });

  // 初始化人脸模块
  await faceModule.initialize();

  // 创建二维码扫描器
  const qrScanner = IDScannerLib.createQRScanner({
    scanFrequency: options.scanFrequency || 200,
    formats: options.formats || ['qrcode']
  });

  // 初始化扫描器
  await qrScanner.init();

  // 返回组合对象
  return {
    cameraManager,
    faceModule,
    qrScanner,
    
    // 注册二维码结果处理回调
    onQRCodeResult(callback) {
      qrScanner.on('module:realtime:result', callback);
      return this;
    },
    
    // 启动摄像头
    async startCamera(videoElement, options = {}) {
      try {
        await cameraManager.init({
          facingMode: options.facingMode || 'user',
          idealResolution: options.idealResolution || { width: 1280, height: 720 }
        });
        
        cameraManager.setVideoElement(videoElement);
        await cameraManager.start();
        return this;
      } catch (error) {
        console.error('启动摄像头失败:', error);
        throw error;
      }
    },
    
    // 启动人脸检测
    async startFaceDetection(videoElement) {
      try {
        await faceModule.startFaceRecognition(videoElement);
        return this;
      } catch (error) {
        console.error('启动人脸检测失败:', error);
        throw error;
      }
    },
    
    // 启动二维码扫描
    async startQRScanning(videoElement) {
      try {
        await qrScanner.startRealtime(videoElement);
        return this;
      } catch (error) {
        console.error('启动二维码扫描失败:', error);
        throw error;
      }
    },
    
    // 启动所有功能
    async startAll(videoElement, cameraOptions = {}) {
      await this.startCamera(videoElement, cameraOptions);
      await this.startFaceDetection(videoElement);
      await this.startQRScanning(videoElement);
      return this;
    },
    
    // 停止所有功能
    stop() {
      faceModule.stop();
      qrScanner.stopRealtime();
      cameraManager.stop();
      return this;
    },
    
    // 释放资源
    async dispose() {
      await faceModule.terminate();
      await qrScanner.dispose();
    }
  };
}

export { initializeCombinedScanner };
`
  },
  html: {
    filename: 'scanner.html',
    content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ID Scanner 示例</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .video-container {
            position: relative;
            margin-bottom: 20px;
        }
        
        video {
            width: 100%;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
        
        canvas {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .controls {
            margin-bottom: 20px;
        }
        
        button {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        
        button:hover {
            background-color: #2980b9;
        }
        
        #result {
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border: 1px solid #ddd;
            min-height: 50px;
        }
    </style>
</head>
<body>
    <h1>ID Scanner 示例</h1>
    
    <div class="video-container">
        <video id="video" autoplay playsinline muted></video>
        <canvas id="canvas-overlay"></canvas>
    </div>
    
    <div class="controls">
        <button id="start-button">开始扫描</button>
        <button id="stop-button" disabled>停止扫描</button>
    </div>
    
    <div>
        <h3>扫描结果</h3>
        <pre id="result">等待扫描...</pre>
    </div>
    
    <!-- 加载库 -->
    <script src="../dist/id-scanner-lib.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', async () => {
            const videoEl = document.getElementById('video');
            const canvasEl = document.getElementById('canvas-overlay');
            const resultEl = document.getElementById('result');
            const startButton = document.getElementById('start-button');
            const stopButton = document.getElementById('stop-button');
            
            let scanner = null;
            
            // 开始扫描
            startButton.addEventListener('click', async () => {
                try {
                    resultEl.textContent = '正在初始化...';
                    
                    // 初始化扫描器
                    scanner = await IDScannerLib.IDScannerLib.initialize({
                        debug: true
                    });
                    
                    // 这里根据需要选择不同的扫描模块
                    // 例如，使用FaceModule或createQRScanner等
                    
                    // 请替换为您的实现
                    resultEl.textContent = '初始化成功，请替换此代码为您的实现';
                    
                    // 更新按钮状态
                    startButton.disabled = true;
                    stopButton.disabled = false;
                } catch (error) {
                    resultEl.textContent = '初始化失败: ' + error.message;
                    console.error('初始化错误:', error);
                }
            });
            
            // 停止扫描
            stopButton.addEventListener('click', () => {
                if (scanner) {
                    // 清理资源
                    // 例如: scanner.stop();
                    
                    resultEl.textContent = '扫描已停止';
                    
                    // 更新按钮状态
                    startButton.disabled = false;
                    stopButton.disabled = true;
                }
            });
        });
    </script>
</body>
</html>
`
  }
};

// 工具标识
console.log('\n=== ID Scanner 脚手架工具 ===\n');
console.log('这个工具将帮助您生成基本的扫描器代码模板。\n');

// 询问要生成的模板类型
function askTemplateType() {
  rl.question('请选择要生成的模板类型 (1: 人脸识别, 2: 二维码扫描, 3: 组合扫描器, 4: HTML示例): ', (answer) => {
    const type = parseInt(answer);
    
    if (isNaN(type) || type < 1 || type > 4) {
      console.log('无效的选择，请输入1-4之间的数字。');
      return askTemplateType();
    }
    
    let templateKey;
    switch (type) {
      case 1: templateKey = 'face'; break;
      case 2: templateKey = 'qr'; break;
      case 3: templateKey = 'combined'; break;
      case 4: templateKey = 'html'; break;
    }
    
    askOutputDir(templateKey);
  });
}

// 询问输出目录
function askOutputDir(templateKey) {
  rl.question('请输入要保存文件的目录路径 (默认为当前目录): ', (dirPath) => {
    const outputDir = dirPath.trim() || '.';
    
    // 检查目录是否存在
    if (!fs.existsSync(outputDir)) {
      console.log(`目录 "${outputDir}" 不存在，是否创建? (y/n): `);
      rl.question('', (answer) => {
        if (answer.toLowerCase() === 'y') {
          try {
            fs.mkdirSync(outputDir, { recursive: true });
            generateTemplate(templateKey, outputDir);
          } catch (error) {
            console.error(`创建目录失败: ${error.message}`);
            askOutputDir(templateKey);
          }
        } else {
          askOutputDir(templateKey);
        }
      });
    } else {
      generateTemplate(templateKey, outputDir);
    }
  });
}

// 生成模板文件
function generateTemplate(templateKey, outputDir) {
  const template = templates[templateKey];
  const outputPath = path.join(outputDir, template.filename);
  
  // 检查文件是否已存在
  if (fs.existsSync(outputPath)) {
    rl.question(`文件 "${outputPath}" 已存在，是否覆盖? (y/n): `, (answer) => {
      if (answer.toLowerCase() === 'y') {
        writeTemplateFile(template, outputPath);
      } else {
        console.log('操作已取消。');
        rl.close();
      }
    });
  } else {
    writeTemplateFile(template, outputPath);
  }
}

// 写入模板文件
function writeTemplateFile(template, outputPath) {
  try {
    fs.writeFileSync(outputPath, template.content);
    console.log(`\n✅ 文件已成功生成: ${outputPath}`);
    
    if (path.extname(outputPath) === '.js') {
      console.log('\n示例用法:');
      if (template.filename === 'face-recognition.js') {
        console.log(`
import { initializeFaceRecognition, startFaceRecognition } from './${template.filename}';

// 初始化
const faceModule = await initializeFaceRecognition({
  debug: true,
  onFaceDetected: (faces) => {
    console.log(\`检测到 \${faces.length} 个人脸\`);
  }
});

// 启动识别
const videoElement = document.getElementById('video');
await startFaceRecognition(faceModule, videoElement);
`);
      } else if (template.filename === 'qr-scanner.js') {
        console.log(`
import { initializeQRScanner, startQRScanning } from './${template.filename}';

// 初始化
const qrScanner = await initializeQRScanner({
  scanFrequency: 200,
  formats: ['qrcode']
});

// 启动扫描
const videoElement = document.getElementById('video');
await startQRScanning(qrScanner, videoElement, (event) => {
  console.log('扫描结果:', event.result.content);
});
`);
      } else if (template.filename === 'combined-scanner.js') {
        console.log(`
import { initializeCombinedScanner } from './${template.filename}';

// 初始化组合扫描器
const scanner = await initializeCombinedScanner({
  debug: true,
  onFaceDetected: (faces) => {
    console.log(\`检测到 \${faces.length} 个人脸\`);
  }
});

// 注册二维码结果处理
scanner.onQRCodeResult((event) => {
  console.log('扫描结果:', event.result.content);
});

// 启动所有功能
const videoElement = document.getElementById('video');
await scanner.startAll(videoElement, { facingMode: 'user' });

// 使用完后停止并释放资源
// scanner.stop();
// await scanner.dispose();
`);
      }
    } else {
      console.log('\n请在浏览器中打开生成的HTML文件来测试功能。');
    }
    
    // 询问是否生成更多模板
    rl.question('\n是否需要生成更多模板? (y/n): ', (answer) => {
      if (answer.toLowerCase() === 'y') {
        askTemplateType();
      } else {
        console.log('\n感谢使用 ID Scanner 脚手架工具！');
        rl.close();
      }
    });
  } catch (error) {
    console.error(`生成文件失败: ${error.message}`);
    rl.close();
  }
}

// 开始询问
askTemplateType(); 