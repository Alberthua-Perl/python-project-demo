from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Form
from pydantic import BaseModel
from app.services import repo_service, index_service
import os
import tempfile

router = APIRouter()


class AddRepoRequest(BaseModel):
    path: str
    name: str | None = None


@router.post("/repos", status_code=201)
def add_repo(req: AddRepoRequest):
    try:
        return repo_service.add_repo(req.path, req.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/repos/upload", status_code=201)
async def upload_repo(
    file: UploadFile = File(...),
    name: str = Form(default=""),
):
    if not file.filename or not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="仅支持 .zip 格式的压缩文件")
    # Save to temp file then hand off to repo_service
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".zip")
    try:
        content = await file.read()
        tmp.write(content)
        tmp.close()
        return repo_service.add_repo_from_upload(tmp.name, name or None)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        if os.path.exists(tmp.name):
            os.remove(tmp.name)
        raise


@router.get("/repos")
def list_repos():
    return repo_service.list_repos()


@router.delete("/repos/{repo_id}", status_code=204)
def delete_repo(repo_id: str):
    if not repo_service.delete_repo(repo_id):
        raise HTTPException(status_code=404, detail="Repo not found")


@router.post("/repos/{repo_id}/index", status_code=202)
def trigger_index(repo_id: str, background_tasks: BackgroundTasks):
    repo = repo_service.get_repo(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    repo_service.update_repo(repo_id, {"status": "indexing", "error_msg": None})
    background_tasks.add_task(index_service.index_repo, repo_id)
    return {"status": "indexing", "repo_id": repo_id}


@router.get("/repos/{repo_id}/index/status")
def index_status(repo_id: str):
    repo = repo_service.get_repo(repo_id)
    if not repo:
        raise HTTPException(status_code=404, detail="Repo not found")
    return {"repo_id": repo_id, "status": repo["status"], "error_msg": repo.get("error_msg")}
