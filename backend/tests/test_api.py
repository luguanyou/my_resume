"""
API 接口测试。

覆盖范围：
  GET  /api/health
  GET  /api/profile
  GET  /api/experiences
  GET  /api/projects
  GET  /api/skills
  GET  /api/education
  POST /api/admin/refresh-knowledge
  POST /api/chat
"""
import json
from unittest.mock import patch, AsyncMock

import pytest

from app.db.models import UserProfile, WorkExperience, Project, Skill, Education


# ════════════════════════════════════════════════════════════
# 辅助：向测试数据库插入样本数据
# ════════════════════════════════════════════════════════════

def _seed_profile(db):
    profile = UserProfile(
        name="张三",
        title="后端工程师",
        years_of_experience=3,
        email="test@example.com",
        phone="13800000000",
        location="北京",
        bio="热爱编程",
        github="https://github.com/test",
        blog="https://blog.example.com",
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def _seed_experience(db):
    exp = WorkExperience(
        company="某科技公司",
        position="Python 工程师",
        start_date="2021-07",
        end_date="至今",
        description="负责后端服务开发",
    )
    db.add(exp)
    db.commit()
    return exp


def _seed_project(db):
    proj = Project(
        name="个人简历 API",
        tech_stack="FastAPI, SQLAlchemy, ChromaDB",
        description="基于 RAG 的简历助手",
        role="独立开发",
        highlights="流式输出、向量检索",
    )
    db.add(proj)
    db.commit()
    return proj


def _seed_skill(db):
    skill = Skill(
        category="后端",
        name="Python",
        proficiency="精通",
    )
    db.add(skill)
    db.commit()
    return skill


# ════════════════════════════════════════════════════════════
# 健康检查
# ════════════════════════════════════════════════════════════

class TestHealth:
    def test_health_returns_ok(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "healthy"

    def test_health_response_has_version(self, client):
        resp = client.get("/api/health")
        assert "version" in resp.json()


# ════════════════════════════════════════════════════════════
# /api/profile
# ════════════════════════════════════════════════════════════

class TestProfile:
    def test_profile_not_found_when_empty(self, client):
        resp = client.get("/api/profile")
        assert resp.status_code == 404

    def test_profile_returns_data(self, client, db):
        _seed_profile(db)
        resp = client.get("/api/profile")
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "张三"
        assert data["email"] == "test@example.com"

    def test_profile_schema_fields(self, client, db):
        _seed_profile(db)
        data = client.get("/api/profile").json()
        for field in ("id", "name", "title", "years_of_experience",
                      "email", "phone", "location", "bio", "github", "blog"):
            assert field in data, f"缺少字段: {field}"


# ════════════════════════════════════════════════════════════
# /api/experiences
# ════════════════════════════════════════════════════════════

class TestExperiences:
    def test_empty_list_when_no_data(self, client):
        resp = client.get("/api/experiences")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_experience(self, client, db):
        _seed_experience(db)
        resp = client.get("/api/experiences")
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) == 1
        assert items[0]["company"] == "某科技公司"

    def test_experience_schema_fields(self, client, db):
        _seed_experience(db)
        item = client.get("/api/experiences").json()[0]
        for field in ("id", "company", "position", "start_date", "end_date", "description"):
            assert field in item, f"缺少字段: {field}"


# ════════════════════════════════════════════════════════════
# /api/projects
# ════════════════════════════════════════════════════════════

class TestProjects:
    def test_empty_list_when_no_data(self, client):
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_project(self, client, db):
        _seed_project(db)
        resp = client.get("/api/projects")
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) == 1
        assert items[0]["name"] == "个人简历 API"

    def test_project_schema_fields(self, client, db):
        _seed_project(db)
        item = client.get("/api/projects").json()[0]
        for field in ("id", "name", "tech_stack", "description", "role", "highlights"):
            assert field in item, f"缺少字段: {field}"


# ════════════════════════════════════════════════════════════
# /api/skills
# ════════════════════════════════════════════════════════════

class TestSkills:
    def test_empty_list_when_no_data(self, client):
        resp = client.get("/api/skills")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_skill(self, client, db):
        _seed_skill(db)
        resp = client.get("/api/skills")
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) == 1
        assert items[0]["name"] == "Python"

    def test_skill_schema_fields(self, client, db):
        _seed_skill(db)
        item = client.get("/api/skills").json()[0]
        for field in ("id", "category", "name", "proficiency"):
            assert field in item, f"缺少字段: {field}"


