import json
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.services import chat_service

router = APIRouter()


class PromptPreviewRequest(BaseModel):
    message: str
    session_id: str | None = None
    repo_id: str
    top_k: int | None = None


class ChatRequest(BaseModel):
    message: str
    session_id: str
    repo_id: str


class CreateSessionRequest(BaseModel):
    repo_id: str | None = None


@router.post("/chat/prompt-preview")
def prompt_preview(req: PromptPreviewRequest):
    try:
        return chat_service.build_prompt(req.message, req.session_id, req.repo_id, req.top_k)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/chat")
async def chat_sse(req: ChatRequest):
    # validate session exists before starting stream
    if not chat_service.get_session(req.session_id):
        raise HTTPException(status_code=404, detail=f"Session not found: {req.session_id}")

    async def event_generator():
        async for event in chat_service.chat_stream(
            req.message, req.session_id, req.repo_id
        ):
            yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/chat/sessions")
def list_sessions():
    return chat_service.get_sessions()


@router.post("/chat/sessions", status_code=201)
def create_session(req: CreateSessionRequest):
    return chat_service.create_session(req.repo_id)


@router.get("/chat/sessions/{session_id}")
def get_session(session_id: str):
    session = chat_service.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.delete("/chat/sessions/{session_id}", status_code=204)
def delete_session(session_id: str):
    if not chat_service.delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
