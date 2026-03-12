# RAG Code Search v2.0 — 项目架构全解析

## 项目概述

RAG Code Search 是一个全栈智能代码库检索与问答系统。用户可以添加本地代码仓库或上传 ZIP 压缩包，系统自动对代码进行分块（Chunking）和向量化（Embedding），然后通过语义搜索 + RAG（检索增强生成）实现对代码库的自然语言问答。

**核心价值**：用自然语言提问，获得精确到文件路径和行号的代码解答。

---

## 技术栈总览

| 层级 | 技术 | 说明 |
|------|------|------|
| 后端框架 | FastAPI + Uvicorn | Python 异步 Web 框架 |
| LLM 集成 | OpenAI Python SDK | 兼容任意 OpenAI 格式 API（DeepSeek、vLLM 等） |
| 向量数据库 | ChromaDB | 持久化向量存储，余弦相似度检索 |
| 流式传输 | sse-starlette | Server-Sent Events 实现流式响应 |
| 前端框架 | React 18 + TypeScript | SPA 单页应用 |
| 构建工具 | Vite | 开发热更新 + 生产构建 |
| 样式方案 | Tailwind CSS | 原子化 CSS + 暗色模式 |
| UI 组件 | Radix UI + lucide-react | 无障碍组件库 + 图标 |
| Markdown | react-markdown + prism-react-renderer | 代码高亮渲染 |
| 路由 | react-router-dom | 前端路由 |

---

## 目录结构

```
rag-code-search/
├── backend/                        # ===== Python 后端 =====
│   ├── app/
│   │   ├── main.py                # FastAPI 应用入口，注册路由 & CORS
│   │   ├── api/                   # API 路由层（Controller）
│   │   │   ├── chat.py            # 聊天 & 会话管理接口
│   │   │   ├── chunks.py          # 代码块浏览接口
│   │   │   ├── repos.py           # 仓库管理接口
│   │   │   ├── search.py          # 向量搜索接口
│   │   │   └── settings.py        # 系统配置接口
│   │   ├── services/              # 业务逻辑层（Service）
│   │   │   ├── chat_service.py    # 会话管理 + RAG 流式问答
│   │   │   ├── index_service.py   # 代码分块 + ChromaDB 索引
│   │   │   ├── llm_client.py      # LLM & Embedding 客户端
│   │   │   ├── repo_service.py    # 仓库 CRUD + 文件扫描
│   │   │   └── search_service.py  # 向量相似度检索
│   │   └── config/                # 配置管理
│   │       ├── defaults.py        # 默认配置项定义
│   │       └── manager.py         # 配置持久化（JSON 读写）
│   ├── data/                      # 持久化数据目录
│   │   ├── settings.json          # 用户配置（API Key、模型、参数）
│   │   ├── repos.json             # 仓库元数据
│   │   ├── sessions.json          # 聊天会话历史
│   │   ├── {repo_id}_chunks.json  # 各仓库的代码块数据
│   │   ├── chroma/                # ChromaDB 向量存储
│   │   └── uploads/               # 上传的 ZIP 解压目录
│   ├── requirements.txt           # Python 依赖清单
│   └── .venv/                     # Python 虚拟环境
│
├── frontend/                       # ===== React 前端 =====
│   ├── src/
│   │   ├── main.tsx               # React 入口，挂载根组件
│   │   ├── App.tsx                # 主应用：路由 + 导航栏 + 主题切换
│   │   ├── index.css              # Tailwind 配置 + 暗色模式 CSS 变量
│   │   ├── pages/                 # 页面组件
│   │   │   ├── ChatPage.tsx       # 💬 主聊天界面（含 RAG 抽屉）
│   │   │   ├── RepoManager.tsx    # 📦 仓库管理（添加/删除/索引）
│   │   │   ├── ChunksExplorer.tsx # 🔍 代码块浏览器
│   │   │   ├── SearchPlayground.tsx # 🧪 向量搜索测试台
│   │   │   └── SettingsPage.tsx   # ⚙️ 系统配置页
│   │   ├── components/            # 可复用组件
│   │   │   ├── MarkdownMessage.tsx # Markdown 渲染（代码高亮 + 折叠）
│   │   │   ├── RagDrawer.tsx      # RAG 过程可视化抽屉
│   │   │   └── RagPanel.tsx       # RAG 面板（旧版，保留兼容）
│   │   ├── services/
│   │   │   └── api.ts             # HTTP 客户端（封装所有后端 API 调用）
│   │   ├── types/
│   │   │   └── index.ts           # TypeScript 类型定义
│   │   └── lib/
│   │       └── utils.ts           # 工具函数（className 合并）
│   ├── public/
│   │   └── logo.png               # 应用 Logo
│   ├── index.html                 # HTML 入口
│   ├── package.json               # Node 依赖 & 脚本
│   ├── vite.config.ts             # Vite 配置（含 API 代理）
│   ├── tailwind.config.js         # Tailwind 配置
│   ├── tsconfig.json              # TypeScript 配置
│   └── postcss.config.js          # PostCSS 配置
│
├── scripts/                        # ===== 启动脚本 =====
│   ├── start-macos-linux.sh       # macOS/Linux 一键启动
│   └── start-windows.bat          # Windows 一键启动
│
├── docs/                           # ===== 文档 =====
│   └── plans/                     # 设计文档 & 实现计划
│
└── README.md                       # 项目说明文档
```

