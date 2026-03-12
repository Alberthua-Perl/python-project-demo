import * as Tabs from '@radix-ui/react-tabs'
import { Search, FileCode, Cpu, Zap } from 'lucide-react'
import type { SearchResult, PromptParts } from '@/types'

interface Props {
  retrieval: SearchResult[]
  prompt: PromptParts | null
  tokens: number
  streaming?: boolean
}

export default function RagPanel({ retrieval, prompt, tokens, streaming }: Props) {
  const hasData = retrieval.length > 0 || prompt !== null

  return (
    <aside className="w-[340px] shrink-0 hidden lg:flex flex-col border-l border-border bg-[hsl(var(--sidebar-bg))] overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-[hsl(var(--background))]">
        <div className="flex items-center gap-2">
          <Cpu size={13} className="text-primary" />
          <span className="text-sm font-semibold tracking-tight">RAG 过程</span>
        </div>
        {streaming && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            <span className="text-xs text-muted-foreground font-mono">检索中...</span>
          </div>
        )}
        {!streaming && tokens > 0 && (
          <span className="text-xs font-mono text-muted-foreground">~{tokens} tokens</span>
        )}
      </div>

      {/* Empty state */}
      {!hasData ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5
                          flex items-center justify-center
                          shadow-[0_4px_16px_rgba(107,92,231,0.1)]">
            <Search size={20} className="text-primary/50" strokeWidth={1.5} />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-foreground/50">等待检索</p>
            <p className="text-[11px] text-muted-foreground/40 mt-0.5 leading-relaxed">
              发送消息后<br />查看 RAG 检索过程
            </p>
          </div>
          {/* Decorative skeleton lines */}
          <div className="w-full space-y-2 mt-2 px-2">
            {[68, 45, 80, 35, 60].map((w, i) => (
              <div key={i} className="h-1.5 rounded-full bg-border/40" style={{ width: `${w}%` }} />
            ))}
          </div>
        </div>
      ) : (
        <Tabs.Root defaultValue="retrieval" className="flex-1 flex flex-col overflow-hidden">
          <Tabs.List className="flex gap-0 px-3 pt-2 pb-0 shrink-0 border-b border-border">
            <Tabs.Trigger
              value="retrieval"
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-mono border-b-2 -mb-px transition-colors
                data-[state=active]:border-primary data-[state=active]:text-foreground
                data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              <FileCode size={11} />
              结果 {retrieval.length > 0 && <span className="ml-0.5 text-primary">·{retrieval.length}</span>}
            </Tabs.Trigger>
            <Tabs.Trigger
              value="prompt"
              className="cursor-pointer flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-mono border-b-2 -mb-px transition-colors
                data-[state=active]:border-primary data-[state=active]:text-foreground
                data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground"
            >
              <Zap size={11} />
              Prompt
            </Tabs.Trigger>
          </Tabs.List>

          {/* Retrieval results */}
          <Tabs.Content value="retrieval" className="flex-1 overflow-y-auto p-3 space-y-2">
            {retrieval.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center mt-8">暂无检索结果</p>
            ) : (
              retrieval.map((r, i) => (
                <div
                  key={r.chunk_id}
                  className="card-in rounded-lg border border-border bg-[hsl(var(--elevated))] overflow-hidden"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  {/* Card header */}
                  <details className="group">
                    <summary className="flex items-center justify-between px-3 py-2.5 cursor-pointer hover:bg-[hsl(var(--hover))] gap-2 transition-colors list-none">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="shrink-0 text-xs font-mono text-primary font-bold">#{i + 1}</span>
                        <span className="font-mono text-xs text-muted-foreground truncate">{r.file_path}</span>
                      </div>
                      <span className="shrink-0 text-xs font-mono font-semibold text-primary">
                        {r.score.toFixed(2)}
                      </span>
                    </summary>
                    {/* Score bar */}
                    <div className="px-3 pb-1">
                      <div className="h-0.5 w-full bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full bar-fill"
                          style={{ width: `${Math.min(r.score * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <pre className="px-3 py-2.5 font-mono text-xs overflow-x-auto bg-[hsl(var(--sidebar-bg))] border-t border-border whitespace-pre-wrap text-foreground/75 leading-relaxed">
                      {r.content}
                    </pre>
                  </details>
                </div>
              ))
            )}
          </Tabs.Content>

          {/* Prompt parts */}
          <Tabs.Content value="prompt" className="flex-1 overflow-y-auto p-3">
            {!prompt ? (
              <p className="text-xs text-muted-foreground text-center mt-8">暂无 Prompt 数据</p>
            ) : (
              <Tabs.Root defaultValue="system" className="flex flex-col gap-2">
                <Tabs.List className="flex gap-1 flex-wrap p-1 bg-[hsl(var(--elevated))] rounded-lg shadow-inner">
                  {[
                    { value: 'system',  label: 'System' },
                    { value: 'context', label: 'Context' },
                    { value: 'history', label: `History(${prompt.history.length})` },
                    { value: 'user',    label: 'User' },
                  ].map(({ value, label }) => (
                    <Tabs.Trigger
                      key={value}
                      value={value}
                      className="cursor-pointer flex-1 px-2 py-1 rounded-md text-xs font-medium font-mono
                        data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
                        data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground
                        transition-all duration-150"
                    >
                      {label}
                    </Tabs.Trigger>
                  ))}
                </Tabs.List>
                {[
                  { value: 'system',  text: prompt.system },
                  { value: 'context', text: prompt.context },
                  { value: 'history', text: prompt.history.map(m => `[${m.role}]: ${m.content}`).join('\n') || '(无历史)' },
                  { value: 'user',    text: prompt.user_message },
                ].map(({ value, text }) => (
                  <Tabs.Content key={value} value={value}>
                    <pre className="whitespace-pre-wrap font-mono text-xs p-3 rounded-lg border border-border bg-[hsl(var(--elevated))] max-h-[60vh] overflow-y-auto text-foreground/80 leading-relaxed">
                      {text}
                    </pre>
                  </Tabs.Content>
                ))}
              </Tabs.Root>
            )}
          </Tabs.Content>
        </Tabs.Root>
      )}
    </aside>
  )
}
