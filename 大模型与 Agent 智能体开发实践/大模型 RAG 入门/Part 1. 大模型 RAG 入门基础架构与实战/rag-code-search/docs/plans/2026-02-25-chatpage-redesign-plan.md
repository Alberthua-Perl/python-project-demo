# ChatPage 改造实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 全面改造 ChatPage，解决视觉风格、功能体验、布局结构三类问题，达到产品级质量。

**Architecture:** 新增 `MarkdownMessage` 和 `RagDrawer` 两个组件，主题系统通过 CSS 变量 + `<html class="dark">` 实现，RAG 面板改为 fixed 定位右侧抽屉，输入区升级为自增高 textarea。

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, react-markdown, remark-gfm, prism-react-renderer, lucide-react, @radix-ui/react-tabs

---

## Task 1: 安装新依赖

**Files:**
- Modify: `frontend/package.json`

**Step 1: 安装 react-markdown 和 remark-gfm**

```bash
cd /Users/mac/PycharmProjects/JupyterProject/LLMBasicsProject/LLM_RAG/rag-code-search/frontend
npm install react-markdown remark-gfm
```

Expected: `package.json` 中出现 `"react-markdown"` 和 `"remark-gfm"` 条目，无报错。

**Step 2: 验证安装**

```bash
cat package.json | grep -E "react-markdown|remark-gfm"
```

Expected: 两行输出，版本号正常。

**Step 3: Commit**

```bash
git add frontend/package.json frontend/package-lock.json
git commit -m "feat: add react-markdown and remark-gfm dependencies"
```

---

## Task 2: 扩展主题系统（CSS 变量 + Dark Mode）

**Files:**
- Modify: `frontend/src/index.css`

**Step 1: 替换 index.css 内容**

将 `frontend/src/index.css` 替换为以下内容：

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 97.6%;
    --sidebar-bg: 220 14.3% 95.9%;
    --chat-bg: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
    --user-bubble: 221.2 83.2% 53.3%;
    --assistant-bg: 220 14.3% 95.9%;
  }

  .dark {
    --background: 222 47% 5%;
    --sidebar-bg: 215 28% 9%;
    --chat-bg: 222 47% 4%;
    --foreground: 210 40% 91%;
    --card: 215 28% 9%;
    --card-foreground: 210 40% 91%;
    --border: 215 14% 19%;
    --input: 215 14% 19%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 215 28% 12%;
    --secondary-foreground: 210 40% 91%;
    --muted: 215 28% 12%;
    --muted-foreground: 215 16% 55%;
    --accent: 215 28% 12%;
    --accent-foreground: 210 40% 91%;
    --destructive: 0 62.8% 50%;
    --destructive-foreground: 210 40% 98%;
    --ring: 221.2 83.2% 53.3%;
    --user-bubble: 221.2 83.2% 53.3%;
    --assistant-bg: 215 28% 11%;
  }
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  code, pre {
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
  }
}
```

**Step 2: 验证 Tailwind 编译无报错**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 无 TypeScript 报错。

**Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat: extend theme system with dark mode CSS variables"
```

---

## Task 3: 更新 App.tsx 支持主题挂载

**Files:**
- Modify: `frontend/src/App.tsx`

**Step 1: 在 App.tsx 顶部添加主题初始化逻辑**

在 `App.tsx` 的 `export default function App()` 之前添加：

```typescript
// 初始化主题（在组件外执行，避免闪烁）
const savedTheme = localStorage.getItem('theme')
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark')
}
```

**Step 2: Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat: initialize dark mode theme from localStorage on load"
```

---
## Task 4: 新建 MarkdownMessage 组件

**Files:**
- Create: `frontend/src/components/MarkdownMessage.tsx`

**Step 1: 创建组件文件**

```typescript
import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Highlight, themes } from 'prism-react-renderer'

interface CodeBlockProps {
  language: string
  code: string
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [collapsed, setCollapsed] = useState(() => code.split('\n').length > 20)
  const lineCount = code.split('\n').length
  const isDark = document.documentElement.classList.contains('dark')

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-border text-sm">
      <div className="flex items-center justify-between px-3 py-1.5 bg-muted border-b border-border">
        <span className="text-xs font-mono text-muted-foreground">{language || 'text'}</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? '✓ 已复制' : '复制'}
          </button>
          {lineCount > 20 && (
            <button
              onClick={() => setCollapsed(c => !c)}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {collapsed ? `展开 (共 ${lineCount} 行)` : '折叠 ▲'}
            </button>
          )}
        </div>
      </div>
      {!collapsed && (
        <Highlight
          theme={isDark ? themes.vsDark : themes.github}
          code={code.trimEnd()}
          language={language || 'text'}
        >
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre className={`${className} p-3 overflow-x-auto text-xs leading-relaxed`} style={style}>
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      )}
    </div>
  )
}

