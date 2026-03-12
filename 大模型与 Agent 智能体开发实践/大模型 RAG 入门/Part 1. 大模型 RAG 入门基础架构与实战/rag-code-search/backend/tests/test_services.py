from app.services.index_service import chunk_text


def test_chunk_text_basic():
    content = "line1\nline2\nline3\nline4\nline5\n"
    chunks = chunk_text(content, "test.py", "repo1", chunk_size=20, overlap=5)
    assert len(chunks) >= 1
    for c in chunks:
        assert c["chunk_id"].startswith("repo1/test.py#")
        assert c["file_path"] == "test.py"
        assert c["repo_id"] == "repo1"
        assert c["line_start"] >= 1
        assert c["line_end"] >= c["line_start"]
        assert c["char_count"] > 0


def test_chunk_text_overlap_marker():
    content = "a" * 50 + "\n" + "b" * 50 + "\n" + "c" * 50 + "\n"
    chunks = chunk_text(content, "f.py", "r1", chunk_size=60, overlap=10)
    assert len(chunks) >= 2
    # second chunk should have overlap_start set
    if len(chunks) > 1:
        assert chunks[1]["overlap_start"] is not None


def test_chunk_text_single_chunk():
    content = "short content\n"
    chunks = chunk_text(content, "f.py", "r1", chunk_size=1000, overlap=200)
    assert len(chunks) == 1
    assert chunks[0]["chunk_index"] == 0
    assert chunks[0]["overlap_start"] is None


def test_chunk_text_ids_unique():
    content = "\n".join([f"line {i}" for i in range(100)]) + "\n"
    chunks = chunk_text(content, "f.py", "r1", chunk_size=100, overlap=20)
    ids = [c["chunk_id"] for c in chunks]
    assert len(ids) == len(set(ids))


def test_scan_files(tmp_path):
    from app.services.repo_service import scan_files
    (tmp_path / "a.py").write_text("x=1")
    (tmp_path / "b.txt").write_text("hello")
    sub = tmp_path / "sub"
    sub.mkdir()
    (sub / "c.py").write_text("y=2")
    files = scan_files(str(tmp_path))
    assert len(files) == 2
    assert all(f.endswith(".py") for f in files)


def test_get_chunk_context(tmp_path, monkeypatch):
    import app.config.defaults as defaults
    import app.services.repo_service as rs
    monkeypatch.setattr(defaults, "DATA_DIR", str(tmp_path))
    monkeypatch.setattr(rs, "REPOS_FILE", str(tmp_path / "repos.json"))

    repo_dir = tmp_path / "proj"
    repo_dir.mkdir()
    (repo_dir / "main.py").write_text("def foo():\n    pass\n")

    repo = rs.add_repo(str(repo_dir))
    repo_id = repo["repo_id"]

    from app.services.index_service import chunk_text, _save_chunks, get_chunk_context
    monkeypatch.setattr(defaults, "DATA_DIR", str(tmp_path))
    chunks = chunk_text("def foo():\n    pass\n", "main.py", repo_id, 1000, 200)
    _save_chunks(repo_id, chunks)

    ctx = get_chunk_context(repo_id, chunks[0]["chunk_id"])
    assert ctx["file_path"] == "main.py"
    assert "def foo" in ctx["file_content"]
    assert ctx["highlight_start"] == chunks[0]["line_start"]
    assert ctx["highlight_end"] == chunks[0]["line_end"]
