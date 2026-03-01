import { defineConfig } from "vitepress"

// 多语言配置
const locales = {
  root: { label: "简体中文", lang: "zh-CN", link: "/" },
  en: { label: "English", lang: "en", link: "/en/" },
}

export default defineConfig({
  // 站点基本配置
  title: "ID-Scanner-Lib",
  description: "纯前端实现的TypeScript身份证与二维码识别库",
  base: "/id-scanner-lib/",
  lang: "zh-CN",
  lastUpdated: true,
  ignoreDeadLinks: true,

  // 多语言支持
  locales: {
    root: {
      label: "简体中文",
      lang: "zh-CN",
      link: "/",
    },
    en: {
      label: "English",
      lang: "en",
      link: "/en/",
    },
  },

  head: [
    ["link", { rel: "icon", href: "/assets/logo.svg" }],
    ["meta", { name: "theme-color", content: "#3C78D8" }],
    ["meta", { name: "description", content: "纯前端身份证与二维码识别库 - 高性能、模块化" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    ["meta", { name: "apple-mobile-web-app-status-bar-style", content: "black" }],
  ],

  // 主题配置
  themeConfig: {
    logo: "/assets/logo.svg",
    siteTitle: "ID-Scanner-Lib",

    // 版本切换
    version: "1.5.0",
    versions: [
      { label: "1.5.0", link: "/" },
      { label: "1.4.0", link: "/v1.4" },
      { label: "1.3.0", link: "/v1.3" },
    ],

    // GitHub 仓库
    socialLinks: [
      { icon: "github", link: "https://github.com/agions/id-scanner-lib" },
      { icon: "npm", link: "https://npmjs.com/package/id-scanner-lib" },
    ],

    // 搜索配置
    search: {
      provider: "local"
    },

    // 导航菜单
    nav: [
      { text: "指南", link: "/guide" },
      { text: "API参考", link: "/API" },
      { text: "示例", link: "/demos" },
      {
        text: "v1.5.0",
        items: [
          { text: "1.5.0 (当前)", link: "/" },
          { text: "1.4.0", link: "/v1.4" },
          { text: "1.3.0", link: "/v1.3" },
        ],
      },
      {
        text: "语言",
        items: [
          { text: "简体中文", link: "/" },
          { text: "English", link: "/en/" },
        ],
      },
    ],

    // 侧边栏
    sidebar: {
      "/": [
        {
          text: "开始使用",
          collapsed: false,
          items: [
            { text: "介绍", link: "/" },
            { text: "快速开始", link: "/guide" },
            { text: "安装", link: "/installation" },
          ],
        },
        {
          text: "核心功能",
          collapsed: false,
          items: [
            { text: "身份证识别", link: "/guide/idcard" },
            { text: "二维码扫描", link: "/guide/qrcode" },
            { text: "人脸识别", link: "/guide/face" },
          ],
        },
        {
          text: "API参考",
          collapsed: true,
          items: [
            { text: "API概览", link: "/API" },
            { text: "IDScanner", link: "/api/idscanner" },
            { text: "IDCardModule", link: "/api/idcard-module" },
            { text: "QRCodeModule", link: "/api/qrcode-module" },
            { text: "FaceModule", link: "/api/face-module" },
          ],
        },
        {
          text: "进阶指南",
          collapsed: true,
          items: [
            { text: "Web Workers", link: "/advanced/web-workers" },
            { text: "性能优化", link: "/advanced/performance" },
            { text: "自定义配置", link: "/advanced/configuration" },
          ],
        },
      ],
      "/en/": [
        {
          text: "Getting Started",
          collapsed: false,
          items: [
            { text: "Introduction", link: "/en/" },
            { text: "Quick Start", link: "/en/guide" },
            { text: "Installation", link: "/en/installation" },
          ],
        },
      ],
    },

    // 右侧大纲
    outline: {
      level: [2, 3],
      label: "目录",
    },

    // 社交链接
    footer: {
      message: "基于 MIT 许可发布",
      copyright: "Copyright © 2025-present Agions",
    },

    // 编辑链接
    editLink: {
      pattern: "https://github.com/agions/id-scanner-lib/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },

    // 演示链接
    demoLinks: [
      { text: "在线演示", link: "/demos", icon: "🚀" },
    ],
  },

  // Markdown 配置
  markdown: {
    lineNumbers: true,
    theme: {
      light: "github-light",
      dark: "github-dark",
    },
  },

  // Vite 配置
  vite: {
    server: {
      port: 5173,
    },
  },
})
