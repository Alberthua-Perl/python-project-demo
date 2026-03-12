from fastapi import APIRouter, HTTPException
from app.services import index_service

router = APIRouter()


@router.get("/repos/{repo_id}/chunks")
def list_chunks(repo_id: str):
    chunks = index_service.get_chunks(repo_id)
    return {"total": len(chunks), "chunks": chunks}


@router.get("/repos/{repo_id}/chunks/{chunk_id:path}/context")
def chunk_context(repo_id: str, chunk_id: str):
    try:
        return index_service.get_chunk_context(repo_id, chunk_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/repos/{repo_id}/stats")
def repo_stats(repo_id: str):
    return index_service.get_stats(repo_id)
