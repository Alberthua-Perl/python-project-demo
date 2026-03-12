import json
import os
from app.config.defaults import DEFAULT_SETTINGS
from app.config.defaults import SETTINGS_FILE as _DEFAULT_SETTINGS_FILE
from app.config.defaults import DATA_DIR as _DEFAULT_DATA_DIR

# module-level vars so tests can monkeypatch them
SETTINGS_FILE = _DEFAULT_SETTINGS_FILE
DATA_DIR = _DEFAULT_DATA_DIR


import sys as _sys
import app.config.manager as _self


def _ensure_data_dir():
    os.makedirs(_self.DATA_DIR, exist_ok=True)


def get_settings() -> dict:
    _ensure_data_dir()
    if not os.path.exists(_self.SETTINGS_FILE):
        return dict(DEFAULT_SETTINGS)
    with open(_self.SETTINGS_FILE, "r") as f:
        stored = json.load(f)
    result = dict(DEFAULT_SETTINGS)
    result.update(stored)
    return result


def save_settings(settings: dict) -> None:
    _ensure_data_dir()
    with open(_self.SETTINGS_FILE, "w") as f:
        json.dump(settings, f, indent=2)


def update_settings(partial: dict) -> dict:
    current = get_settings()
    current.update(partial)
    save_settings(current)
    return current
