from typing import AsyncGenerator
import openai
from app.config.manager import get_settings


def get_llm_client() -> openai.OpenAI:
    s = get_settings()
    return openai.OpenAI(
        api_key=s["llm_api_key"] or "sk-placeholder",
        base_url=s["llm_base_url"],
    )


def get_async_llm_client() -> openai.AsyncOpenAI:
    s = get_settings()
    return openai.AsyncOpenAI(
        api_key=s["llm_api_key"] or "sk-placeholder",
        base_url=s["llm_base_url"],
    )


def get_embedding_client() -> openai.OpenAI:
    s = get_settings()
    key = s["embedding_api_key"] or s["llm_api_key"] or "sk-placeholder"
    base_url = s["embedding_base_url"] or s["llm_base_url"]
    return openai.OpenAI(api_key=key, base_url=base_url)


def embed_texts(texts: list[str]) -> list[list[float]]:
    s = get_settings()
    client = get_embedding_client()
    response = client.embeddings.create(
        input=texts,
        model=s["embedding_model"],
    )
    return [item.embedding for item in response.data]


def embed_query(query: str) -> list[float]:
    return embed_texts([query])[0]


async def stream_chat(messages: list[dict], model: str) -> AsyncGenerator[str, None]:
    client = get_async_llm_client()
    stream = await client.chat.completions.create(
        model=model,
        messages=messages,
        stream=True,
    )
    try:
        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            if delta.content:
                yield delta.content
    finally:
        await stream.close()
