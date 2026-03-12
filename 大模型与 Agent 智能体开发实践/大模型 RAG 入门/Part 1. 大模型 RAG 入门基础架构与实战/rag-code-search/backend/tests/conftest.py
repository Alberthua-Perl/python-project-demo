import pytest
import os
import tempfile
from fastapi.testclient import TestClient


@pytest.fixture
def tmp_data_dir(monkeypatch, tmp_path):
    """Redirect DATA_DIR to a temp directory for all tests."""
    import app.config.defaults as defaults
    import app.config.manager as manager
    import app.services.repo_service as rs
    import app.services.chat_service as cs
    import app.services.index_service as idx

    monkeypatch.setattr(defaults, "DATA_DIR", str(tmp_path))
    monkeypatch.setattr(defaults, "SETTINGS_FILE", str(tmp_path / "settings.json"))
    monkeypatch.setattr(manager, "SETTINGS_FILE", str(tmp_path / "settings.json"))
    monkeypatch.setattr(manager, "DATA_DIR", str(tmp_path))
    monkeypatch.setattr(rs, "REPOS_FILE", str(tmp_path / "repos.json"))
    monkeypatch.setattr(cs, "SESSIONS_FILE", str(tmp_path / "sessions.json"))
    monkeypatch.setattr(idx, "DATA_DIR", str(tmp_path))
    return tmp_path


@pytest.fixture
def client(tmp_data_dir):
    from app.main import app
    return TestClient(app)


@pytest.fixture
def sample_repo(tmp_path):
    """Create a small Python project for testing."""
    repo_dir = tmp_path / "sample_project"
    repo_dir.mkdir()
    (repo_dir / "main.py").write_text(
        "def main():\n    print('hello')\n\nif __name__ == '__main__':\n    main()\n"
    )
    (repo_dir / "utils.py").write_text(
        "def add(a, b):\n    return a + b\n\ndef subtract(a, b):\n    return a - b\n"
    )
    return str(repo_dir)
