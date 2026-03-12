# ChatPage 改造设计文档

**日期**：2026-02-25
**方案**：方案 B（react-markdown + 外科手术式增强）
**范围**：仅改造 `frontend/src/pages/ChatPage.tsx` 及相关样式，不影响其他页面

---

## 一、改造目标

当前 ChatPage 存在三类问题，本次全部解决：

1. **视觉风格**：太像默认模板，缺乏产品感
2. **功能体验**：无 Markdown/代码高亮渲染，输入框不支持多行，无法中断流式输出
3. **布局结构**：三栏太挤，RAG 面板出现时布局跳动

---

## 二、布局结构

### 改前
```
[会话列表 w-44] | [聊天区 flex-1] | [RAG面板 w-72 条件渲染，出现时跳动]
```

### 改后
```
[会话列表 w-56] | [聊天区 flex-1] + [RAG抽屉 fixed right-0 滑入，不影响布局]
```

### 会话列表（`w-56`）
- 顶部一行：App 标题 "RAG 演示系统" + 主题切换按钮（🌙/☀️）
- 代码库选择器（`<select>`）
- `+ 新建会话` 按钮（全宽，带图标）
- 会话列表：每项显示首条消息前 24 字 + 相对时间戳，hover 显示删除按钮

### 聊天区（`flex-1`）
- 顶部 header bar：当前会话名 + "RAG 过程" 按钮（点击开关抽屉）
- 消息区：撑满剩余高度，底部固定输入区
- 无会话时：居中空状态引导

### RAG 抽屉（`fixed right-0`，`w-80`）
- `translate-x-full → translate-x-0`，`transition-transform duration-300`
- fixed 定位，叠加在内容上方，不影响聊天区宽度
- 顶部关闭按钮 ✕
- 无数据时显示占位提示

---

## 三、视觉风格 & 主题系统

### Light Mode
```css
--background: #F9FAFB
--sidebar-bg: #F3F4F6
--chat-bg: #FFFFFF
--user-bubble: #1D4ED8
--assistant-bubble: #F3F4F6
--border: #E5E7EB
--primary-text: #111827
--muted-text: #6B7280
```

### Dark Mode
```css
--background: #0F1117
--sidebar-bg: #161B22
--chat-bg: #0D1117
--user-bubble: #1D4ED8
--assistant-bubble: #1C2128
--border: #30363D
--primary-text: #E6EDF3
--muted-text: #8B949E
```

### 主题切换
- `<html>` 根节点切换 `class="dark"`
- CSS 变量用 `.dark {}` 覆盖
- 状态存 `localStorage`，刷新后保持
- 切换按钮使用 `lucide-react` 的 `Moon` / `Sun` 图标

### 字体
- 正文：`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`
- 代码：`'JetBrains Mono', 'Fira Code', monospace`（Google Fonts 引入）

### 消息样式
- 用户消息：右对齐气泡，`bg-blue-600 text-white`，`max-w-[85%]`
- 助手消息：左对齐平铺（无气泡包裹，类 Claude.ai 风格）
- 消息间距：`gap-6`（比现在 `gap-3` 更宽松）

---

## 四、Markdown 渲染

### 新增依赖
```bash
npm install react-markdown remark-gfm
```

### MarkdownMessage 组件
- 使用 `react-markdown` + `remark-gfm` 渲染助手消息
- 支持：标题、粗体、斜体、列表、表格、行内代码、代码块

### 代码块 UI
```
┌─────────────────────────────────────────┐
│ python                    [复制] [折叠▲] │  ← header bar
├─────────────────────────────────────────┤
│  def search(query: str):                │
│      results = vector_db.query(query)   │  ← prism-react-renderer 高亮
│      return results                     │
└─────────────────────────────────────────┘
```
- 语言标签显示在左侧
- 复制按钮：点击后变 "✓ 已复制"，1.5s 后恢复
- 折叠：超过 20 行默认折叠，显示"展开 (共 N 行)"
- Light 主题用 `github`，Dark 主题用 `vsDark`

### 流式输出处理
- `streaming: true` 时：保持 `<pre>` 纯文本 + `▌` 光标（避免不完整标签闪烁）
- `streaming: false` 后：切换为 `MarkdownMessage` 渲染

---

## 五、RAG 抽屉详情

### 触发方式
- 收到 `retrieval` SSE 事件后自动打开
- header bar 右侧"RAG 过程"按钮手动开关

### 内容结构
- **检索结果区**：top-K 结果列表，每条显示文件路径、行号、相似度分，可点击展开完整代码
- **Prompt 构成区**：用 `@radix-ui/react-tabs` 做 Tab 切换（System / Context / History / User），显示预估 token 数

---

## 六、输入区

- `<textarea>` 替换 `<input>`，默认 1 行，随内容增高，最多 5 行
- `Enter` 发送，`Shift+Enter` 换行
- 右下角提示：`Shift+Enter 换行`
- 发送中：按钮变为 `■ 停止`，点击调用 `cancelRef.current()`
- 输入框 disabled 状态仅视觉变暗

---

## 七、文件改动范围

| 文件 | 改动类型 |
|------|---------|
| `frontend/package.json` | 新增 `react-markdown`、`remark-gfm` |
| `frontend/src/index.css` | 扩展 CSS 变量，添加 `.dark {}` 覆盖，引入 JetBrains Mono |
| `frontend/src/pages/ChatPage.tsx` | 主要改造文件 |
| `frontend/src/components/MarkdownMessage.tsx` | 新建，Markdown 渲染组件 |
| `frontend/src/components/RagDrawer.tsx` | 新建，RAG 抽屉组件 |
| `frontend/src/App.tsx` | 微调：主题 class 挂载到 `<html>` |

---

## 八、不在本次范围内

- 其他页面（RepoManager、ChunksExplorer、SearchPlayground、SettingsPage）的样式改造
- 后端 API 变更
- 移动端响应式适配
