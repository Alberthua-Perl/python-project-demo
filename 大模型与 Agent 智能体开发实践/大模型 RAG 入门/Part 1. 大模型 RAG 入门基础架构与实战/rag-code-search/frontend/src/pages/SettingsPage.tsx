import { useEffect, useState } from 'react'
import { getSettings, updateSettings } from '@/services/api'
import type { Settings } from '@/types'
import {
  Cpu, Layers, Database, Save, Loader2, CheckCircle2, Eye, EyeOff, MessageSquare, RotateCcw
} from 'lucide-react'

const DEFAULT_SYSTEM_PROMPT = `你是一个代码库智能助手。根据检索到的代码片段回答用户问题。\n回答时请引用具体的文件路径和行号，保持简洁准确。`
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<Settings>>({})
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loading, setLoading] = useState(true)
  const [showLlmKey, setShowLlmKey] = useState(false)
  const [showEmbedKey, setShowEmbedKey] = useState(false)

  useEffect(() => {
    getSettings().then(s => { setForm(s); setLoading(false) }).catch(console.error)
  }, [])

  const set = (k: keyof Settings, v: string | number) =>
    setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaveState('saving')
    try {
      await updateSettings(form)
      setSaveState('saved')
      setTimeout(() => setSaveState('idle'), 2000)
    } catch {
      setSaveState('idle')
    }
  }

  if (loading) return <div className="p-6 text-muted-foreground">加载中...</div>

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        {/* Header + Save button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">系统配置</h1>
            <p className="text-sm text-muted-foreground">管理模型 API 密钥与 RAG 核心检索参数</p>
          </div>
          <button
            onClick={handleSave}
            disabled={saveState === 'saving'}
            className={cn(
              'inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all shadow-md w-32 active:scale-[0.97]',
              saveState === 'saved'
                ? 'bg-[#238636] hover:bg-[#2ea043] text-white shadow-[#238636]/20'
                : 'bg-[#7c6af7] hover:bg-[#6b5ce7] text-white shadow-[#7c6af7]/20'
            )}
          >
            {saveState === 'saving' && <Loader2 size={16} className="animate-spin" />}
            {saveState === 'saved' && <CheckCircle2 size={16} />}
            {saveState === 'idle' && <Save size={16} />}
            <span>{saveState === 'saving' ? '保存中...' : saveState === 'saved' ? '已保存' : '保存设置'}</span>
          </button>
        </div>

        {/* LLM Config */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 transition-colors hover:border-[hsl(var(--border-hover))]">
          <h2 className="text-foreground font-medium flex items-center border-b border-border pb-3 mb-4">
            <Cpu size={18} className="mr-2 text-[#7c6af7]" /> LLM 大语言模型
          </h2>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">API Key</label>
            <div className="relative">
              <input
                type={showLlmKey ? 'text' : 'password'}
                value={form.llm_api_key ?? ''}
                onChange={e => set('llm_api_key', e.target.value)}
                className="w-full bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-2 pr-10 text-foreground font-mono text-sm outline-none focus:border-[#7c6af7] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowLlmKey(!showLlmKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showLlmKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Base URL</label>
              <input type="text" value={form.llm_base_url ?? ''} onChange={e => set('llm_base_url', e.target.value)}
                className="w-full bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-2 text-foreground font-mono text-sm outline-none focus:border-[#7c6af7] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Model Name</label>
              <input type="text" value={form.llm_model ?? ''} onChange={e => set('llm_model', e.target.value)}
                className="w-full bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-2 text-foreground font-mono text-sm outline-none focus:border-[#7c6af7] transition-colors" />
            </div>
          </div>
        </div>

        {/* Embedding Config */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 transition-colors hover:border-[hsl(var(--border-hover))]">
          <h2 className="text-foreground font-medium flex items-center border-b border-border pb-3 mb-4">
            <Layers size={18} className="mr-2 text-[#3fb950]" /> Embedding 向量模型
          </h2>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">API Key</label>
            <div className="relative">
              <input
                type={showEmbedKey ? 'text' : 'password'}
                value={form.embedding_api_key ?? ''}
                onChange={e => set('embedding_api_key', e.target.value)}
                className="w-full bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-2 pr-10 text-foreground font-mono text-sm outline-none focus:border-[#7c6af7] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowEmbedKey(!showEmbedKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showEmbedKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Base URL</label>
              <input type="text" value={form.embedding_base_url ?? ''} onChange={e => set('embedding_base_url', e.target.value)}
                className="w-full bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-2 text-foreground font-mono text-sm outline-none focus:border-[#7c6af7] transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Model Name</label>
              <input type="text" value={form.embedding_model ?? ''} onChange={e => set('embedding_model', e.target.value)}
                className="w-full bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-2 text-foreground font-mono text-sm outline-none focus:border-[#7c6af7] transition-colors" />
            </div>
          </div>
        </div>

        {/* Retrieval Params */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 transition-colors hover:border-[hsl(var(--border-hover))]">
          <h2 className="text-foreground font-medium flex items-center border-b border-border pb-3 mb-4">
            <Database size={18} className="mr-2 text-[#d29922]" /> 检索与分块参数
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[hsl(var(--elevated))] p-4 rounded-lg border border-border hover:border-[#7c6af7] transition-colors focus-within:border-[#7c6af7] focus-within:ring-1 focus-within:ring-[#7c6af7]/50">
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Chunk Size</label>
              <input type="number" value={form.chunk_size ?? 1000} onChange={e => set('chunk_size', Number(e.target.value))}
                className="w-full bg-transparent border-none text-foreground font-mono text-xl outline-none" />
            </div>
            <div className="bg-[hsl(var(--elevated))] p-4 rounded-lg border border-border hover:border-[#7c6af7] transition-colors focus-within:border-[#7c6af7] focus-within:ring-1 focus-within:ring-[#7c6af7]/50">
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Chunk Overlap</label>
              <input type="number" value={form.chunk_overlap ?? 200} onChange={e => set('chunk_overlap', Number(e.target.value))}
                className="w-full bg-transparent border-none text-foreground font-mono text-xl outline-none" />
            </div>
            <div className="bg-[hsl(var(--elevated))] p-4 rounded-lg border border-border hover:border-[#7c6af7] transition-colors focus-within:border-[#7c6af7] focus-within:ring-1 focus-within:ring-[#7c6af7]/50">
              <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Top-K</label>
              <input type="number" value={form.top_k ?? 5} onChange={e => set('top_k', Number(e.target.value))}
                className="w-full bg-transparent border-none text-foreground font-mono text-xl outline-none" />
            </div>
          </div>
        </div>

        {/* System Prompt */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-5 transition-colors hover:border-[hsl(var(--border-hover))]">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
            <h2 className="text-foreground font-medium flex items-center">
              <MessageSquare size={18} className="mr-2 text-[#e5534b]" /> 系统提示词
            </h2>
            <button
              type="button"
              onClick={() => set('system_prompt', DEFAULT_SYSTEM_PROMPT)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw size={14} /> 恢复默认
            </button>
          </div>
          <textarea
            value={form.system_prompt ?? ''}
            onChange={e => set('system_prompt', e.target.value)}
            rows={5}
            className="w-full bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 py-2 text-foreground text-sm outline-none focus:border-[#7c6af7] transition-colors resize-y"
          />
          <p className="text-xs text-muted-foreground">自定义发送给 LLM 的系统提示词，影响所有对话的回答风格与行为</p>
        </div>
      </div>
    </div>
  )
}
