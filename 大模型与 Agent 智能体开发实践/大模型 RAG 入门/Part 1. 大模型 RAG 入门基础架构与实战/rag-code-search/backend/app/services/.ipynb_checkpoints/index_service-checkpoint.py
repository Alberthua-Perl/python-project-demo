import json
import os
from app.config.defaults import DATA_DIR
from app.config.manager import get_settings
from app.services import repo_service, llm_client


def _chunks_file(repo_id: str) -> str:
    return os.path.join(DATA_DIR, f"{repo_id}_chunks.json")


def _load_chunks(repo_id: str) -> list[dict]:
    f = _chunks_file(repo_id)
    if not os.path.exists(f):
        return []
    with open(f) as fh:
        return json.load(fh)


def _save_chunks(repo_id: str, chunks: list[dict]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(_chunks_file(repo_id), "w") as fh:
        json.dump(chunks, fh, indent=2)


def chunk_text(content: str, file_path: str, repo_id: str,
               chunk_size: int, overlap: int) -> list[dict]:
    lines = content.splitlines(keepends=True)
    chunks = []
    char_pos = 0
    line_starts = []  # char offset of each line start
    pos = 0
    for line in lines:
        line_starts.append(pos)
        pos += len(line)
    line_starts.append(pos)  # sentinel

    def char_to_line(char_offset: int) -> int:
        for i, ls in enumerate(line_starts):
            if ls > char_offset:
                return i  # 1-based line number
        return len(lines)

    chunk_index = 0
    start_char = 0
    while start_char < len(content):
        end_char = min(start_char + chunk_size, len(content))
        # extend to line boundary
        if end_char < len(content):
            newline_pos = content.find("\n", end_char)
            if newline_pos != -1:
                end_char = newline_pos + 1

        chunk_content = content[start_char:end_char]
        line_start = char_to_line(start_char)
        line_end = char_to_line(end_char - 1)

        # overlap markers
        overlap_start = None
        overlap_end = None
        if chunk_index > 0:
            overlap_end_char = start_char + overlap
            overlap_start = line_start
            overlap_end = char_to_line(min(overlap_end_char, end_char) - 1)

        chunk_id = f"{repo_id}/{file_path}#{chunk_index}"
        chunks.append({
            "chunk_id": chunk_id,
            "repo_id": repo_id,
            "content": chunk_content,
            "file_path": file_path,
            "line_start": line_start,
            "line_end": line_end,
            "char_count": len(chunk_content),
            "chunk_index": chunk_index,
            "overlap_start": overlap_start,
            "overlap_end": overlap_end,
        })

        if end_char >= len(content):
            break
        next_start = end_char - overlap
        if next_start <= start_char:
            next_start = start_char + max(1, chunk_size - overlap)
        start_char = next_start
        chunk_index += 1

    return chunks


def index_repo(repo_id: str) -> None:
    repo = repo_service.get_repo(repo_id)
    if not repo:
        return
    try:
        settings = get_settings()
        files = repo_service.scan_files(repo["path"])
        all_chunks = []
        for abs_path in files:
            rel_path = os.path.relpath(abs_path, repo["path"])
            try:
                with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
            except Exception:
                continue
            file_chunks = chunk_text(
                content, rel_path, repo_id,
                settings["chunk_size"], settings["chunk_overlap"]
            )
            all_chunks.extend(file_chunks)

        _save_chunks(repo_id, all_chunks)

        # embed and store in ChromaDB
        import chromadb
        chroma_path = os.path.join(DATA_DIR, "chroma")
        client = chromadb.PersistentClient(path=chroma_path)
        collection_name = f"repo_{repo_id}"
        try:
            client.delete_collection(collection_name)
        except Exception:
            pass
        collection = client.create_collection(
            collection_name,
            metadata={"hnsw:space": "cosine"},
        )

        batch_size = 6
        for i in range(0, len(all_chunks), batch_size):
            batch = all_chunks[i:i + batch_size]
            texts = [c["content"] for c in batch]
            ids = [c["chunk_id"] for c in batch]
            metadatas = [{
                "file_path": c["file_path"],
                "line_start": c["line_start"],
                "line_end": c["line_end"],
                "chunk_index": c["chunk_index"],
            } for c in batch]
            embeddings = llm_client.embed_texts(texts)
            collection.add(ids=ids, embeddings=embeddings,
                           documents=texts, metadatas=metadatas)

        repo_service.update_repo(repo_id, {
            "status": "indexed",
            "file_count": len(files),
            "chunk_count": len(all_chunks),
        })
    except Exception as e:
        repo_service.update_repo(repo_id, {"status": "error", "error_msg": str(e)})


def get_chunks(repo_id: str) -> list[dict]:
    return _load_chunks(repo_id)


def get_chunk(repo_id: str, chunk_id: str) -> dict | None:
    for c in _load_chunks(repo_id):
        if c["chunk_id"] == chunk_id:
            return c
    return None


def get_chunk_context(repo_id: str, chunk_id: str) -> dict:
    chunk = get_chunk(repo_id, chunk_id)
    if not chunk:
        raise ValueError(f"Chunk not found: {chunk_id}")
    repo = repo_service.get_repo(repo_id)
    if not repo:
        raise ValueError(f"Repo not found: {repo_id}")
    abs_path = os.path.join(repo["path"], chunk["file_path"])
    try:
        with open(abs_path, "r", encoding="utf-8", errors="ignore") as f:
            file_content = f.read()
    except Exception as e:
        raise ValueError(f"Cannot read file: {e}")
    total_lines = len(file_content.splitlines())
    return {
        "chunk": chunk,
        "file_content": file_content,
        "file_path": chunk["file_path"],
        "total_lines": total_lines,
        "highlight_start": chunk["line_start"],
        "highlight_end": chunk["line_end"],
    }


def get_stats(repo_id: str) -> dict:
    chunks = _load_chunks(repo_id)
    settings = get_settings()
    file_dist: dict[str, int] = {}
    for c in chunks:
        file_dist[c["file_path"]] = file_dist.get(c["file_path"], 0) + 1

    # get embedding dim from first chunk if available
    embedding_dim = 0
    try:
        import chromadb
        chroma_path = os.path.join(DATA_DIR, "chroma")
        client = chromadb.PersistentClient(path=chroma_path)
        col = client.get_collection(f"repo_{repo_id}")
        result = col.get(limit=1, include=["embeddings"])
        embs = result["embeddings"]
        if embs is not None and len(embs) > 0:
            embedding_dim = len(embs[0])
    except Exception:
        pass

    return {
        "total_chunks": len(chunks),
        "total_files": len(file_dist),
        "embedding_dim": embedding_dim,
        "chunk_size": settings["chunk_size"],
        "chunk_overlap": settings["chunk_overlap"],
        "file_distribution": [
            {"file_path": fp, "chunk_count": cnt}
            for fp, cnt in sorted(file_dist.items(), key=lambda x: -x[1])
        ],
    }
