#!/usr/bin/env node

/**
 * 包大小报告生成脚本
 * 用于生成各个包的大小信息，帮助分析和优化
 */

import fs from "fs"
import path from "path"
import picocolors from "picocolors"
import { fileURLToPath } from "url"

const { bold, green, red, cyan, yellow } = picocolors

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 定义要检查的文件
const FILES_TO_CHECK = [
  { name: "完整包", files: ["id-scanner.js", "id-scanner.min.js"] },
  { name: "核心包", files: ["id-scanner-core.js", "id-scanner-core.min.js"] },
  { name: "OCR模块", files: ["id-scanner-ocr.js", "id-scanner-ocr.min.js"] },
  { name: "QR模块", files: ["id-scanner-qr.js", "id-scanner-qr.min.js"] },
  {
    name: "ESM模块",
    files: [
      "id-scanner-core.esm.js",
      "id-scanner-ocr.esm.js",
      "id-scanner-qr.esm.js",
    ],
  },
]

// 检查目录是否存在
const distPath = path.resolve(__dirname, "../dist")
if (!fs.existsSync(distPath)) {
  console.error(red("错误: dist目录不存在。请先运行 npm run build:prod 命令。"))
  process.exit(1)
}

// 格式化文件大小
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB"
  return (bytes / (1024 * 1024)).toFixed(2) + " MB"
}

// 检查文件大小
function checkFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath)
    return stats.size
  } catch (e) {
    return -1
  }
}

// 输出表格头部
console.log(bold("\n包大小报告:\n"))
console.log(bold("模块名称\t文件名\t大小\t压缩率"))
console.log("-------------------------------------------------------")

// 检查每个文件并输出结果
FILES_TO_CHECK.forEach((group) => {
  console.log(bold(cyan(`\n${group.name}:`)))

  group.files.forEach((fileName) => {
    const filePath = path.join(distPath, fileName)
    const fileSize = checkFileSize(filePath)

    if (fileSize >= 0) {
      // 检查是否有min版本
      const isMin = fileName.includes(".min.")
      if (isMin) {
        // 找到对应的非压缩版本
        const originalName = fileName.replace(".min.", ".")
        const originalPath = path.join(distPath, originalName)
        const originalSize = checkFileSize(originalPath)

        if (originalSize > 0) {
          const ratio = (1 - fileSize / originalSize) * 100
          console.log(
            `  ${fileName}\t${formatSize(fileSize)}\t${ratio.toFixed(1)}% 压缩`
          )
        } else {
          console.log(`  ${fileName}\t${formatSize(fileSize)}`)
        }
      } else {
        console.log(`  ${fileName}\t${formatSize(fileSize)}`)
      }
    } else {
      console.log(`  ${fileName}\t${red("文件不存在")}`)
    }
  })
})

// 打印总体统计信息
console.log(bold("\n总计:"))
let totalSize = 0
let totalMinSize = 0

// 计算总体大小
FILES_TO_CHECK.forEach((group) => {
  group.files.forEach((fileName) => {
    const filePath = path.join(distPath, fileName)
    const fileSize = checkFileSize(filePath)

    if (fileSize >= 0) {
      if (fileName.includes(".min.")) {
        totalMinSize += fileSize
      } else {
        totalSize += fileSize
      }
    }
  })
})

console.log(`未压缩总大小: ${formatSize(totalSize)}`)
console.log(`压缩后总大小: ${formatSize(totalMinSize)}`)

if (totalSize > 0) {
  const overallRatio = (1 - totalMinSize / totalSize) * 100
  console.log(`总体压缩率: ${bold(green(overallRatio.toFixed(1) + "%"))}`)
}

console.log("\n提示: 使用 gzip 压缩后的实际网络传输大小会更小。")
console.log(
  yellow("优化建议: 考虑使用按需加载，只引入需要的模块以减小应用体积。")
)
