import { useEffect, useState } from 'react'
import { listRepos, search, promptPreview, getChunkContext } from '@/services/api'
import type { Repo, SearchResponse, PromptPreviewResponse, ChunkContext } from '@/types'
import { cn } from '@/lib/utils'
import {
  Cpu, Target, ChevronUp, ChevronDown, FileCode2, Database, Search, Loader2
} from 'lucide-react'

export default function SearchPlayground() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [repoId, setRepoId] = useState('')
  const [query, setQuery] = useState('')
  const [topK, setTopK] = useState(5)
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<SearchResponse | null>(null)
  const [preview, setPreview] = useState<PromptPreviewResponse | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [locating, setLocating] = useState<string | null>(null)
  const [locatorCtx, setLocatorCtx] = useState<ChunkContext | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    listRepos().then(rs => {
      const indexed = rs.filter(r => r.status === 'indexed')
      setRepos(indexed)
      if (indexed.length > 0) setRepoId(indexed[0].repo_id)
    })
  }, [])

  const handleSearch = async () => {
    if (!query.trim() || !repoId) return
    setError('')
    setSearching(true)
    setResult(null)
    setPreview(null)
    setLocatorCtx(null)
    try {
      const [sr, pp] = await Promise.all([
        search(query, repoId, topK),
        promptPreview(query, repoId, undefined, topK),
      ])
      setResult(sr)
      setPreview(pp)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSearching(false)
    }
  }

  const handleLocate = async (chunk_id: string) => {
    if (locating === chunk_id) { setLocating(null); setLocatorCtx(null); return }
    setLocating(chunk_id)
    try {
      const ctx = await getChunkContext(repoId, chunk_id)
      setLocatorCtx(ctx)
    } catch (e) { console.error(e) }
  }

  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto flex flex-col h-full">
          {/* Header */}
          <div className="mb-8 space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-2xl font-semibold mb-1">语义检索游乐场</h1>
                <p className="text-sm text-muted-foreground">通过自然语言直接进行向量检索，探索知识库命中情况。</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-1.5 input-pill">
                  <Database size={14} className="text-muted-foreground mr-2" />
                  <select
                    value={repoId}
                    onChange={e => setRepoId(e.target.value)}
                    className="bg-transparent border-none text-foreground outline-none appearance-none cursor-pointer pr-4 font-mono text-xs"
                  >
                    {repos.map(r => <option key={r.repo_id} value={r.repo_id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Top-K</label>
                  <input
                    type="number" value={topK} onChange={e => setTopK(Number(e.target.value))}
                    className="w-16 border border-border rounded-lg px-2 py-1.5 text-sm bg-[hsl(var(--elevated))] focus:outline-none focus:border-[#7c6af7] transition-colors font-mono"
                    min={1} max={20}
                  />
                </div>
              </div>
            </div>

            {/* Search bar — large pill */}
            <div className="bg-[hsl(var(--sidebar-bg))] border border-border rounded-2xl p-2.5 flex items-center shadow-lg focus-within:border-[#7c6af7] focus-within:ring-1 focus-within:ring-[#7c6af7]/30 transition-all">
              <Search size={22} className="text-muted-foreground ml-3 mr-3" />
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
                className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground py-2 text-[15px]"
                placeholder="输入自然语言查询，如：如何读取配置文件"
              />
              <button
                onClick={handleSearch}
                disabled={searching || !repoId}
                className="rounded-xl px-6 h-10 ml-2 bg-[#7c6af7] text-white text-sm font-medium hover:bg-[#6b5ce7] disabled:opacity-50 transition-colors active:scale-[0.97]"
              >
                {searching ? <Loader2 size={18} className="animate-spin" /> : '开始检索'}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive mb-4">{error}</p>}

          {/* Loading state */}
          {searching && (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div
                className="w-12 h-12 rounded-full bg-[#7c6af7]/20 flex items-center justify-center mb-4 border border-[#7c6af7]/30"
                style={{ boxShadow: '0 0 15px rgba(124,106,247,0.3)' }}
              >
                <Cpu size={24} className="text-[#7c6af7] animate-pulse" />
              </div>
              <p className="text-sm animate-pulse">正在将查询转化为向量并进行相似度计算...</p>
            </div>
          )}

          {/* Results */}
          {result && !searching && (
            <div className="space-y-6 msg-in">
              {/* Embedding preview */}
              <div className="bg-[hsl(var(--elevated))] border border-border rounded-xl p-4 flex items-center gap-3 text-xs font-mono text-muted-foreground">
                <Target size={14} className="text-[#7c6af7] shrink-0" />
                <span className="shrink-0">Query Embedding (Top 10):</span>
                <div className="bg-[hsl(var(--sidebar-bg))] border border-border px-2 py-1.5 rounded flex-1 text-foreground truncate">
                  [{result.query_embedding_preview.map(v => v.toFixed(4)).join(', ')}]
                </div>
                <span className="shrink-0">· 共搜索 {result.total_searched} 个 chunk</span>
              </div>

              {/* Result cards */}
              <div className="space-y-4">
                {result.results.map((r, i) => (
                  <div key={r.chunk_id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-[hsl(var(--border-hover))] transition-colors shadow-sm">
                    {/* Card header */}
                    <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-[hsl(var(--elevated))]">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-[#7c6af7]/15 flex items-center justify-center text-xs font-mono text-[#7c6af7] font-bold shrink-0">
                          {i + 1}
                        </span>
                        <FileCode2 size={14} className="text-muted-foreground shrink-0" />
                        <span className="text-sm font-mono text-foreground truncate">{r.file_path}</span>
                        <span className="text-xs bg-[hsl(var(--sidebar-bg))] border border-border px-1.5 py-0.5 rounded font-mono text-muted-foreground shrink-0">
                          L{r.line_start}–{r.line_end}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 ml-4">
                        <div className="flex items-center gap-1.5 text-xs font-mono">
                          <span className="text-muted-foreground">Dist:</span>
                          <span className="text-foreground">{r.distance.toFixed(4)}</span>
                        </div>
                        <span className="text-xs bg-green-500/15 text-green-500 dark:text-green-400 px-2 py-0.5 rounded font-medium font-mono border border-green-500/30">
                          {r.score.toFixed(3)}
                        </span>
                      </div>
                    </div>
                    {/* Card content */}
                    <div className="p-4">
                      <pre className="text-xs font-mono bg-[hsl(var(--elevated))] border border-border rounded-lg p-3 overflow-x-auto max-h-32 whitespace-pre-wrap text-muted-foreground leading-relaxed mb-3">
                        {r.content}
                      </pre>
                      <button
                        onClick={() => handleLocate(r.chunk_id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#7c6af7] hover:text-foreground transition-colors"
                      >
                        {locating === r.chunk_id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {locating === r.chunk_id ? '收起原文' : '查看原文'}
                      </button>
                      {locating === r.chunk_id && locatorCtx && (
                        <div className="mt-3 msg-in">
                          <InlineLocator ctx={locatorCtx} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Prompt preview */}
              {preview && (
                <div className="border border-border rounded-xl overflow-hidden">
                  <button
                    onClick={() => setShowPrompt(p => !p)}
                    className="w-full flex items-center justify-between px-4 py-3 bg-[hsl(var(--elevated))] text-sm font-medium hover:bg-[hsl(var(--hover))] transition-colors"
                  >
                    <span>Prompt 预览</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-2">
                      预估 Token: ~{preview.total_tokens_estimate}
                      {showPrompt ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </span>
                  </button>
                  {showPrompt && (
                    <div className="p-4 space-y-3 text-xs font-mono">
                      <PromptSection color="blue" label="System" content={preview.prompt_parts.system} />
                      <PromptSection color="green" label="Context" content={preview.prompt_parts.context} />
                      <PromptSection color="yellow" label="History"
                        content={preview.prompt_parts.history.length === 0
                          ? '(无历史对话)'
                          : preview.prompt_parts.history.map(m => `[${m.role}]: ${m.content}`).join('\n')}
                      />
                      <PromptSection color="red" label="User" content={preview.prompt_parts.user_message} />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PromptSection({ color, label, content }: { color: string; label: string; content: string }) {
  const styles: Record<string, string> = {
    blue:   'border-blue-500/30 bg-blue-500/10',
    green:  'border-green-500/30 bg-green-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    red:    'border-red-500/30 bg-red-500/10',
  }
  const dots: Record<string, string> = {
    blue: 'bg-blue-500', green: 'bg-green-500', yellow: 'bg-yellow-500', red: 'bg-red-500',
  }
  return (
    <div className={`border rounded-lg p-3 ${styles[color]}`}>
      <div className="font-semibold mb-1.5 text-xs flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${dots[color]}`} />
        {label}
      </div>
      <pre className="whitespace-pre-wrap text-xs overflow-x-auto max-h-40 text-foreground/80 leading-relaxed">{content}</pre>
    </div>
  )
}

function InlineLocator({ ctx }: { ctx: ChunkContext }) {
  const lines = ctx.file_content.split('\n')
  const start = Math.max(0, ctx.highlight_start - 3)
  const end = Math.min(lines.length, ctx.highlight_end + 2)
  return (
    <div className="border border-border rounded-lg overflow-auto max-h-48 font-mono text-xs bg-[hsl(var(--elevated))]">
      <div className="px-3 py-1.5 border-b border-border text-muted-foreground text-xs flex items-center gap-2">
        <FileCode2 size={12} />
        {ctx.file_path} · L{ctx.highlight_start}–{ctx.highlight_end}
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {lines.slice(start, end).map((line, i) => {
            const lineNum = start + i + 1
            const isHl = lineNum >= ctx.highlight_start && lineNum <= ctx.highlight_end
            return (
              <tr key={lineNum} className={cn(
                isHl
                  ? 'bg-[#7c6af7]/15 border-l-2 border-l-[#7c6af7]'
                  : 'border-l-2 border-l-transparent'
              )}>
                <td className="select-none text-right pr-2 pl-1 text-muted-foreground/50 border-r border-border w-8">{lineNum}</td>
                <td className={`pl-2 whitespace-pre ${isHl ? 'text-foreground' : 'text-foreground/75'}`}>{line}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