---

## 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)               │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────┐ ┌─────┐ │
│  │ ChatPage │ │RepoMgr   │ │Chunks  │ │Search│ │Sett-│ │
│  │ +RagDraw │ │          │ │Explorer│ │Playgr│ │ings │ │
│  └────┬─────┘ └────┬─────┘ └───┬────┘ └──┬───┘ └──┬──┘ │
│       └─────────────┴───────────┴─────────┴────────┘    │
│                         api.ts (HTTP Client)             │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP / SSE (port 5173 → proxy → 8000)
┌─────────────────────────▼───────────────────────────────┐
│                   Backend (FastAPI)                       │
│  ┌─────────────────── API Layer ───────────────────────┐ │
│  │ chat.py │ repos.py │ chunks.py │ search.py │ settings│ │
│  └────┬────┴────┬─────┴─────┬─────┴─────┬─────┴───┬───┘ │
│  ┌────▼────┐┌───▼────┐┌────▼─────┐┌────▼────┐┌───▼───┐ │
│  │chat_svc ││repo_svc││index_svc ││search   ││config │ │
│  │         ││        ││          ││_service ││manager│ │
│  └────┬────┘└───┬────┘└────┬─────┘└────┬────┘└───┬───┘ │
│       │         │          │           │         │      │
│  ┌────▼─────────▼──────────▼───────────▼─────────▼───┐  │
│  │              llm_client.py (OpenAI SDK)            │  │
│  └───────────────────────┬───────────────────────────┘  │
└──────────────────────────┼──────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ ChromaDB │ │ JSON文件  │ │ LLM API  │
        │ (向量库)  │ │ (持久化)  │ │ (远程)   │
        └──────────┘ └──────────┘ └──────────┘
