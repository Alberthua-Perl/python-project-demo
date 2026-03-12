from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services import search_service

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    repo_id: str
    top_k: int | None = None


@router.post("/search")
def search(req: SearchRequest):
    try:
        return search_service.search(req.query, req.repo_id, req.top_k)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
