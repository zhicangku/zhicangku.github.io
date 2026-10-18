# 知仓库

精选优质软件与资源分享站 → **https://zhicangku.github.io/**

纯静态单页站点,托管于 GitHub Pages,零依赖、免服务器、免数据库。

## 收录内容

设计创作 · 开发工具 · 效率办公 · 影音图像 · 传统文化 · 系统工具

## 特性

- 原生 HTML / CSS / JavaScript,无任何框架与外部依赖
- 数据驱动:全部资源集中在 [data.json](data.json),新增一条 JSON 即上新一个资源
- Windows / macOS 平台筛选,分类标签过滤,实时搜索
- 点击卡片弹窗展示网盘下载方式,支持单链接 / 双平台 / 多网盘三种格式
- 响应式布局,移动端可正常使用

## 如何新增资源

编辑 [data.json](data.json),向 `apps` 数组追加一条:

```json
{
  "name": "软件名称",
  "ver": "版本号",
  "os": ["win", "mac"],
  "cat": "design",
  "desc": "一句话简介",
  "tags": ["标签"],
  "dl": "https://下载链接"
}
```

`dl` 字段支持三种写法:

```json
"dl": "https://…"                                  // 单链接
"dl": { "win": "https://…", "mac": "https://…" }   // 双平台链接
"dl": [ { "name": "夸克网盘", "url": "https://…" } ] // 多网盘方式
```

无 `os` 字段的资源(如视频、教程类)在任意平台标签下均可见。

## 目录结构

```
├── index.html   页面结构
├── style.css    样式
├── main.js      渲染与筛选逻辑
├── data.json    资源数据(日常更新只改这个文件)
├── robots.txt   搜索引擎抓取规则
└── sitemap.xml  站点地图
```

## 部署

推送到 `main` 分支后,GitHub Pages 自动发布,约 1 分钟生效。