```

---

## 后端文件详解

### `app/main.py` — 应用入口

FastAPI 应用的初始化文件，职责：
- 创建 FastAPI 实例，配置标题和版本号
- 注册 CORS 中间件（允许前端跨域访问）
- 挂载所有 API 路由（chat、repos、chunks、search、settings）
- 提供 `/api/health` 健康检查端点

### `app/api/` — API 路由层

每个文件对应一组 RESTful 端点，只负责参数校验和调用 Service 层：

| 文件 | 路由前缀 | 核心端点 |
|------|----------|----------|
| `repos.py` | `/api/repos` | 添加仓库（本地路径/ZIP上传）、列表、删除、触发索引、查询索引状态 |
| `chunks.py` | `/api/repos/{id}/chunks` | 获取代码块列表、单个代码块上下文（含完整文件内容）、索引统计 |
| `search.py` | `/api/search` | 向量相似度搜索（接收 query + repo_id + top_k） |
| `chat.py` | `/api/chat` | SSE 流式 RAG 问答、Prompt 预览、会话 CRUD |
| `settings.py` | `/api/settings` | 获取/更新系统配置（API Key 脱敏返回） |

### `app/services/` — 业务逻辑层

#### `llm_client.py` — LLM & Embedding 客户端

系统与大模型交互的唯一出口：
- `get_llm_client()` / `get_async_llm_client()` — 创建 OpenAI 兼容客户端（支持自定义 base_url）
- `embed_texts(texts)` — 批量文本向量化
- `embed_query(query)` — 单条查询向量化
- `stream_chat(messages, model)` — 异步流式对话补全

关键设计：通过配置 `base_url` 和 `api_key`，可无缝切换 OpenAI / DeepSeek / 本地 vLLM 等任意兼容 API。

#### `repo_service.py` — 仓库管理服务

- `add_repo(name, path)` — 注册本地仓库路径
- `add_repo_from_upload(file)` — 接收 ZIP 上传，解压到 `data/uploads/`
- `list_repos()` / `get_repo()` / `delete_repo()` — 仓库 CRUD
- `scan_files(path)` — 递归扫描 `.py` 文件，自动跳过 `.venv`、`node_modules`、`__pycache__` 等目录

#### `index_service.py` — 代码索引服务

核心索引管线：
1. 调用 `repo_service.scan_files()` 获取所有 Python 文件
2. 逐文件读取内容，调用 `chunk_text()` 按字符数分块（默认 1000 字符），对齐到行边界
3. 每 50 个块为一批，调用 `llm_client.embed_texts()` 生成向量
4. 写入 ChromaDB（collection 名为 `repo_{repo_id}`，余弦距离）
5. 同时保存块元数据到 `{repo_id}_chunks.json`

其他功能：
- `get_chunks()` — 获取仓库所有代码块
- `get_chunk_context()` — 获取某个块在原文件中的上下文（含完整文件内容 + 高亮行号）
- `get_stats()` — 返回索引统计（块数、文件数、Embedding 维度）

#### `search_service.py` — 向量检索服务

执行语义搜索的核心逻辑：
1. 调用 `llm_client.embed_query()` 将用户查询向量化
2. 在 ChromaDB 对应仓库的 collection 中执行 cosine 距离查询
3. 将距离转换为相似度分数：`score = max(0, 1 - distance)`
4. 返回 top-k 结果，每条包含：chunk_id、content、file_path、line_start/end、score

#### `chat_service.py` — 聊天会话服务

RAG 问答的完整管线，通过 SSE 分阶段推送事件：

| 阶段 | SSE 事件类型 | 内容 |
|------|-------------|------|
| 1. 检索 | `retrieval` | 调用 search_service 获取 top-k 相关代码块 |
| 2. 构建 Prompt | `prompt` | 组装 system_prompt + 检索上下文 + 历史消息 + 用户问题 |
| 3. 流式生成 | `chunk` | 逐 token 推送 LLM 响应 |
| 4. 完成 | `done` | 将完整消息（含 RAG 元数据）持久化到 session |

其他功能：
- `create_session()` / `get_session()` / `delete_session()` — 会话 CRUD
- `build_prompt()` — Prompt 构建（system + context + history + user）
- `estimate_tokens()` — 粗略 token 估算（1 token ≈ 4 字符）

### `app/config/` — 配置管理

#### `defaults.py` — 默认配置

```python
{
    "llm_api_key": "",
    "llm_base_url": "https://api.openai.com/v1",
    "llm_model": "gpt-4o",
    "embedding_api_key": "",
    "embedding_base_url": "https://api.openai.com/v1",
    "embedding_model": "text-embedding-3-small",
    "chunk_size": 1000,        # 分块字符数
    "chunk_overlap": 200,      # 块间重叠字符数
    "top_k": 5,                # 检索返回数量
    "system_prompt": "你是一个代码库智能助手..."
}
```

#### `manager.py` — 配置持久化

- `get_settings()` — 从 `data/settings.json` 加载配置，不存在则返回默认值
- `update_settings()` — 合并更新并写入 JSON 文件

---

## 前端文件详解

### `App.tsx` — 主应用框架

- 路由配置：`/repos`、`/chunks`、`/search`、`/chat`、`/settings`
- 导航栏：聊天页使用图标导航栏（节省空间），其他页面使用完整侧边栏
- 主题切换：亮色/暗色模式，状态持久化到 localStorage

### `pages/ChatPage.tsx` — 聊天主界面

项目最核心的页面，功能包括：
- 左侧会话列表：创建/切换/删除会话
- 中间消息区：Markdown 渲染 + 自动滚动 + 流式显示
- 右侧 RAG 抽屉：点击消息可查看该轮对话的检索过程
- 输入区：自适应高度文本框 + 仓库选择器
- 流式接收：通过 SSE 逐 token 接收并渲染 LLM 响应

### `pages/RepoManager.tsx` — 仓库管理页

- 两种添加方式：输入本地路径 / 上传 ZIP 文件
- 状态徽章：`pending` → `indexing` → `indexed` / `error`
- 索引进度轮询（1.5 秒间隔）
- 显示文件数和代码块数

### `pages/ChunksExplorer.tsx` — 代码块浏览器

- 选择仓库后展示所有代码块
- 支持按文件路径或内容关键词过滤
- 显示统计信息：总块数、文件数、Embedding 维度
- 点击代码块可查看其在原文件中的完整上下文（高亮对应行）

### `pages/SearchPlayground.tsx` — 搜索测试台

- 输入查询语句，设置 top-k 参数
- 展示搜索结果及相似度分数
- Prompt 预览：查看实际发送给 LLM 的完整 Prompt
- 点击结果可跳转到代码块在文件中的位置

### `pages/SettingsPage.tsx` — 系统配置页

- LLM 配置：API Key、Base URL、模型名称
- Embedding 配置：API Key、Base URL、模型名称
- RAG 参数：chunk_size、chunk_overlap、top_k
- System Prompt 编辑器
- 保存状态反馈（saving → saved）

### `components/MarkdownMessage.tsx` — Markdown 渲染器

- 使用 react-markdown + remark-gfm 渲染 GitHub 风格 Markdown
- Prism 代码高亮，支持亮色/暗色主题
- 超过 20 行的代码块自动折叠
- 代码块右上角复制按钮

### `components/RagDrawer.tsx` — RAG 过程可视化抽屉

固定在右侧的 340px 宽抽屉，包含三个 Tab：
- **检索结果**：展示 top-k 代码块，含相似度分数和内容预览（可展开）
- **Prompt 预览**：完整展示 system prompt、检索上下文、历史消息、用户问题
- **Token 估算**：显示本轮对话的粗略 token 消耗

### `services/api.ts` — HTTP 客户端

封装所有后端 API 调用：
- 基础 URL：`/api`（开发环境通过 Vite 代理到 `localhost:8000`）
- 统一错误处理：提取响应中的 `detail` 字段
- `chatStream()` 使用 `fetch` + `ReadableStream` 处理 SSE 流

### `types/index.ts` — TypeScript 类型定义

定义所有数据结构的接口：`Repo`、`Chunk`、`SearchResult`、`Session`、`Message`、`RagData`、`Settings` 等。

---

## 核心数据流

### 1. 仓库索引流程

```
用户添加仓库 → POST /api/repos
                    ↓
          repo_service.add_repo() → 写入 repos.json
                    ↓
