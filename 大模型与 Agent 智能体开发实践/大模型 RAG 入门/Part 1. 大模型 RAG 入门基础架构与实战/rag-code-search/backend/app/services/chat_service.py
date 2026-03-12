import json
import os
import uuid
from datetime import datetime
from typing import AsyncGenerator
from app.config.defaults import DATA_DIR
from app.config.manager import get_settings
from app.services import search_service, llm_client

SESSIONS_FILE = os.path.join(DATA_DIR, "sessions.json")


def _load_sessions() -> list[dict]:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(SESSIONS_FILE):
        return []
    with open(SESSIONS_FILE) as f:
        return json.load(f)


def _save_sessions(sessions: list[dict]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(SESSIONS_FILE, "w") as f:
        json.dump(sessions, f, indent=2)


def get_sessions() -> list[dict]:
    return _load_sessions()


def create_session(repo_id: str | None = None) -> dict:
    session = {
        "session_id": uuid.uuid4().hex[:12],
        "repo_id": repo_id,
        "created_at": datetime.utcnow().isoformat(),
        "messages": [],
    }
    sessions = _load_sessions()
    sessions.append(session)
    _save_sessions(sessions)
    return session


def get_session(session_id: str) -> dict | None:
    for s in _load_sessions():
        if s["session_id"] == session_id:
            return s
    return None


def _update_session(session_id: str, updates: dict) -> dict | None:
    sessions = _load_sessions()
    for s in sessions:
        if s["session_id"] == session_id:
            s.update(updates)
            _save_sessions(sessions)
            return s
    return None


def delete_session(session_id: str) -> bool:
    sessions = _load_sessions()
    new = [s for s in sessions if s["session_id"] != session_id]
    if len(new) == len(sessions):
        return False
    _save_sessions(new)
    return True


def estimate_tokens(text: str) -> int:
    # rough estimate: 1 token ≈ 4 chars
    return len(text) // 4


def build_prompt(message: str, session_id: str | None, repo_id: str, top_k: int | None = None) -> dict:
    settings = get_settings()
    system_prompt = settings["system_prompt"]
    k = top_k if top_k is not None else settings["top_k"]
    retrieval = search_service.search(message, repo_id, k)

    context_parts = []
    for r in retrieval["results"]:
        context_parts.append(
            f"📄 {r['file_path']} (L{r['line_start']}-{r['line_end']})\n{r['content']}"
        )
    context_str = "\n\n---\n\n".join(context_parts)

    history = []
    if session_id:
        session = get_session(session_id)
        if session:
            history = session.get("messages", [])

    prompt_parts = {
        "system": system_prompt,
        "context": context_str,
        "history": history,
        "user_message": message,
    }

    total_text = system_prompt + context_str + message
    for m in history:
        total_text += m.get("content", "")

    return {
        "prompt_parts": prompt_parts,
        "total_tokens_estimate": estimate_tokens(total_text),
        "retrieval_results": retrieval["results"],
    }


async def chat_stream(
    message: str, session_id: str, repo_id: str
) -> AsyncGenerator[dict, None]:
    settings = get_settings()
    system_prompt = settings["system_prompt"]

    session = get_session(session_id)
    if not session:
        raise ValueError(f"Session not found: {session_id}")

    # Step 1: retrieval
    retrieval = search_service.search(message, repo_id, settings["top_k"])
    yield {"type": "retrieval", "results": retrieval["results"]}

    # Step 2: build prompt
    context_parts = []
    for r in retrieval["results"]:
        context_parts.append(
            f"📄 {r['file_path']} (L{r['line_start']}-{r['line_end']})\n{r['content']}"
        )
    context_str = "\n\n---\n\n".join(context_parts)

    history = session.get("messages", [])

    prompt_parts = {
        "system": system_prompt,
        "context": context_str,
        "history": history,
        "user_message": message,
    }
    total_text = system_prompt + context_str + message
    for m in history:
        total_text += m.get("content", "")

    yield {
        "type": "prompt",
        "prompt_parts": prompt_parts,
        "total_tokens_estimate": estimate_tokens(total_text),
    }

    # Step 3: LLM stream
    messages = [{"role": "system", "content": system_prompt}]
    if context_str:
        messages.append({"role": "system", "content": f"代码上下文:\n{context_str}"})
    for m in history:
        messages.append(m)
    messages.append({"role": "user", "content": message})

    full_response = ""
    try:
        async for token in llm_client.stream_chat(messages, settings["llm_model"]):
            full_response += token
            yield {"type": "chunk", "content": token}
    except Exception as e:
        yield {"type": "error", "message": str(e)}
        return

    # Step 4: persist messages
    new_messages = history + [
        {"role": "user", "content": message},
        {"role": "assistant", "content": full_response, "rag_data": {
            "retrieval": retrieval["results"],
            "prompt_parts": prompt_parts,
            "total_tokens_estimate": estimate_tokens(total_text),
        }},
    ]
    _update_session(session_id, {"messages": new_messages})

    yield {"type": "done", "session_id": session_id}
