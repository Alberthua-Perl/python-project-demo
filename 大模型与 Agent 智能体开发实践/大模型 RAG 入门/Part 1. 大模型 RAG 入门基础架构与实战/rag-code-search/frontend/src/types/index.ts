export interface Repo {
  repo_id: string
  name: string
  path: string
  status: 'pending' | 'indexing' | 'indexed' | 'error'
  created_at: string
  file_count: number
  chunk_count: number
  error_msg: string | null
  source?: 'upload' | 'local'
}

export interface Chunk {
  chunk_id: string
  repo_id: string
  content: string
  file_path: string
  line_start: number
  line_end: number
  char_count: number
  chunk_index: number
  overlap_start: number | null
  overlap_end: number | null
}

export interface ChunkContext {
  chunk: Chunk
  file_content: string
  file_path: string
  total_lines: number
  highlight_start: number
  highlight_end: number
}

export interface SearchResult {
  chunk_id: string
  content: string
  file_path: string
  line_start: number
  line_end: number
  score: number
  distance: number
}

export interface SearchResponse {
  query_embedding_preview: number[]
  results: SearchResult[]
  total_searched: number
}

export interface PromptParts {
  system: string
  context: string
  history: { role: string; content: string }[]
  user_message: string
}

export interface PromptPreviewResponse {
  prompt_parts: PromptParts
  total_tokens_estimate: number
  retrieval_results: SearchResult[]
}

export interface SessionMessage {
  role: string
  content: string
  rag_data?: {
    retrieval: SearchResult[]
    prompt_parts: PromptParts
    total_tokens_estimate: number
  }
}

export interface Session {
  session_id: string
  repo_id: string | null
  created_at: string
  updated_at?: string
  messages: SessionMessage[]
}

export interface IndexStats {
  total_chunks: number
  total_files: number
  embedding_dim: number
  chunk_size: number
  chunk_overlap: number
  file_distribution: { file_path: string; chunk_count: number }[]
}

export interface Settings {
  llm_api_key: string
  llm_base_url: string
  llm_model: string
  embedding_api_key: string
  embedding_base_url: string
  embedding_model: string
  chunk_size: number
  chunk_overlap: number
  top_k: number
  system_prompt: string
}

export type SSEEvent =
  | { type: 'retrieval'; results: SearchResult[] }
  | { type: 'prompt'; prompt_parts: PromptParts; total_tokens_estimate: number }
  | { type: 'chunk'; content: string }
  | { type: 'done'; session_id: string }
