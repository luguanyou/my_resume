import os
import chromadb

from app.core.config import get_settings
from app.rag.document_loader import load_and_split

_client: chromadb.ClientAPI | None = None
_collection = None

COLLECTION_NAME = "resume_knowledge"


def _get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        settings = get_settings()
        persist_dir = settings.CHROMA_PERSIST_DIR
        os.makedirs(persist_dir, exist_ok=True)
        _client = chromadb.PersistentClient(path=persist_dir)
    return _client


def _get_or_create_collection():
    global _collection
    if _collection is None:
        client = _get_client()
        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
    return _collection


def refresh_knowledge() -> int:
    """重新加载知识库文件并写入向量数据库，返回文档数量。"""
    global _collection
    settings = get_settings()
    client = _get_client()

    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    _collection = None

    chunks = load_and_split(settings.KNOWLEDGE_FILE)
    if not chunks:
        return 0

    collection = _get_or_create_collection()
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    collection.add(documents=chunks, ids=ids)
    return len(chunks)


def search(query: str, top_k: int | None = None) -> list[str]:
    """根据查询文本检索最相关的知识块。"""
    settings = get_settings()
    k = top_k or settings.RAG_TOP_K

    collection = _get_or_create_collection()
    if collection.count() == 0:
        return []

    results = collection.query(query_texts=[query], n_results=min(k, collection.count()))
    documents = results.get("documents", [[]])[0]
    return documents
