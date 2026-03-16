"""
测试配置：提供内存数据库和 TestClient fixture，
所有测试用例共享，互相隔离。
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base, get_db
from app.main import create_app

# ── 内存 SQLite（每次测试会话独立） ──────────────────────────
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def create_tables():
    """在测试会话开始时建表，结束时销毁。"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    """每个测试用例独享一个事务，测试后回滚，保持数据隔离。"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture
def client(db):
    """
    提供 FastAPI TestClient，并将 get_db 依赖替换为测试用的内存数据库。
    RAG/向量存储的启动事件通过 mock 跳过。
    """
    app = create_app()

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    # 禁用 startup 事件（避免触发真实数据库初始化和向量库加载）
    app.router.on_startup.clear()

    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