interface Props {
  content: string
}

export default function MarkdownMessage({ content }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          const isBlock = !props.node?.position || String(children).includes('\n')
          if (isBlock && match) {
            return <CodeBlock language={match[1]} code={String(children)} />
          }
          return (
            <code className="px-1 py-0.5 rounded bg-muted font-mono text-xs" {...props}>
              {children}
            </code>
          )
        },
        p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-3 mt-4">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-4">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-3">{children}</h3>,
        ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-border pl-3 my-3 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-3">
            <table className="text-sm border-collapse w-full">{children}</table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-border px-3 py-1.5 bg-muted font-semibold text-left">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border border-border px-3 py-1.5">{children}</td>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
```

**Step 2: 验证 TypeScript 无报错**

```bash
cd frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/components/MarkdownMessage.tsx
git commit -m "feat: add MarkdownMessage component with syntax highlighting and collapsible code blocks"
```

---

## Task 5: 新建 RagDrawer 组件

**Files:**
- Create: `frontend/src/components/RagDrawer.tsx`

**Step 1: 创建组件文件**

```typescript
import * as Tabs from '@radix-ui/react-tabs'
import type { SearchResult, PromptParts } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  retrieval: SearchResult[]
  prompt: PromptParts | null
  tokens: number
}

export default function RagDrawer({ open, onClose, retrieval, prompt, tokens }: Props) {
  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 dark:bg-black/40"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 z-50 flex flex-col
          bg-[hsl(var(--sidebar-bg))] border-l border-border shadow-xl
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="font-semibold text-sm">RAG 过程</span>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs">
          {retrieval.length === 0 && !prompt ? (
            <p className="text-muted-foreground text-center mt-8">发送消息后查看 RAG 过程</p>
          ) : (
            <>
              {/* Retrieval results */}
              {retrieval.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground uppercase tracking-wide text-xs">
                    📎 检索结果 (top-{retrieval.length})
                  </h4>
                  {retrieval.map((r, i) => (
                    <details key={r.chunk_id} className="border border-border rounded-lg overflow-hidden">
                      <summary className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/50 gap-2">
                        <span className="font-mono text-muted-foreground truncate">
                          #{i + 1} {r.file_path}
                        </span>
                        <span className="shrink-0 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded text-xs">
                          ⭐ {r.score.toFixed(2)}
                        </span>
                      </summary>
                      <pre className="px-3 py-2 font-mono text-xs overflow-x-auto bg-muted/30 border-t border-border whitespace-pre-wrap">
                        {r.content}
                      </pre>
                    </details>
                  ))}
                </div>
              )}

              {/* Prompt breakdown */}
              {prompt && (
                <div className="space-y-2">
                  <h4 className="font-medium text-muted-foreground uppercase tracking-wide text-xs">
                    📋 Prompt 构成 · ~{tokens} tokens
                  </h4>
                  <Tabs.Root defaultValue="system">
                    <Tabs.List className="flex gap-1 flex-wrap mb-2">
                      {['system', 'context', 'history', 'user'].map(tab => (
                        <Tabs.Trigger
                          key={tab}
                          value={tab}
                          className="px-2 py-1 rounded text-xs border border-border
                            data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                            data-[state=inactive]:text-muted-foreground hover:bg-muted transition-colors"
                        >
                          {tab === 'system' ? '🔵 System' :
                           tab === 'context' ? '🟢 Context' :
                           tab === 'history' ? `🟡 History (${prompt.history.length})` :
                           '🔴 User'}
                        </Tabs.Trigger>
                      ))}
                    </Tabs.List>
                    {[
                      { value: 'system', text: prompt.system },
                      { value: 'context', text: prompt.context },
                      { value: 'history', text: prompt.history.map(m => `[${m.role}]: ${m.content}`).join('\n') || '(无历史)' },
                      { value: 'user', text: prompt.user_message },
                    ].map(({ value, text }) => (
                      <Tabs.Content key={value} value={value}>
                        <pre className="whitespace-pre-wrap font-mono text-xs p-2 rounded border border-border bg-muted/30 max-h-64 overflow-y-auto">
                          {text}
                        </pre>
                      </Tabs.Content>
                    ))}
                  </Tabs.Root>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
```

**Step 2: 验证 TypeScript 无报错**

```bash
cd frontend && npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add frontend/src/components/RagDrawer.tsx
git commit -m "feat: add RagDrawer component with slide-in animation and tab-based prompt view"
```

---
## Task 6: 重写 ChatPage.tsx

**Files:**
- Modify: `frontend/src/pages/ChatPage.tsx`

**Step 1: 完整替换 ChatPage.tsx**

```typescript
import { useEffect, useRef, useState } from 'react'
import { Moon, Sun, Plus, Send, Square } from 'lucide-react'
import { listRepos, listSessions, createSession, deleteSession, chatStream } from '@/services/api'
import type { Repo, Session, SearchResult, PromptParts, SSEEvent } from '@/types'
import MarkdownMessage from '@/components/MarkdownMessage'
import RagDrawer from '@/components/RagDrawer'

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
}

interface RagPanel {
  retrieval: SearchResult[]
  prompt: PromptParts | null
  tokens: number
}

function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )
  const toggle = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }
  return { dark, toggle }
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}分钟前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}小时前`
  return `${Math.floor(hours / 24)}天前`
}

export default function ChatPage() {
  const { dark, toggle } = useTheme()
  const [repos, setRepos] = useState<Repo[]>([])
  const [repoId, setRepoId] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [ragPanel, setRagPanel] = useState<RagPanel>({ retrieval: [], prompt: null, tokens: 0 })
  const [drawerOpen, setDrawerOpen] = useState(false)
  const cancelRef = useRef<(() => void) | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    listRepos().then(rs => {
      const indexed = rs.filter(r => r.status === 'indexed')
      setRepos(indexed)
      if (indexed.length > 0) setRepoId(indexed[0].repo_id)
    })
    listSessions().then(setSessions)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleNewSession = async () => {
    const s = await createSession(repoId || undefined)
    setSessions(ss => [s, ...ss])
    setActiveSession(s)
    setMessages([])
    setRagPanel({ retrieval: [], prompt: null, tokens: 0 })
    setDrawerOpen(false)
  }

  const handleSelectSession = (s: Session) => {
    setActiveSession(s)
    setMessages(s.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })))
    setRagPanel({ retrieval: [], prompt: null, tokens: 0 })
    setDrawerOpen(false)
  }

  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteSession(sid)
    setSessions(ss => ss.filter(s => s.session_id !== sid))
    if (activeSession?.session_id === sid) {
      setActiveSession(null)
      setMessages([])
      setRagPanel({ retrieval: [], prompt: null, tokens: 0 })
      setDrawerOpen(false)
    }
  }

  const handleStop = () => {
    cancelRef.current?.()
    setSending(false)
    setMessages(ms => {
      const copy = [...ms]
      const last = copy[copy.length - 1]
      if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, streaming: false }
      return copy
    })
  }

  const handleSend = async () => {
    if (!input.trim() || !activeSession || sending) return
    const msg = input.trim()
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setSending(true)
    setRagPanel({ retrieval: [], prompt: null, tokens: 0 })

    setMessages(ms => [...ms, { role: 'user', content: msg }])
    setMessages(ms => [...ms, { role: 'assistant', content: '', streaming: true }])

    let newRag: RagPanel = { retrieval: [], prompt: null, tokens: 0 }

    cancelRef.current = chatStream(
      msg,
      activeSession.session_id,
      repoId,
      (event: SSEEvent) => {
        if (event.type === 'retrieval') {
          newRag = { ...newRag, retrieval: event.results }
          setRagPanel({ ...newRag })
          setDrawerOpen(true)
        } else if (event.type === 'prompt') {
          newRag = { ...newRag, prompt: event.prompt_parts, tokens: event.total_tokens_estimate }
          setRagPanel({ ...newRag })
        } else if (event.type === 'chunk') {
          setMessages(ms => {
            const copy = [...ms]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, content: last.content + event.content }
            return copy
          })
        } else if (event.type === 'done') {
          setMessages(ms => {
            const copy = [...ms]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, streaming: false }
            return copy
          })
          setSending(false)
          listSessions().then(setSessions)
        }
      },
      () => setSending(false)
    )
  }

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex h-full overflow-hidden bg-[hsl(var(--background))]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 border-r border-border flex flex-col bg-[hsl(var(--sidebar-bg))]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm text-foreground">RAG 演示系统</span>
          <button onClick={toggle} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
            {dark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Repo selector */}
        {repos.length > 0 && (
          <div className="px-3 pt-3">
            <select
              value={repoId}
              onChange={e => setRepoId(e.target.value)}
              className="w-full border border-border rounded-md px-2 py-1.5 text-xs bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {repos.map(r => <option key={r.repo_id} value={r.repo_id}>{r.name}</option>)}
            </select>
          </div>
        )}

        {/* New session button */}
        <div className="px-3 pt-2 pb-2">
          <button
            onClick={handleNewSession}
            className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-md border border-border hover:bg-accent hover:text-accent-foreground transition-colors font-medium"
          >
            <Plus size={13} /> 新建会话
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 && (
            <p className="text-xs text-muted-foreground text-center mt-6 px-3">暂无会话</p>
          )}
          {sessions.map(s => (
            <div
              key={s.session_id}
              onClick={() => handleSelectSession(s)}
              className={`px-3 py-2.5 cursor-pointer flex items-start justify-between group border-b border-border/50 transition-colors
                ${activeSession?.session_id === s.session_id
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'}`}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs truncate font-medium">
                  {s.messages.length > 0 ? s.messages[0].content.slice(0, 24) + '…' : '新会话'}
                </p>
                {s.updated_at && (
                  <p className="text-xs text-muted-foreground mt-0.5">{formatRelativeTime(s.updated_at)}</p>
                )}
              </div>
              <button
                onClick={e => handleDeleteSession(s.session_id, e)}
                className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive ml-2 mt-0.5 shrink-0 transition-opacity"
              >✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[hsl(var(--chat-bg))]">
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border shrink-0">
          <span className="text-sm font-medium text-foreground truncate">
            {activeSession
              ? (activeSession.messages[0]?.content.slice(0, 40) || '新会话')
              : '选择或新建会话'}
          </span>
          {activeSession && (
            <button
              onClick={() => setDrawerOpen(o => !o)}
              className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
                drawerOpen
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              RAG 过程
            </button>
          )}
        </div>

        {/* Messages */}
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="text-4xl">💬</div>
            <p className="text-sm">新建或选择一个会话开始对话</p>
            <button
              onClick={handleNewSession}
              className="text-xs px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              新建会话
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
              {messages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center mt-8">
                  向代码库提问，RAG 助手将检索相关代码片段后回答
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {m.role === 'user' ? (
                    <div className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm bg-primary text-primary-foreground">
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ) : (
                    <div className="max-w-[85%] text-sm text-foreground">
                      {m.streaming && !m.content ? (
                        <span className="animate-pulse text-muted-foreground">▌</span>
                      ) : m.streaming ? (
                        <>
                          <pre className="whitespace-pre-wrap font-sans leading-relaxed">{m.content}</pre>
                          <span className="animate-pulse text-muted-foreground">▌</span>
                        </>
                      ) : (
                        <MarkdownMessage content={m.content} />
                      )}
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input area */}
            <div className="px-4 py-3 border-t border-border shrink-0">
              <div className="flex gap-2 items-end">
                <div className="flex-1 relative">
                  <textarea
                    ref={textareaRef}
                    className="w-full border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-background text-foreground placeholder:text-muted-foreground leading-relaxed"
                    style={{ minHeight: '42px', maxHeight: '120px' }}
                    placeholder="输入问题..."
                    value={input}
                    onChange={handleTextareaInput}
                    onKeyDown={handleTextareaKeyDown}
                    rows={1}
                  />
                </div>
                {sending ? (
                  <button
                    onClick={handleStop}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                  >
                    <Square size={14} /> 停止
                  </button>
                ) : (
                  <button
                    onClick={handleSend}
                    disabled={!input.trim()}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 transition-opacity"
                  >
                    <Send size={14} /> 发送
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 text-right">Shift+Enter 换行</p>
            </div>
          </>
        )}
      </div>

      {/* RAG Drawer */}
      <RagDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        retrieval={ragPanel.retrieval}
        prompt={ragPanel.prompt}
        tokens={ragPanel.tokens}
      />
    </div>
  )
}
```

**Step 2: 验证 TypeScript 无报错**

```bash
cd frontend && npx tsc --noEmit
```

Expected: 无报错输出。

**Step 3: Commit**

```bash
git add frontend/src/pages/ChatPage.tsx
git commit -m "feat: redesign ChatPage with dark mode, RAG drawer, markdown rendering, and auto-grow textarea"
```

---

## Task 7: 验证整体效果

**Step 1: 启动开发服务器（手动在终端运行）**

```bash
# 终端1：启动后端
cd backend && python -m uvicorn app.main:app --reload

# 终端2：启动前端
cd frontend && npm run dev
```

**Step 2: 检查清单**

打开 `http://localhost:5173/chat`，逐项验证：

- [ ] 亮色模式下页面正常显示，无样式错误
- [ ] 点击 🌙 切换暗色模式，刷新后主题保持
- [ ] 新建会话，发送消息，助手回复正常流式输出
- [ ] 流式结束后，Markdown 正确渲染（粗体、列表、代码块）
- [ ] 代码块显示语言标签、复制按�tml、超过20行可折叠
- [ ] 发送消息后 RAG 抽屉自动滑入，点击 ✕ 关闭
- [ ] RAG 抽屉中 Prompt 四个 Tab 切换正常
- [ ] textarea 随输入内容自动增高，最多5行
- [ ] 流式输出中显示"停止"按钮，点击可中断
- [ ] 会话列表显示相对时间戳

**Step 3: 最终 Commit**

```bash
git add -A
git commit -m "feat: complete ChatPage redesign - dark mode, RAG drawer, markdown, improved UX"
```


