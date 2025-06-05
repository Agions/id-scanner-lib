import { defineConfig } from "vitepress"

export default defineConfig({
  // 站点基本配置
  title: "ID-Scanner-Lib",
  description: "纯前端实现的TypeScript身份证与二维码识别库",
  base: "/id-scanner-lib/",
  lang: "zh-CN",
  lastUpdated: true,
  ignoreDeadLinks: true,

  head: [
    ["link", { rel: "icon", href: "/assets/logo.svg" }],
    ["meta", { name: "theme-color", content: "#3eaf7c" }],
    ["meta", { name: "apple-mobile-web-app-capable", content: "yes" }],
    [
      "meta",
      { name: "apple-mobile-web-app-status-bar-style", content: "black" },
    ],
  ],

  // 主题配置
  themeConfig: {
    logo: "/assets/logo.svg",
    siteTitle: "ID-Scanner-Lib",

    // GitHub 仓库
    socialLinks: [
      { icon: "github", link: "https://github.com/agions/id-scanner-lib" },
    ],

    // 导航菜单
    nav: [
      { text: "指南", link: "/guide" },
      { text: "API参考", link: "/API" },
      {
        text: "演示",
        items: [
          { text: "身份证识别", link: "/demos/idcard" },
          { text: "二维码扫描", link: "/demos/qrcode" },
          { text: "人脸识别", link: "/demos/face" },
        ],
      },
      {
        text: "进阶功能",
        items: [
          { text: "Web Workers", link: "/advanced/web-workers" },
          { text: "性能优化", link: "/advanced/performance" },
          { text: "自定义配置", link: "/advanced/configuration" },
        ],
      },
    ],

    // 侧边栏
    sidebar: {
      "/": [
        {
          text: "开始",
          items: [
            { text: "介绍", link: "/" },
            { text: "快速开始", link: "/guide" },
            { text: "安装", link: "/installation" },
          ],
        },
        {
          text: "指南",
          items: [
            { text: "身份证识别", link: "/guide/idcard" },
            { text: "二维码扫描", link: "/guide/qrcode" },
            { text: "错误处理", link: "/guide/error-handling" },
          ],
        },
        {
          text: "API参考",
          items: [
            { text: "API概览", link: "/API" },
            { text: "IDScanner", link: "/api/idscanner" },
            { text: "IDCardModule", link: "/api/idcard-module" },
            { text: "QRCodeModule", link: "/api/qrcode-module" },
            { text: "FaceModule", link: "/api/face-module" },
            { text: "配置选项", link: "/api/configuration" },
          ],
        },
        {
          text: "进阶使用",
          items: [
            { text: "Web Workers", link: "/advanced/web-workers" },
            { text: "性能优化", link: "/advanced/performance" },
            { text: "自定义配置", link: "/advanced/configuration" },
          ],
        },
      ],
    },

    // 搜索配置
    search: {
      provider: "local",
    },

    // 页脚配置
    footer: {
      message: "基于 MIT 许可发布",
      copyright: "Copyright © 2025-present Agions",
    },

    // 编辑链接
    editLink: {
      pattern: "https://github.com/agions/id-scanner-lib/edit/main/docs/:path",
      text: "在 GitHub 上编辑此页",
    },
  },
})
