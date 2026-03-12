import { useEffect, useState, useRef } from 'react'
import { listRepos, addRepo, uploadRepo, deleteRepo, triggerIndex, getIndexStatus } from '@/services/api'
import type { Repo } from '@/types'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  HardDrive, FileCode2, Terminal, FolderOpen, Loader2,
  RefreshCw, Layers, Trash2, Play
} from 'lucide-react'

type AddMode = 'local' | 'upload'

export default function RepoManager() {
  const [repos, setRepos] = useState<Repo[]>([])
  const [path, setPath] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [adding, setAdding] = useState(false)
  const [mode, setMode] = useState<AddMode>('local')
  const [zipFile, setZipFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRefs = useRef<Record<string, ReturnType<typeof setInterval>>>({})
  const navigate = useNavigate()

  const load = () => listRepos().then(setRepos).catch(console.error)

  useEffect(() => {
    load()
    return () => Object.values(pollRefs.current).forEach(clearInterval)
  }, [])

  const startPolling = (repo_id: string) => {
    if (pollRefs.current[repo_id]) return
    pollRefs.current[repo_id] = setInterval(async () => {
      const s = await getIndexStatus(repo_id).catch(() => null)
      if (!s) return
      setRepos(rs => rs.map(r => r.repo_id === repo_id
        ? { ...r, status: s.status as Repo['status'], error_msg: s.error_msg }
        : r))
      if (s.status === 'indexed' || s.status === 'error') {
        clearInterval(pollRefs.current[repo_id])
        delete pollRefs.current[repo_id]
        load()
      }
    }, 1500)
  }
  const handleAdd = async () => {
    setError('')
    if (mode === 'local') {
      if (!path.trim()) return
      setAdding(true)
      try {
        const repo = await addRepo(path.trim(), name.trim() || undefined)
        setRepos(rs => [...rs, repo])
        setPath('')
        setName('')
      } catch (e: any) {
        setError(e.message)
      } finally {
        setAdding(false)
      }
    } else {
      if (!zipFile) return
      setAdding(true)
      try {
        const repo = await uploadRepo(zipFile, name.trim() || undefined)
        setRepos(rs => [...rs, repo])
        setZipFile(null)
        setName('')
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch (e: any) {
        setError(e.message)
      } finally {
        setAdding(false)
      }
    }
  }

  const handleIndex = async (repo_id: string) => {
    await triggerIndex(repo_id)
    setRepos(rs => rs.map(r => r.repo_id === repo_id ? { ...r, status: 'indexing' } : r))
    startPolling(repo_id)
  }

  const handleDelete = async (repo_id: string) => {
    if (!confirm('确认删除该代码库？')) return
    await deleteRepo(repo_id)
    setRepos(rs => rs.filter(r => r.repo_id !== repo_id))
  }

  const statusBadge = (s: Repo['status']) => {
    const cls: Record<string, string> = {
      pending:  'bg-muted text-muted-foreground border border-border',
      indexing: 'bg-[#7c6af7]/10 text-[#7c6af7] border border-[#7c6af7]/30 animate-pulse',
      indexed:  'bg-green-500/15 text-green-500 dark:text-green-400 border border-green-500/30',
      error:    'bg-red-500/15 text-red-500 dark:text-red-400 border border-red-500/30',
    }
    const label: Record<string, string> = {
      pending: '待索引', indexing: '索引中...', indexed: '已完成', error: '失败',
    }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls[s]}`}>{label[s]}</span>
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-semibold mb-2">知识库管理</h1>
          <p className="text-muted-foreground text-sm">连接你的本地代码仓库或上传 ZIP 归档，系统将自动进行分块与向量化索引。</p>
        </div>

        {/* Input card */}
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          {/* Tab switcher */}
          <div className="flex border-b border-border">
            <button
              onClick={() => { setMode('local'); setError('') }}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                mode === 'local'
                  ? 'border-[#7c6af7] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              本地路径直连
            </button>
            <button
              onClick={() => { setMode('upload'); setError('') }}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                mode === 'upload'
                  ? 'border-[#7c6af7] text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              ZIP 压缩包上传
            </button>
          </div>

          <div className="p-6">
            {mode === 'local' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-muted-foreground">本地仓库绝对路径</label>
                <div className="flex gap-3">
                  <div className="flex-1 flex items-center bg-[hsl(var(--elevated))] border border-border rounded-lg px-3 input-pill">
                    <HardDrive size={16} className="text-muted-foreground mr-2 shrink-0" />
                    <input
                      type="text"
                      className="flex-1 bg-transparent border-none outline-none text-foreground py-2 font-mono text-sm"
                      placeholder="e.g. /Users/dev/projects/my-app"
                      value={path}
                      onChange={e => setPath(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    />
                  </div>
                  <input
                    className="w-32 border border-border rounded-lg px-3 py-2 text-sm bg-[hsl(var(--elevated))] focus:outline-none focus:border-[#7c6af7] transition-colors"
                    placeholder="名称（可选）"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  <button
                    onClick={handleAdd}
                    disabled={adding || !path.trim()}
                    className="px-5 py-2 bg-[#7c6af7] text-white rounded-lg text-sm font-medium hover:bg-[#6b5ce7] disabled:opacity-50 transition-colors active:scale-[0.97]"
                  >
                    {adding ? <Loader2 size={16} className="animate-spin" /> : '添加并索引'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-border hover:border-[#7c6af7] transition-colors rounded-lg p-8 cursor-pointer bg-[hsl(var(--elevated))]/50"
                >
                  <FolderOpen size={32} className="text-muted-foreground" />
                  {zipFile ? (
                    <span className="text-sm font-medium text-foreground">{zipFile.name} ({(zipFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-foreground">点击选择或拖拽 ZIP 文件到此处</p>
                      <p className="text-xs text-muted-foreground">最大支持 500MB</p>
                    </>
                  )}
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".zip"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) setZipFile(f)
                  }}
                />
                <div className="flex gap-3">
                  <input
                    className="w-48 border border-border rounded-lg px-3 py-2 text-sm bg-[hsl(var(--elevated))] focus:outline-none focus:border-[#7c6af7] transition-colors"
                    placeholder="名称（可选）"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                  <button
                    onClick={handleAdd}
                    disabled={adding || !zipFile}
                    className="px-5 py-2 bg-[#7c6af7] text-white rounded-lg text-sm font-medium hover:bg-[#6b5ce7] disabled:opacity-50 transition-colors active:scale-[0.97]"
                  >
                    {adding ? <Loader2 size={16} className="animate-spin" /> : '上传并添加'}
                  </button>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-destructive mt-3">{error}</p>}
          </div>
        </div>

        {/* Repo list */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium">已连接的仓库 ({repos.length})</h2>
          {repos.length === 0 && (
            <p className="text-sm text-muted-foreground">暂无代码库，请添加本地路径或上传 ZIP 文件。</p>
          )}
          <div className="grid gap-3">
            {repos.map(repo => (
              <div key={repo.repo_id} className="group bg-card border border-border rounded-lg p-4 flex items-center justify-between hover:border-[hsl(var(--border-hover))] transition-colors">
                <div className="flex items-center gap-4">
                  {/* Icon box */}
                  <div className="w-10 h-10 rounded-md bg-[hsl(var(--elevated))] border border-border flex items-center justify-center shrink-0">
                    {repo.source === 'upload'
                      ? <FileCode2 size={18} className="text-[#7c6af7]" />
                      : <Terminal size={18} className="text-muted-foreground" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{repo.name}</span>
                      {repo.source === 'upload' && (
                        <span className="px-1.5 py-0.5 rounded text-xs bg-[#7c6af7]/10 text-[#7c6af7] border border-[#7c6af7]/30">上传</span>
                      )}
                      {statusBadge(repo.status)}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono flex items-center gap-3">
                      <span>{repo.path}</span>
                      {repo.status === 'indexed' && (
                        <><span>·</span><span>{repo.file_count} 个文件</span><span>·</span><span>{repo.chunk_count} 个分块</span></>
                      )}
                    </div>
                    {repo.error_msg && <p className="text-xs text-destructive mt-1">{repo.error_msg}</p>}
                  </div>
                </div>
                {/* Action buttons — hover reveal */}
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {repo.status === 'indexed' && (
                    <button
                      onClick={() => navigate(`/chunks?repo=${repo.repo_id}`)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent transition-colors"
                    >
                      <Layers size={13} /> 查看分块
                    </button>
                  )}
                  <button
                    onClick={() => handleIndex(repo.repo_id)}
                    disabled={repo.status === 'indexing'}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"
                  >
                    {repo.status === 'indexing'
                      ? <><Loader2 size={13} className="animate-spin" /> 索引中</>
                      : <><RefreshCw size={13} /> {repo.status === 'indexed' ? '重新索引' : '开始索引'}</>}
                  </button>
                  <button
                    onClick={() => handleDelete(repo.repo_id)}
                    className="p-1.5 border border-border rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
