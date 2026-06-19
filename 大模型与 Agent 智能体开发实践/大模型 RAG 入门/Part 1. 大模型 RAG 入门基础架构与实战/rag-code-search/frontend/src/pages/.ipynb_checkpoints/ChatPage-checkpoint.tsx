import { useEffect, useRef, useState } from 'react'
import { Plus, SendHorizonal, Square, MessageSquare, Trash2, Database, ChevronDown, FolderOpen, Search, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { listRepos, listSessions, createSession, deleteSession, chatStream } from '@/services/api'
import type { Repo, Session, SearchResult, PromptParts, SSEEvent } from '@/types'
import MarkdownMessage from '@/components/MarkdownMessage'
import RagPanel from '@/components/RagPanel'

interface RagData {
  retrieval: SearchResult[]
  prompt: PromptParts | null
  tokens: number
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  ragData?: RagData
}

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '刚刚'
  if (mins < 60) return `${mins}m 前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h 前`
  return `${Math.floor(hours / 24)}d 前`
}

export default function ChatPage() {
  const navigate = useNavigate()
  const [repos, setRepos] = useState<Repo[]>([])
  const [repoId, setRepoId] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [activeRagIndex, setActiveRagIndex] = useState<number | null>(null)
  const streamingRagRef = useRef<RagData>({ retrieval: [], prompt: null, tokens: 0 })
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
    setActiveRagIndex(null)
  }

  const handleSelectSession = (s: Session) => {
    setActiveSession(s)
    const msgs: Message[] = s.messages.map(m => {
      const msg: Message = { role: m.role as 'user' | 'assistant', content: m.content }
      if (m.rag_data) {
        msg.ragData = {
          retrieval: m.rag_data.retrieval,
          prompt: m.rag_data.prompt_parts,
          tokens: m.rag_data.total_tokens_estimate,
        }
      }
      return msg
    })
    setMessages(msgs)
    const lastRagIdx = msgs.reduce<number | null>((acc, m, i) => m.ragData ? i : acc, null)
    setActiveRagIndex(lastRagIdx)
  }

  const handleDeleteSession = async (sid: string, e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteSession(sid)
    setSessions(ss => ss.filter(s => s.session_id !== sid))
    if (activeSession?.session_id === sid) {
      setActiveSession(null)
      setMessages([])
      setActiveRagIndex(null)
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
    streamingRagRef.current = { retrieval: [], prompt: null, tokens: 0 }

    setMessages(ms => {
      const updated = [...ms, { role: 'user' as const, content: msg }]
      const assistantIdx = updated.length
      setActiveRagIndex(assistantIdx)
      return [...updated, { role: 'assistant' as const, content: '', streaming: true }]
    })

    let newRag: RagData = { retrieval: [], prompt: null, tokens: 0 }

    cancelRef.current = chatStream(
      msg,
      activeSession.session_id,
      repoId,
      (event: SSEEvent) => {
        if (event.type === 'retrieval') {
          newRag = { ...newRag, retrieval: event.results }
          streamingRagRef.current = { ...newRag }
          setMessages(ms => {
            const copy = [...ms]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, ragData: { ...newRag } }
            return copy
          })
        } else if (event.type === 'prompt') {
          newRag = { ...newRag, prompt: event.prompt_parts, tokens: event.total_tokens_estimate }
          streamingRagRef.current = { ...newRag }
          setMessages(ms => {
            const copy = [...ms]
            const last = copy[copy.length - 1]
            if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, ragData: { ...newRag } }
            return copy
          })
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
            if (last?.role === 'assistant') copy[copy.length - 1] = { ...last, streaming: false, ragData: { ...newRag } }
            return copy
          })
          setSending(false)
          listSessions().then(setSessions)
        }
      },
      () => setSending(false)
    )
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  return (
    <div className="flex h-full overflow-hidden">

      {/* Left Panel: 280px */}
      <aside className="w-[280px] shrink-0 hidden md:flex flex-col border-r border-border bg-[hsl(var(--sidebar-bg))] overflow-hidden">

        {/* Repo selector */}
        <div className="px-4 pt-4 pb-2 shrink-0">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
            代码库
          </label>
          {repos.length === 0 ? (
            <button
              onClick={() => navigate('/repos')}
              className="cursor-pointer flex items-center gap-2 text-xs text-[#7c6af7] font-medium
                         py-2 px-3 rounded-xl bg-[#7c6af7]/10 border border-[#7c6af7]/20
                         hover:bg-[#7c6af7]/15 hover:border-[#7c6af7]/35 transition-all w-full justify-center"
            >
              <FolderOpen size={13} />
              添加代码库
            </button>
          ) : (
            <div className="relative">
              <select
                value={repoId}
                onChange={e => setRepoId(e.target.value)}
                className="cursor-pointer w-full appearance-none border border-border rounded-xl
                           px-3 py-2 pr-8 text-xs bg-[hsl(var(--elevated))] text-foreground
                           focus:outline-none focus:ring-2 focus:ring-[#7c6af7]/20 focus:border-[#7c6af7]/40
                           transition-all font-medium"
              >
                {repos.map(r => <option key={r.repo_id} value={r.repo_id}>{r.name}</option>)}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            </div>
          )}
        </div>

        {/* New session button */}
        <div className="px-4 pb-3 shrink-0">
          <button
            type="button"
            onClick={handleNewSession}
            className="cursor-pointer w-full flex items-center justify-center gap-1.5
                       text-xs px-3 py-2 rounded-xl font-medium transition-all
                       bg-[#7c6af7]/10 text-[#7c6af7] border border-[#7c6af7]/20
                       hover:bg-[#7c6af7]/15 hover:border-[#7c6af7]/35
                       active:scale-[0.98]"
          >
            <Plus size={12} strokeWidth={2.5} />
            新建会话
          </button>
        </div>

        <div className="h-px bg-border shrink-0" />

        {/* Session list */}
        <div className="flex-1 overflow-y-auto py-1">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-2 mt-10 text-muted-foreground px-4">
              <MessageSquare size={18} strokeWidth={1.5} />
              <p className="text-xs text-center">暂无会话，点击新建开始</p>
            </div>
          ) : (
            sessions.map((s, i) => (
              <div
                key={s.session_id}
                onClick={() => handleSelectSession(s)}
                className={cn(
                  'session-in cursor-pointer px-3 py-2.5 flex items-start justify-between group transition-all border-l-2',
                  activeSession?.session_id === s.session_id
                    ? 'bg-[#7c6af7]/10 border-l-[#7c6af7]'
                    : 'border-l-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={cn(
                    'shrink-0 mt-0.5 w-6 h-6 rounded-md flex items-center justify-center transition-colors',
                    activeSession?.session_id === s.session_id
                      ? 'bg-[#7c6af7]/15 text-[#7c6af7]'
                      : 'bg-[hsl(var(--elevated))] text-muted-foreground'
                  )}>
                    <MessageSquare size={11} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      'text-sm truncate font-medium leading-5 transition-colors',
                      activeSession?.session_id === s.session_id ? 'text-[#7c6af7]' : 'text-foreground'
                    )}>
                      {s.messages.length > 0 ? s.messages[0].content.slice(0, 28) + '…' : '新会话'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {s.messages.length > 0 && (
                        <span className="text-xs text-muted-foreground/70 font-mono">{s.messages.length}条</span>
                      )}
                      {s.updated_at && <span className="text-xs text-muted-foreground/50">·</span>}
                      {s.updated_at && <p className="text-xs text-muted-foreground/60">{formatRelativeTime(s.updated_at)}</p>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={e => handleDeleteSession(s.session_id, e)}
                  aria-label="删除会话"
                  className="cursor-pointer opacity-0 group-hover:opacity-100 p-1 rounded
                             text-muted-foreground hover:text-destructive hover:bg-destructive/10
                             ml-1 mt-0.5 shrink-0 transition-all"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Chat Center: flex-1 */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[hsl(var(--chat-bg))] relative">

        {/* Glass header with repo scope pill */}
        <div className="glass-panel flex items-center justify-center px-5 py-3 border-b border-border shrink-0 absolute top-0 w-full z-10">
          {repoId && repos.find(r => r.repo_id === repoId) && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--elevated))] border border-border text-xs text-muted-foreground">
              <Database size={11} className="text-[#7c6af7]" />
              <span>作用域:</span>
              <span className="text-foreground font-medium">{repos.find(r => r.repo_id === repoId)?.name}</span>
            </div>
          )}
        </div>

        {/* Empty state */}
        {!activeSession ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5
                            flex items-center justify-center
                            shadow-[0_8px_24px_rgba(107,92,231,0.15)] overflow-hidden">
              <img src="/logo.png" alt="赋范 CodeRAG" className="w-10 h-10 object-contain" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold text-foreground tracking-tight">赋范 RAG 代码库助手</h2>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[220px]">
                选择代码库，新建会话<br />向代码提问，获取精准答案
              </p>
            </div>
            <button
              onClick={handleNewSession}
              className="cursor-pointer flex items-center gap-2 text-sm px-5 py-2.5 rounded-full
                         bg-primary text-primary-foreground hover:opacity-90 transition-all
                         font-medium shadow-[0_4px_12px_rgba(107,92,231,0.25)] active:scale-[0.97]"
            >
              <Plus size={14} strokeWidth={2.5} /> 新建会话
            </button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-8 pt-20 pb-36">
              <div className="max-w-[900px] mx-auto px-6 flex flex-col gap-8">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center gap-2 mt-12 text-muted-foreground">
                    <MessageSquare size={22} strokeWidth={1.5} />
                    <p className="text-sm">向代码库提问，RAG 助手将检索相关代码片段后回答</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i}
                    className={`msg-in flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    style={{ animationDelay: `${Math.min(i * 20, 100)}ms` }}>
                    {m.role === 'user' ? (
                      <div className="max-w-[80%] user-bubble px-4 py-3 text-[15px]
                                    bg-primary text-primary-foreground shadow-sm">
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>
                    ) : (
                      <div className="flex gap-3 max-w-[90%]">
                        {/* Logo avatar */}
                        <div className="shrink-0 w-8 h-8 rounded-full bg-[#7c6af7]/15 border border-[#7c6af7]/30 flex items-center justify-center mt-1 overflow-hidden">
                          <img src="/logo.png" alt="AI" className="w-5 h-5 object-contain" />
                        </div>
                        <div className="text-[15px] text-foreground leading-relaxed">
                          {m.streaming && !m.content ? (
                            <span aria-hidden="true" className="inline-block w-2 h-4 bg-primary/70 cursor-blink rounded-sm" />
                          ) : m.streaming ? (
                            <>
                              <pre className="whitespace-pre-wrap font-sans leading-7 text-[15px]">{m.content}</pre>
                              <span aria-hidden="true" className="inline-block w-2 h-4 bg-primary/70 cursor-blink rounded-sm ml-0.5" />
                            </>
                          ) : (
                            <MarkdownMessage content={m.content} />
                          )}
                          {m.ragData && !m.streaming && (
                            <button
                              onClick={() => setActiveRagIndex(i)}
                              className={cn(
                                'cursor-pointer mt-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                                activeRagIndex === i
                                  ? 'bg-[#7c6af7]/15 text-[#7c6af7] border border-[#7c6af7]/30'
                                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                              )}
                            >
                              <Search size={11} />
                              检索过程
                              <span className="text-[10px] opacity-60">·{m.ragData.retrieval.length}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Composer — floating, centered */}
            <div className="absolute bottom-6 left-0 w-full px-6 flex justify-center pointer-events-none">
              <div className="w-full max-w-[800px] pointer-events-auto">
                <div className="composer-card rounded-[24px] border border-border bg-[hsl(var(--sidebar-bg))] p-2.5">
                  <textarea
                    ref={textareaRef}
                    aria-label="输入问题"
                    className="input-pill w-full px-4 py-3 text-sm resize-none
                               bg-transparent text-foreground
                               placeholder:text-muted-foreground leading-relaxed"
                    style={{ minHeight: '44px', maxHeight: '120px' }}
                    placeholder="向代码库提问..."
                    value={input}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <div className="flex items-center justify-between px-3 pt-1">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-[hsl(var(--hover))] rounded-full transition-colors">
                        <Plus size={18} />
                      </button>
                      <span className="text-[10px] text-muted-foreground/40 font-mono hidden sm:inline">Shift+Enter 换行</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {sending ? (
                        <button
                          onClick={handleStop}
                          className="cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-full
                                     text-xs font-medium bg-destructive/10 text-destructive
                                     hover:bg-destructive/20 transition-colors"
                        >
                          <Square size={12} /> 停止
                        </button>
                      ) : (
                        <button
                          onClick={handleSend}
                          disabled={!input.trim()}
                          className={cn(
                            'w-9 h-9 flex items-center justify-center rounded-full transition-all',
                            input.trim()
                              ? 'bg-[#7c6af7] text-white hover:bg-[#6b5ce7] active:scale-95 shadow-md shadow-[#7c6af7]/20'
                              : 'bg-[hsl(var(--hover))] text-muted-foreground cursor-not-allowed'
                          )}
                        >
                          <SendHorizonal size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-center text-[11px] text-muted-foreground/40 mt-2">AI 可能会犯错，请核对生成的代码。</p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Right Panel: RAG (persistent) */}
      <RagPanel
        retrieval={activeRagIndex !== null ? (messages[activeRagIndex]?.ragData?.retrieval ?? []) : []}
        prompt={activeRagIndex !== null ? (messages[activeRagIndex]?.ragData?.prompt ?? null) : null}
        tokens={activeRagIndex !== null ? (messages[activeRagIndex]?.ragData?.tokens ?? 0) : 0}
        streaming={sending && activeRagIndex !== null && activeRagIndex === messages.length - 1}
      />
    </div>
  )
}
