import json
import logging
from pathlib import Path

from app.db.database import engine, SessionLocal, Base
from app.db.models import UserProfile, WorkExperience, Project, Skill, Education

logger = logging.getLogger(__name__)

DATA_FILE = Path(__file__).parent.parent.parent / "data" / "resume.json"


def _load_json() -> dict:
    if not DATA_FILE.exists():
        raise FileNotFoundError(f"简历数据文件不存在：{DATA_FILE}")
    with DATA_FILE.open(encoding="utf-8") as f:
        return json.load(f)


def init_database() -> None:
    """创建表结构并从 data/resume.json 注入初始数据（如果表为空）。"""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if db.query(UserProfile).count() == 0:
            data = _load_json()
            _seed_data(db, data)
            db.commit()
            logger.info("简历数据初始化完成")
    finally:
        db.close()


def _seed_data(db, data: dict) -> None:
    # ── 个人信息 ──────────────────────────────
    db.add(UserProfile(**data["profile"]))

    # ── 工作经历 ──────────────────────────────
    db.add_all([WorkExperience(**exp) for exp in data.get("experiences", [])])

    # ── 项目经历 ──────────────────────────────
    db.add_all([Project(**proj) for proj in data.get("projects", [])])

    # ── 技能列表 ──────────────────────────────
    db.add_all([Skill(**skill) for skill in data.get("skills", [])])

    # ── 教育经历 ──────────────────────────────
    db.add_all([Education(**edu) for edu in data.get("education", [])])
