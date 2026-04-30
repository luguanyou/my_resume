import json
import logging
import re
from typing import AsyncGenerator

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.schemas import (
    UserProfileSchema,
    WorkExperienceSchema,
    ProjectSchema,
    ProjectDetailSchema,
    SkillSchema,
    EducationSchema,
    ChatRequest,
    HealthResponse,
)
from app.core.config import get_settings
from app.db.init_db import reseed_database
from app.services.resume_service import (
    get_profile,
    get_experiences,
    get_projects,
    get_project,
    get_skills,
    get_education,
)
from app.rag.vector_store import refresh_knowledge
from app.rag.chat_engine import chat_stream

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/myresume/api")
public_router = APIRouter(prefix="/api")


def _require_admin(
    x_admin_token: str | None = Header(default=None, alias="X-Admin-Token"),
) -> None:
    settings = get_settings()
    if settings.ADMIN_TOKEN and x_admin_token != settings.ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


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


@router.get("/projects/{project_id}", response_model=ProjectDetailSchema)
def api_project_detail(project_id: int, db: Session = Depends(get_db)):
    project = get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    tech_stack = []
    if project.tech_stack:
        raw = re.sub(r"\[cite:[^\]]*\]", "", project.tech_stack)
        tech_stack = [s.strip() for s in re.split(r"[,，、]", raw) if s.strip()]

    return ProjectDetailSchema(
        id=project.id,
        name=project.name,
        start_date="",
        end_date="",
        status="",
        link=None,
        description=project.description or "",
        tech_stack=tech_stack,
        role_and_responsibilities=project.role or "",
        highlights=project.highlights or "",
    )


public_router.add_api_route(
    "/projects/{project_id}",
    api_project_detail,
    methods=["GET"],
    response_model=ProjectDetailSchema,
)


@router.get("/skills", response_model=list[SkillSchema])
def api_skills(db: Session = Depends(get_db)):
    return get_skills(db)


@router.get("/education", response_model=list[EducationSchema])
def api_education(db: Session = Depends(get_db)):
    return get_education(db)


# ─── RAG 管理接口 ──────────────────────────────────────

@router.post("/admin/refresh-knowledge", dependencies=[Depends(_require_admin)])
def api_refresh_knowledge():
    try:
        count = refresh_knowledge()
        return {"status": "ok", "chunks_loaded": count}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("刷新知识库失败")
        raise HTTPException(status_code=500, detail=f"刷新失败: {e}")


@router.post("/admin/reseed-db", dependencies=[Depends(_require_admin)])
def api_reseed_db(overwrite: bool = True, db: Session = Depends(get_db)):
    try:
        counts = reseed_database(db, overwrite=overwrite)
        db.commit()
        return {"status": "ok", "overwrite": overwrite, "counts": counts}
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.exception("重灌数据库失败")
        raise HTTPException(status_code=500, detail=f"重灌失败: {e}")


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
