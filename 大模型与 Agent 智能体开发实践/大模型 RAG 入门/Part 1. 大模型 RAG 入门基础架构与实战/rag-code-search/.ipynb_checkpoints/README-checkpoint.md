# RAG Code Search v2.0

代码库智能检索问答系统 — 上传代码库，自动分块索引，通过 RAG 向代码提问并获取精准答案。

## 核心功能

- **代码库管理** — 本地路径添加或 ZIP 上传，自动扫描 Python 文件
- **智能分块** — 按字符数分块，支持重叠，对齐行边界
- **向量检索** — ChromaDB 存储 + 余弦相似度搜索
- **RAG 对话** — 检索相关代码片段后，LLM 流式回答并引用文件路径和行号
- **分块可视化** — 查看每个 chunk 在原文件中的精确位置
- **检索过程回溯** — 每轮对话的 RAG 检索数据持久化，支持历史查看

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 后端 | FastAPI + Python |
| 向量库 | ChromaDB (cosine) |
| LLM | OpenAI 兼容 API (可配置) |
| Embedding | text-embedding-3-small (可配置) |

## 项目结构

```
rag-code-search/
├── backend/                 # 后端 (FastAPI)
│   ├── app/
│   │   ├── api/             # API 端点 (repos, chunks, search, chat, settings)
│   │   ├── services/        # 业务逻辑 (索引, 检索, 对话, LLM客户端)
│   │   ├── config/          # 配置管理
│   │   └── main.py          # FastAPI 入口
│   ├── data/                # 数据存储 (JSON + ChromaDB)
│   └── requirements.txt
├── frontend/                # 前端 (React + Vite)
│   └── src/
│       ├── pages/           # 页面 (Chat, Repos, Chunks, Search, Settings)
│       ├── components/      # 组件 (MarkdownMessage, RagPanel)
│       ├── services/        # API 客户端
│       └── types/           # TypeScript 类型
├── scripts/                 # 启动脚本
│   ├── start-macos-linux.sh
│   └── start-windows.bat
└── README.md
```

## 快速开始

### 环境要求

- Python 3.10+
- Node.js 18+

### 一键启动（推荐）

#### macOS / Linux

```bash
# 添加执行权限（首次运行）
chmod +x scripts/start-macos-linux.sh

# 启动服务
./scripts/start-macos-linux.sh
```

#### Windows

```bash
# 双击运行或在命令行执行
scripts\start-windows.bat
```

启动后访问：
- **前端界面**: http://localhost:5173
- **后端 API**: http://localhost:8000
- **API 文档**: http://localhost:8000/docs

> 💡 **提示**: 首次启动后，请先在「设置」页面配置 LLM 和 Embedding 的 API Key。

### 手动分步启动

如需开发调试，可手动启动前后端：

#### 后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

#### 前端

```bash
cd frontend
npm install
npm run dev
```

## 使用流程

1. **配置模型** — 在「设置」页面填入 LLM 和 Embedding 的 API Key、Base URL、模型名
2. **添加代码库** — 在「代码库管理」页面输入本地路径或上传 ZIP 文件
3. **索引代码** — 点击「开始索引」，等待分块和向量化完成
4. **开始对话** — 在「对话」页面新建会话，向代码库提问
5. **查看检索过程** — 点击 assistant 消息下方的「检索过程」按钮，右侧面板展示 RAG 细节

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/repos` | 添加本地代码库 |
| POST | `/api/repos/upload` | 上传 ZIP 代码库 |
| GET | `/api/repos` | 列出所有代码库 |
| DELETE | `/api/repos/{repo_id}` | 删除代码库 |
| POST | `/api/repos/{repo_id}/index` | 触发索引 |
| GET | `/api/repos/{repo_id}/index/status` | 查询索引状态 |
| POST | `/api/search` | 向量检索 |
| POST | `/api/chat` | 流式对话 (SSE) |
| GET | `/api/chat/sessions` | 列出会话 |
| GET/PUT | `/api/settings` | 读取/更新配置 |

## License

MIT