用户点击"开始索引" → POST /api/repos/{id}/index（后台任务）
                    ↓
          index_service.index_repo()
              ├─ scan_files() → 扫描所有 .py 文件
              ├─ chunk_text() → 按字符数分块，对齐行边界
              ├─ embed_texts() → 批量向量化（每批 50 个）
              ├─ ChromaDB.add() → 存入向量数据库
              └─ 保存 {repo_id}_chunks.json
                    ↓
          仓库状态更新为 "indexed"
```

### 2. RAG 问答流程

```
用户发送问题 → POST /api/chat（SSE 流）
                    ↓
          ┌─ 阶段1：检索 ─────────────────────┐
          │  embed_query(问题)                  │
          │  ChromaDB.query(top_k=5)           │
          │  → SSE: { type: "retrieval" }      │
          └────────────────────────────────────┘
                    ↓
          ┌─ 阶段2：构建 Prompt ──────────────┐
          │  system_prompt + 检索上下文         │
          │  + 历史消息 + 用户问题              │
          │  → SSE: { type: "prompt" }         │
          └────────────────────────────────────┘
                    ↓
          ┌─ 阶段3：流式生成 ─────────────────┐
          │  LLM.stream_chat(messages)         │
          │  → SSE: { type: "chunk" } × N      │
          └────────────────────────────────────┘
                    ↓
          ┌─ 阶段4：完成 ─────────────────────┐
          │  持久化消息到 session               │
          │  → SSE: { type: "done" }           │
          └────────────────────────────────────┘
