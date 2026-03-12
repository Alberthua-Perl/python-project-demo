import * as Tabs from '@radix-ui/react-tabs'
import { X, Search, FileCode, Cpu } from 'lucide-react'
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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={onClose}
        />
      )}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="RAG 过程"
        className={`fixed top-0 right-0 h-full w-[340px] z-50 flex flex-col
          bg-[hsl(var(--sidebar-bg))] border-l border-border shadow-2xl
          transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-primary" />
            <span className="font-semibold text-sm tracking-tight">RAG 过程</span>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="关闭"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {retrieval.length === 0 && !prompt ? (
            <div className="flex flex-col items-center justify-center mt-16 gap-3 text-muted-foreground">
              <Search size={28} strokeWidth={1.5} />
              <p className="text-xs text-center">发送消息后<br />查看 RAG 检索过程</p>
            </div>
          ) : (
            <>
              {retrieval.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1 mb-2">
                    <FileCode size={12} className="text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                      检索结果 · {retrieval.length} 条
                    </span>
                  </div>
                  {retrieval.map((r, i) => (
                    <details key={r.chunk_id} className="group border border-border rounded-lg overflow-hidden bg-background/40">
                      <summary className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-muted/40 gap-2 transition-colors list-none">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="shrink-0 text-xs font-mono text-primary font-semibold">#{i + 1}</span>
                          <span className="font-mono text-xs text-muted-foreground truncate">{r.file_path}</span>
                        </div>
                        <span className="shrink-0 text-xs font-mono font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          {r.score.toFixed(2)}
                        </span>
                      </summary>
                      <pre className="px-3 py-2.5 font-mono text-xs overflow-x-auto bg-muted/20 border-t border-border whitespace-pre-wrap text-foreground/80 leading-relaxed">
                        {r.content}
                      </pre>
                    </details>
                  ))}
                </div>
              )}

              {prompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      <Cpu size={12} className="text-primary" />
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                        Prompt 构成
                      </span>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">~{tokens} tokens</span>
                  </div>
                  <Tabs.Root defaultValue="system">
                    <Tabs.List className="flex gap-1 flex-wrap mb-2 p-1 bg-muted/30 rounded-lg">
                      {[
                        { value: 'system', label: 'System' },
                        { value: 'context', label: 'Context' },
                        { value: 'history', label: `History (${prompt.history.length})` },
                        { value: 'user', label: 'User' },
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
                      { value: 'system', text: prompt.system },
                      { value: 'context', text: prompt.context },
                      { value: 'history', text: prompt.history.map(m => `[${m.role}]: ${m.content}`).join('\n') || '(无历史)' },
                      { value: 'user', text: prompt.user_message },
                    ].map(({ value, text }) => (
                      <Tabs.Content key={value} value={value}>
                        <pre className="whitespace-pre-wrap font-mono text-xs p-3 rounded-lg border border-border bg-background/40 max-h-64 overflow-y-auto text-foreground/80 leading-relaxed">
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

