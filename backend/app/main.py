import logging

from fastapi import FastAPI

from app.core.config import get_settings
from app.core.security import setup_cors
from app.api.endpoints import router
from app.db.init_db import init_database
from app.rag.vector_store import refresh_knowledge

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_TITLE,
        description="基于 RAG 的交互式个人简历 AI 助手后端服务",
        version="1.0.0",
    )

    setup_cors(app)
    app.include_router(router)

    @app.on_event("startup")
    async def on_startup():
        logger.info("正在初始化数据库...")
        init_database()
        logger.info("数据库初始化完成")

        try:
            count = refresh_knowledge()
            logger.info(f"知识库加载完成，共 {count} 个文本块")
        except FileNotFoundError:
            logger.warning("知识库文件不存在，跳过向量化。请创建 resume_knowledge.md 后调用 /myresume/api/admin/refresh-knowledge")
        except Exception:
            logger.exception("知识库加载失败")

    return app


app = create_app()