```

---

## API 端点汇总

### 仓库管理

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/repos` | 添加本地仓库 |
| POST | `/api/repos/upload` | 上传 ZIP 仓库 |
| GET | `/api/repos` | 获取仓库列表 |
| DELETE | `/api/repos/{repo_id}` | 删除仓库及关联数据 |
| POST | `/api/repos/{repo_id}/index` | 触发后台索引 |
| GET | `/api/repos/{repo_id}/index/status` | 查询索引进度 |

### 代码块

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/repos/{repo_id}/chunks` | 获取仓库所有代码块 |
| GET | `/api/repos/{repo_id}/chunks/{chunk_id}/context` | 获取代码块的文件上下文 |
| GET | `/api/repos/{repo_id}/stats` | 获取索引统计信息 |

### 搜索

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/search` | 向量相似度搜索 |

### 聊天

| 方法 | 路径 | 功能 |
|------|------|------|
| POST | `/api/chat` | SSE 流式 RAG 问答 |
| POST | `/api/chat/prompt-preview` | Prompt 预览 |
| GET | `/api/chat/sessions` | 获取会话列表 |
| POST | `/api/chat/sessions` | 创建新会话 |
| GET | `/api/chat/sessions/{id}` | 获取会话详情 |
| DELETE | `/api/chat/sessions/{id}` | 删除会话 |

### 配置 & 健康

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/api/settings` | 获取配置（Key 脱敏） |
| PUT | `/api/settings` | 更新配置 |
| GET | `/api/health` | 健康检查 |

---

## 数据持久化

项目采用 JSON 文件 + ChromaDB 的轻量持久化方案，无需额外数据库：

| 存储 | 路径 | 内容 |
|------|------|------|
| `settings.json` | `backend/data/` | API Key、模型配置、RAG 参数 |
| `repos.json` | `backend/data/` | 仓库元数据（id、名称、路径、状态、文件数、块数） |
| `sessions.json` | `backend/data/` | 聊天会话 + 完整消息历史 + RAG 元数据 |
| `{repo_id}_chunks.json` | `backend/data/` | 代码块详情（内容、文件路径、起止行号） |
| `chroma/` | `backend/data/` | ChromaDB 持久化向量（每个仓库一个 collection） |
| `uploads/` | `backend/data/` | ZIP 上传解压后的仓库文件 |

---

## 启动方式

### 一键启动

```bash
# macOS / Linux
chmod +x scripts/start-macos-linux.sh
./scripts/start-macos-linux.sh

# Windows
scripts\start-windows.bat
```

### 手动启动

```bash
# 后端
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

# 前端（新终端）
cd frontend
npm install
npm run dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端界面 | http://localhost:5173 |
| 后端 API | http://localhost:8000 |
| API 文档（Swagger） | http://localhost:8000/docs |
