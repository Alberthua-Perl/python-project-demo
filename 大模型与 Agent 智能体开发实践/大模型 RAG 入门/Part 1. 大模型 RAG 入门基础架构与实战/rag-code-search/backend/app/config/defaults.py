import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

DEFAULT_SYSTEM_PROMPT = """你是一个代码库智能助手。根据检索到的代码片段回答用户问题。
回答时请引用具体的文件路径和行号，保持简洁准确。"""

DEFAULT_SETTINGS = {
    "llm_api_key": "",
    "llm_base_url": "https://api.openai.com/v1",
    "llm_model": "gpt-4o",
    "embedding_api_key": "",
    "embedding_base_url": "https://api.openai.com/v1",
    "embedding_model": "text-embedding-3-small",
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "top_k": 5,
    "system_prompt": DEFAULT_SYSTEM_PROMPT,
}
