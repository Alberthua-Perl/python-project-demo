import json
import os
import uuid
import zipfile
import shutil
from datetime import datetime
from app.config.defaults import DATA_DIR

REPOS_FILE = os.path.join(DATA_DIR, "repos.json")
UPLOADS_DIR = os.path.join(DATA_DIR, "uploads")


def _load_repos() -> list[dict]:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(REPOS_FILE):
        return []
    with open(REPOS_FILE, "r") as f:
        return json.load(f)


def _save_repos(repos: list[dict]) -> None:
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(REPOS_FILE, "w") as f:
        json.dump(repos, f, indent=2)


def add_repo(path: str, name: str | None = None) -> dict:
    path = os.path.abspath(path)
    if not os.path.isdir(path):
        raise ValueError(f"Path does not exist or is not a directory: {path}")
    repos = _load_repos()
    for r in repos:
        if r["path"] == path:
            raise ValueError(f"Repo already exists: {path}")
    repo = {
        "repo_id": uuid.uuid4().hex[:8],
        "name": name or os.path.basename(path),
        "path": path,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "file_count": 0,
        "chunk_count": 0,
        "error_msg": None,
    }
    repos.append(repo)
    _save_repos(repos)
    return repo


def add_repo_from_upload(zip_path: str, name: str | None = None) -> dict:
    """Extract uploaded zip to uploads dir and register as a repo."""
    repo_id = uuid.uuid4().hex[:8]
    extract_dir = os.path.join(UPLOADS_DIR, repo_id)
    os.makedirs(extract_dir, exist_ok=True)
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(extract_dir)
    except zipfile.BadZipFile:
        shutil.rmtree(extract_dir, ignore_errors=True)
        raise ValueError("上传的文件不是有效的 zip 压缩包")
    finally:
        os.remove(zip_path)

    # If zip contains a single top-level folder, use that as the repo root
    entries = os.listdir(extract_dir)
    if len(entries) == 1 and os.path.isdir(os.path.join(extract_dir, entries[0])):
        repo_path = os.path.join(extract_dir, entries[0])
    else:
        repo_path = extract_dir

    default_name = name or os.path.basename(repo_path)
    repo = {
        "repo_id": repo_id,
        "name": default_name,
        "path": repo_path,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat(),
        "file_count": 0,
        "chunk_count": 0,
        "error_msg": None,
        "source": "upload",
    }
    repos = _load_repos()
    repos.append(repo)
    _save_repos(repos)
    return repo


def list_repos() -> list[dict]:
    return _load_repos()


def get_repo(repo_id: str) -> dict | None:
    for r in _load_repos():
        if r["repo_id"] == repo_id:
            return r
    return None


def update_repo(repo_id: str, updates: dict) -> dict | None:
    repos = _load_repos()
    for r in repos:
        if r["repo_id"] == repo_id:
            r.update(updates)
            _save_repos(repos)
            return r
    return None


def delete_repo(repo_id: str) -> bool:
    repos = _load_repos()
    target = None
    new_repos = []
    for r in repos:
        if r["repo_id"] == repo_id:
            target = r
        else:
            new_repos.append(r)
    if not target:
        return False
    _save_repos(new_repos)
    # clean up chunk file
    chunks_file = os.path.join(DATA_DIR, f"{repo_id}_chunks.json")
    if os.path.exists(chunks_file):
        os.remove(chunks_file)
    # clean up uploaded files
    upload_dir = os.path.join(UPLOADS_DIR, repo_id)
    if os.path.isdir(upload_dir):
        shutil.rmtree(upload_dir, ignore_errors=True)
    return True


def scan_files(repo_path: str) -> list[str]:
    py_files = []
    for root, dirs, files in os.walk(repo_path):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d not in ("__pycache__", "node_modules", ".venv", "venv")]
        for f in files:
            if f.endswith(".py"):
                py_files.append(os.path.join(root, f))
    return py_files
