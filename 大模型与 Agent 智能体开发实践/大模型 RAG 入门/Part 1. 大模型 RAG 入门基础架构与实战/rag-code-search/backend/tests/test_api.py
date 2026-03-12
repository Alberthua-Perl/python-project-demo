def test_health(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_get_settings_defaults(client):
    r = client.get("/api/settings")
    assert r.status_code == 200
    data = r.json()
    assert "llm_model" in data
    assert "chunk_size" in data
    assert data["chunk_size"] == 1000


def test_update_settings(client):
    r = client.put("/api/settings", json={"top_k": 10, "chunk_size": 500})
    assert r.status_code == 200
    data = r.json()
    assert data["top_k"] == 10
    assert data["chunk_size"] == 500


def test_add_repo(client, sample_repo):
    r = client.post("/api/repos", json={"path": sample_repo})
    assert r.status_code == 201
    data = r.json()
    assert data["status"] == "pending"
    assert data["repo_id"]
    assert data["name"] == "sample_project"


def test_add_repo_invalid_path(client):
    r = client.post("/api/repos", json={"path": "/nonexistent/path/xyz"})
    assert r.status_code == 400


def test_add_repo_duplicate(client, sample_repo):
    client.post("/api/repos", json={"path": sample_repo})
    r = client.post("/api/repos", json={"path": sample_repo})
    assert r.status_code == 400


def test_list_repos(client, sample_repo):
    client.post("/api/repos", json={"path": sample_repo})
    r = client.get("/api/repos")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_delete_repo(client, sample_repo):
    add = client.post("/api/repos", json={"path": sample_repo})
    repo_id = add.json()["repo_id"]
    r = client.delete(f"/api/repos/{repo_id}")
    assert r.status_code == 204
    assert client.get("/api/repos").json() == []


def test_delete_repo_not_found(client):
    r = client.delete("/api/repos/nonexistent")
    assert r.status_code == 404


def test_index_status_not_found(client):
    r = client.get("/api/repos/nonexistent/index/status")
    assert r.status_code == 404


def test_create_and_get_session(client):
    r = client.post("/api/chat/sessions", json={})
    assert r.status_code == 201
    sid = r.json()["session_id"]
    r2 = client.get(f"/api/chat/sessions/{sid}")
    assert r2.status_code == 200
    assert r2.json()["session_id"] == sid


def test_delete_session(client):
    r = client.post("/api/chat/sessions", json={})
    sid = r.json()["session_id"]
    r2 = client.delete(f"/api/chat/sessions/{sid}")
    assert r2.status_code == 204


def test_list_sessions(client):
    client.post("/api/chat/sessions", json={})
    client.post("/api/chat/sessions", json={})
    r = client.get("/api/chat/sessions")
    assert r.status_code == 200
    assert len(r.json()) == 2
