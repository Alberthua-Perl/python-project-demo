import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { listRepos, listChunks, getChunkContext, getRepoStats } from '@/services/api'
import type { Repo, Chunk, ChunkContext, IndexStats } from '@/types'
import { cn } from '@/lib/utils'
import { Code2, Database, Search } from 'lucide-react'

export default function ChunksExplorer() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [repos, setRepos] = useState<Repo[]>([])
  const [repoId, setRepoId] = useState(searchParams.get('repo') ?? '')
  const [chunks, setChunks] = useState<Chunk[]>([])
  const [stats, setStats] = useState<IndexStats | null>(null)
  const [selected, setSelected] = useState<Chunk | null>(null)
  const [context, setContext] = useState<ChunkContext | null>(null)
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listRepos().then(rs => {
      const indexed = rs.filter(r => r.status === 'indexed')
      setRepos(indexed)
      if (!repoId && indexed.length > 0) setRepoId(indexed[0].repo_id)
    })
  }, [])

  useEffect(() => {
    if (!repoId) return
    setSearchParams({ repo: repoId })
    setLoading(true)
    setSelected(null)
    setContext(null)
    Promise.all([
      listChunks(repoId),
      getRepoStats(repoId),
    ]).then(([c, s]) => {
      setChunks(c.chunks)
      setStats(s)
    }).finally(() => setLoading(false))
  }, [repoId])

  const handleSelect = async (chunk: Chunk) => {
    setSelected(chunk)
    setContext(null)
    try {
      const ctx = await getChunkContext(repoId, chunk.chunk_id)
      setContext(ctx)
    } catch (e) {
      console.error(e)
    }
  }

  const filtered = filter
    ? chunks.filter(c => c.file_path.includes(filter) || c.content.includes(filter))
    : chunks

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border flex flex-col gap-3 shrink-0 bg-[hsl(var(--sidebar-bg))]">
        <h1 className="text-2xl font-semibold">代码分块浏览器</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 input-pill">
            <Database size={14} className="text-muted-foreground mr-2" />
            <select
              value={repoId}
              onChange={e => setRepoId(e.target.value)}
              className="bg-transparent border-none text-sm text-foreground py-1.5 outline-none appearance-none cursor-pointer pr-4"
            >
              {repos.map(r => <option key={r.repo_id} value={r.repo_id}>{r.name}</option>)}
            </select>
          </div>
          <div className="flex items-center bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 input-pill">
            <Search size={14} className="text-muted-foreground mr-2" />
            <input
              className="bg-transparent border-none text-sm py-1.5 outline-none text-foreground w-48"
              placeholder="按路径或内容过滤..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="px-4 py-2 border-b border-border flex gap-3 text-xs shrink-0">
          <div className="flex-1 rounded-lg bg-[hsl(var(--elevated))] px-3 py-2 text-center">
            <p className="text-muted-foreground mb-0.5">Total Chunks</p>
            <p className="font-mono font-semibold text-foreground">{stats.total_chunks}</p>
          </div>
          <div className="flex-1 rounded-lg bg-[hsl(var(--elevated))] px-3 py-2 text-center">
            <p className="text-muted-foreground mb-0.5">Files</p>
            <p className="font-mono font-semibold text-foreground">{stats.total_files}</p>
          </div>
          <div className="flex-1 rounded-lg bg-[hsl(var(--elevated))] px-3 py-2 text-center">
            <p className="text-muted-foreground mb-0.5">Embed Dim</p>
            <p className="font-mono font-semibold text-foreground">{stats.embedding_dim || '—'}</p>
          </div>
          <div className="flex-1 rounded-lg bg-[hsl(var(--elevated))] px-3 py-2 text-center">
            <p className="text-muted-foreground mb-0.5">Chunk Size</p>
            <p className="font-mono font-semibold text-foreground">{stats.chunk_size}</p>
          </div>
          <div className="flex-1 rounded-lg bg-[hsl(var(--elevated))] px-3 py-2 text-center">
            <p className="text-muted-foreground mb-0.5">Overlap</p>
            <p className="font-mono font-semibold text-foreground">{stats.chunk_overlap}</p>
          </div>
        </div>
      )}

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: chunk list */}
        <div className="w-[320px] shrink-0 border-r border-border overflow-y-auto bg-[hsl(var(--sidebar-bg))]">
          {loading && <p className="p-4 text-sm text-muted-foreground">加载中...</p>}
          {!loading && filtered.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">无 chunk 数据</p>
          )}
          {filtered.map(chunk => (
            <div
              key={chunk.chunk_id}
              onClick={() => handleSelect(chunk)}
              className={cn(
                'p-3 border-b border-border cursor-pointer transition-colors border-l-4',
                selected?.chunk_id === chunk.chunk_id
                  ? 'bg-[#7c6af7]/10 border-l-[#7c6af7]'
                  : 'border-l-transparent hover:bg-accent/50'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-mono text-[#7c6af7] truncate max-w-[180px]">
                  {chunk.file_path}
                </span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-[hsl(var(--elevated))] px-1.5 py-0.5 rounded">
                  L{chunk.line_start}–{chunk.line_end}
                </span>
              </div>
              <p className="text-xs line-clamp-2 font-mono text-muted-foreground leading-relaxed mb-2">{chunk.content}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/60">{chunk.char_count} chars</span>
                {chunk.overlap_start != null && (
                  <span className="text-[10px] text-yellow-500 dark:text-yellow-400">
                    Overlap L{chunk.overlap_start}–{chunk.overlap_end}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right: source locator */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          {!selected && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">← 点击左侧 chunk 查看原文定位</p>
            </div>
          )}
          {selected && !context && (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">加载原文...</p>
            </div>
          )}
          {context && (
            <>
              <div className="flex items-center gap-2 h-12 px-4 border-b border-border bg-[hsl(var(--elevated))] shrink-0">
                <Code2 size={14} className="text-[#7c6af7]" />
                <span className="text-sm font-medium font-mono">{context.file_path}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  L{context.highlight_start}–{context.highlight_end} · {context.total_lines} 行
                </span>
              </div>
              <div className="flex-1 overflow-auto">
                <SourceLocator context={context} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SourceLocator({ context }: { context: ChunkContext }) {
  const lines = context.file_content.split('\n')
  const { highlight_start, highlight_end } = context

  return (
    <div className="font-mono text-xs">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, i) => {
            const lineNum = i + 1
            const isHighlighted = lineNum >= highlight_start && lineNum <= highlight_end
            return (
              <tr
                key={lineNum}
                className={cn(
                  isHighlighted
                    ? 'bg-[#7c6af7]/15 border-l-2 border-l-[#7c6af7]'
                    : 'hover:bg-muted/30 border-l-2 border-l-transparent'
                )}
              >
                <td className="select-none text-right pr-3 pl-2 py-0.5 text-muted-foreground/50 border-r border-border w-10 shrink-0">
                  {lineNum}
                </td>
                <td className={`pl-3 py-0.5 whitespace-pre ${isHighlighted ? 'text-foreground' : 'text-foreground/75'}`}>
                  {line}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
