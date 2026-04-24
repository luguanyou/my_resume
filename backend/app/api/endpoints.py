import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas import (
    UserProfileSchema,
    WorkExperienceSchema,
    ProjectSchema,
    SkillSchema,
    EducationSchema,
    ChatRequest,
    HealthResponse,
)
from app.services.resume_service import (
    get_profile,
    get_experiences,
    get_projects,
    get_skills,
    get_education,
)
from app.rag.vector_store import refresh_knowledge
from app.rag.chat_engine import chat_stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/myresume/api")


# ─── 结构化数据接口 ─────────────────────────────────────

@router.get("/profile", response_model=UserProfileSchema)
def api_profile(db: Session = Depends(get_db)):
    profile = get_profile(db)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.get("/experiences", response_model=list[WorkExperienceSchema])
def api_experiences(db: Session = Depends(get_db)):
    return get_experiences(db)


@router.get("/projects", response_model=list[ProjectSchema])
def api_projects(db: Session = Depends(get_db)):
    return get_projects(db)


@router.get("/skills", response_model=list[SkillSchema])
def api_skills(db: Session = Depends(get_db)):
    return get_skills(db)


@router.get("/education", response_model=list[EducationSchema])
def api_education(db: Session = Depends(get_db)):
    return get_education(db)


# ─── RAG 管理接口 ──────────────────────────────────────

@router.post("/admin/refresh-knowledge")
def api_refresh_knowledge():
    try:
        count = refresh_knowledge()
        return {"status": "ok", "chunks_loaded": count}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("刷新知识库失败")
        raise HTTPException(status_code=500, detail=f"刷新失败: {e}")


# ─── AI 对话接口（SSE 流式） ──────────────────────────────

async def _sse_generator(session_id: str, message: str) -> AsyncGenerator[str, None]:
    try:
        async for token in chat_stream(session_id, message):
            payload = json.dumps({"content": token}, ensure_ascii=False)
            yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"
    except Exception as e:
        logger.exception("SSE 流式输出异常")
        error_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
        yield f"data: {error_payload}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/chat")
async def api_chat(req: ChatRequest):
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="消息不能为空")

    return StreamingResponse(
        _sse_generator(req.session_id, req.message),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ─── 健康检查 ──────────────────────────────────────────

@router.get("/health", response_model=HealthResponse)
def api_health():
    return HealthResponse(status="healthy")
