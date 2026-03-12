from fastapi import APIRouter
from pydantic import BaseModel
from app.config.manager import get_settings, update_settings

router = APIRouter()


class SettingsUpdate(BaseModel):
    llm_api_key: str | None = None
    llm_base_url: str | None = None
    llm_model: str | None = None
    embedding_api_key: str | None = None
    embedding_base_url: str | None = None
    embedding_model: str | None = None
    chunk_size: int | None = None
    chunk_overlap: int | None = None
    top_k: int | None = None
    system_prompt: str | None = None


@router.get("/settings")
def get_settings_endpoint():
    s = get_settings()
    # mask api keys
    result = dict(s)
    if result.get("llm_api_key"):
        result["llm_api_key"] = result["llm_api_key"][:8] + "****"
    if result.get("embedding_api_key"):
        result["embedding_api_key"] = result["embedding_api_key"][:8] + "****"
    return result


@router.put("/settings")
def update_settings_endpoint(req: SettingsUpdate):
    partial = {
        k: v for k, v in req.model_dump().items()
        if v is not None and "****" not in str(v)
    }
    return update_settings(partial)


@router.get("/health")
def health_check():
    return {"status": "ok", "version": "2.0.0"}
