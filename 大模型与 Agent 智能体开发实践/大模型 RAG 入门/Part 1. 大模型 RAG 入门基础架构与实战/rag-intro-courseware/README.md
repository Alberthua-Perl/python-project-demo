# 大模型 RAG 检索增强生成 · 入门基础架构介绍 - HTML 交互课件

> 从 LLM 局限性出发，系统讲解 RAG 核心思想、六大组件架构、Embedding 原理与完整检索生成流程。

## 🎯 项目概述

这是一个纯前端的交互式课件，旨在帮助学员：
1. 理解大模型的局限性与 RAG 的核心价值。
2. 掌握 RAG 六大组件（文档加载、文本分割、Embedding、向量存储、检索器、LLM 生成）。
3. 深入理解 Embedding 原理、余弦相似度与 FAISS 索引机制。
4. 通过交互模拟器体验完整 RAG Pipeline。

## 🚀 快速启动

本项目为纯静态 HTML/JS，无需编译。

### 方法 1: Python 服务器 (推荐)
```bash
cd rag-intro-courseware
python -m http.server 8003
# 访问 http://localhost:8003
```

### 方法 2: VS Code Live Server
1. 安装 Live Server 插件。
2. 右键 `index.html` -> "Open with Live Server"。

## 📁 目录结构

```
rag-intro-courseware/
├── index.html          # 主入口 (幻灯片路由 + 星空背景)
├── css/
│   └── main.css        # 全局样式 (星空主题 + 响应式布局)
├── js/
│   ├── main.js         # 核心导航逻辑 (翻页/进度/菜单)
│   └── interactive.js  # 交互组件逻辑 (动画/模拟器)
└── slides/             # 44 张幻灯片页面 (HTML 片段)
    ├── S001-cover.html
    ├── S002-overview.html
    ├── ...
    └── S044-token-budget.html
```

## 🛠️ 设计约束 (贡献者必读)

为了保证演示质量，所有页面必须遵守：
1. **居中对齐**：使用 `.slide` 类的默认 Flexbox 居中。
2. **80% 填充限制**：内容不应贴边，留有足够呼吸感。
3. **无滚动条**：内容必须适配视口高度 (`100vh`)，溢出会被裁剪。
4. **响应式字体**：使用 `clamp()` 确保在不同分辨率下可读。

## 🧩 交互组件清单

- [S007] RAG 核心思想步进动画
- [S008] RAG 三步流程动画
- [S014] 数据流向动画
- [S015] 六大组件交互展示
- [S030] 余弦相似度可视化
- [S036] 完整 Pipeline 流程动画
- [S037] RAG 检索模拟器
- [S044] Token 预算计算器

## ⌨️ 快捷键

| 按键 | 功能 |
|------|------|
| `←` `→` | 前后翻页 |
| `F` | 全屏切换 |
| `M` | 课程目录菜单 |
| `T` | 钢笔拖尾效果 |
