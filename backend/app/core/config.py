from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_TITLE: str = "卢官有 - 交互式简历 Agent"
    DEBUG: bool = False

    OPENAI_API_KEY: str = ""
    OPENAI_API_BASE: str = "https://api.deepseek.com/v1"
    CHAT_MODEL_NAME: str = "deepseek-chat"

    EMBEDDING_MODEL_NAME: str = "text-embedding-ada-002"
    RAG_TOP_K: int = 3

    DATABASE_URL: str = "sqlite:///./resume.db"
    CHROMA_PERSIST_DIR: str = "./chroma_db"
    KNOWLEDGE_FILE: str = "./resume_knowledge.md"

    CORS_ORIGINS: list[str] = ["*"]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