# ════════════════════════════════════════════════════════════
# /api/education
# ════════════════════════════════════════════════════════════

def _seed_education(db):
    edu = Education(
        school="扬州大学",
        degree="硕士",
        major="计算机技术",
        start_date="2017",
        end_date="2020",
        highlights="主修机器学习、深度学习；发表北大核心论文一篇",
    )
    db.add(edu)
    db.commit()
    return edu


class TestEducation:
    def test_empty_list_when_no_data(self, client):
        resp = client.get("/api/education")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_returns_education(self, client, db):
        _seed_education(db)
        resp = client.get("/api/education")
        assert resp.status_code == 200
        items = resp.json()
        assert len(items) == 1
        assert items[0]["school"] == "扬州大学"
        assert items[0]["degree"] == "硕士"

    def test_education_schema_fields(self, client, db):
        _seed_education(db)
        item = client.get("/api/education").json()[0]
        for field in ("id", "school", "degree", "major", "start_date", "end_date", "highlights"):
            assert field in item, f"缺少字段: {field}"

    def test_highlights_defaults_to_empty_string(self, client, db):
        edu = Education(
            school="东华理工大学",
            degree="本科",
            major="软件工程",
            start_date="2013",
            end_date="2017",
        )
        db.add(edu)
        db.commit()
        items = client.get("/api/education").json()
        assert items[0]["highlights"] == ""


# ════════════════════════════════════════════════════════════
# /api/admin/refresh-knowledge
# ════════════════════════════════════════════════════════════

class TestRefreshKnowledge:
    def test_refresh_success(self, client):
        with patch("app.api.endpoints.refresh_knowledge", return_value=42):
            resp = client.post("/api/admin/refresh-knowledge")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert data["chunks_loaded"] == 42

    def test_refresh_file_not_found(self, client):
        with patch("app.api.endpoints.refresh_knowledge",
                   side_effect=FileNotFoundError("文件不存在")):
            resp = client.post("/api/admin/refresh-knowledge")
        assert resp.status_code == 404

    def test_refresh_internal_error(self, client):
        with patch("app.api.endpoints.refresh_knowledge",
                   side_effect=RuntimeError("向量化失败")):
            resp = client.post("/api/admin/refresh-knowledge")
        assert resp.status_code == 500


# ════════════════════════════════════════════════════════════
# /api/chat
# ════════════════════════════════════════════════════════════

async def _fake_chat_stream(session_id, message):
    """模拟 chat_stream 异步生成器，产出几个 token。"""
    for token in ["你好", "，", "有什么", "可以帮你"]:
        yield token


class TestChat:
    def test_empty_message_returns_400(self, client):
        resp = client.post("/api/chat", json={"session_id": "s1", "message": "   "})
        assert resp.status_code == 400

    def test_missing_message_field_returns_422(self, client):
        resp = client.post("/api/chat", json={"session_id": "s1"})
        assert resp.status_code == 422

    def test_chat_streams_sse_events(self, client):
        with patch("app.api.endpoints.chat_stream", side_effect=_fake_chat_stream):
            resp = client.post(
                "/api/chat",
                json={"session_id": "test-session", "message": "你好"},
            )
        assert resp.status_code == 200
        assert "text/event-stream" in resp.headers["content-type"]

        # 解析 SSE 事件行
        lines = [l for l in resp.text.splitlines() if l.startswith("data:")]
        assert len(lines) >= 1

        # 最后一条必须是 [DONE]
        assert lines[-1] == "data: [DONE]"

        # 中间的数据行应为合法 JSON
        for line in lines[:-1]:
            payload = json.loads(line[len("data: "):])
            assert "content" in payload

    def test_chat_session_id_is_passed(self, client):
        captured = {}

        async def _capture(session_id, message):
            captured["session_id"] = session_id
            yield "ok"

        with patch("app.api.endpoints.chat_stream", side_effect=_capture):
            client.post("/api/chat", json={"session_id": "my-session", "message": "hi"})

        assert captured.get("session_id") == "my-session"
