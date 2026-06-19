from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import repos, chunks, search, chat, settings

app = FastAPI(title="RAG Code Search API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(repos.router, prefix="/api")
app.include_router(chunks.router, prefix="/api")
app.include_router(search.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
app.include_router(settings.router, prefix="/api")
