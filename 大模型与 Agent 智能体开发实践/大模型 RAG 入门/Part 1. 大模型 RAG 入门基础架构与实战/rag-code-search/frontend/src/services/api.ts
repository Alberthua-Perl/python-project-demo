import type {
  Repo, Chunk, ChunkContext, SearchResponse,
  PromptPreviewResponse, Session, IndexStats, Settings, SSEEvent,
} from '@/types'

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

// ── Health ──────────────────────────────────────────────
export const getHealth = () => request<{ status: string }>('/health')

// ── Settings ────────────────────────────────────────────
export const getSettings = () => request<Settings>('/settings')
export const updateSettings = (data: Partial<Settings>) =>
  request<Settings>('/settings', { method: 'PUT', body: JSON.stringify(data) })

// ── Repos ───────────────────────────────────────────────
export const listRepos = () => request<Repo[]>('/repos')
export const addRepo = (path: string, name?: string) =>
  request<Repo>('/repos', { method: 'POST', body: JSON.stringify({ path, name }) })
export async function uploadRepo(file: File, name?: string): Promise<Repo> {
  const form = new FormData()
  form.append('file', file)
  if (name) form.append('name', name)
  const res = await fetch(`${BASE}/repos/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail ?? res.statusText)
  }
  return res.json()
}
export const deleteRepo = (repo_id: string) =>
  request<void>(`/repos/${repo_id}`, { method: 'DELETE' })
export const triggerIndex = (repo_id: string) =>
  request<{ status: string; repo_id: string }>(`/repos/${repo_id}/index`, { method: 'POST' })
export const getIndexStatus = (repo_id: string) =>
  request<{ repo_id: string; status: string; error_msg: string | null }>(
    `/repos/${repo_id}/index/status`
  )

// ── Chunks ──────────────────────────────────────────────
export const listChunks = (repo_id: string) =>
  request<{ total: number; chunks: Chunk[] }>(`/repos/${repo_id}/chunks`)
export const getChunkContext = (repo_id: string, chunk_id: string) => {
  // encode # as %23 to prevent browser URL fragment truncation
  // keep / unencoded so FastAPI {chunk_id:path} can capture it
  const safeId = chunk_id.replace(/#/g, '%23')
  return request<ChunkContext>(`/repos/${repo_id}/chunks/${safeId}/context`)
}
export const getRepoStats = (repo_id: string) =>
  request<IndexStats>(`/repos/${repo_id}/stats`)

// ── Search ──────────────────────────────────────────────
export const search = (query: string, repo_id: string, top_k?: number) =>
  request<SearchResponse>('/search', {
    method: 'POST',
    body: JSON.stringify({ query, repo_id, top_k }),
  })

// ── Chat ────────────────────────────────────────────────
export const promptPreview = (message: string, repo_id: string, session_id?: string, top_k?: number) =>
  request<PromptPreviewResponse>('/chat/prompt-preview', {
    method: 'POST',
    body: JSON.stringify({ message, repo_id, session_id, top_k }),
  })

export const listSessions = () => request<Session[]>('/chat/sessions')
export const createSession = (repo_id?: string) =>
  request<Session>('/chat/sessions', {
    method: 'POST',
    body: JSON.stringify({ repo_id }),
  })
export const getSession = (session_id: string) =>
  request<Session>(`/chat/sessions/${session_id}`)
export const deleteSession = (session_id: string) =>
  request<void>(`/chat/sessions/${session_id}`, { method: 'DELETE' })

export function chatStream(
  message: string,
  session_id: string,
  repo_id: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false

  fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, session_id, repo_id }),
  })
    .then(async (res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      while (!cancelled) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6)) as SSEEvent
              onEvent(event)
            } catch {}
          }
        }
      }
    })
    .catch((err) => {
      if (!cancelled) onError?.(err)
    })

  return () => { cancelled = true }
}
