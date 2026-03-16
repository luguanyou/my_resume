from collections import defaultdict
from typing import AsyncGenerator

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.rag.vector_store import search as vector_search

MAX_HISTORY_ROUNDS = 5

_session_store: dict[str, list[dict[str, str]]] = defaultdict(list)

SYSTEM_PROMPT_TEMPLATE = """你是「卢官有」的数字分身和专属简历助手。你的职责是基于以下检索到的简历知识库内容，
以专业、真诚且友好的语气，回答访客关于卢官有的技能、项目经历、工作经验等方面的问题。

回答要求：
1. 只基于提供的上下文信息回答，不要编造不存在的内容。
2. 如果上下文中没有相关信息，请诚实地说"这方面的信息我暂时没有，您可以直接联系卢官有了解更多"。
3. 回答应当简洁有条理，可以适当使用列表或分点描述。
4. 用第一人称（"我"）来代表卢官有进行回答。

---
以下是检索到的相关简历信息：
{context}
---"""


def _build_messages(
    session_id: str,
    user_message: str,
    context_chunks: list[str],
) -> list[dict[str, str]]:
    context_text = "\n\n".join(context_chunks) if context_chunks else "（暂无相关上下文信息）"
    system_msg = {"role": "system", "content": SYSTEM_PROMPT_TEMPLATE.format(context=context_text)}

    history = _session_store[session_id]
    history.append({"role": "user", "content": user_message})

    if len(history) > MAX_HISTORY_ROUNDS * 2:
        history = history[-(MAX_HISTORY_ROUNDS * 2):]
        _session_store[session_id] = history

    return [system_msg] + history


async def chat_stream(session_id: str, message: str) -> AsyncGenerator[str, None]:
    """RAG + LLM 流式回答。"""
    settings = get_settings()

    context_chunks = vector_search(message)

    messages = _build_messages(session_id, message, context_chunks)

    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY, base_url=settings.OPENAI_API_BASE)

    full_reply = ""
    stream = await client.chat.completions.create(
        model=settings.CHAT_MODEL_NAME,
        messages=messages,
        stream=True,
        temperature=0.7,
        max_tokens=1024,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            full_reply += delta.content
            yield delta.content

    _session_store[session_id].append({"role": "assistant", "content": full_reply})
