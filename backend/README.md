# 交互式个人简历 Agent 后端

基于 **RAG（检索增强生成）** 架构的 AI 简历助手后端服务。访客可以通过自然语言对话，深入了解简历主人的技能、项目经历和工作经验，支持 SSE 流式输出，体验流畅。

## 技术栈

| 层级 | 技术 |
|------|------|
| Web 框架 | FastAPI |
| 关系型数据库 | SQLite + SQLAlchemy ORM |
| 向量数据库 | ChromaDB（本地持久化） |
| AI 对话 | OpenAI SDK（兼容 DeepSeek / Kimi 等 API） |
| 文本切分 | LangChain Text Splitters |
| 数据校验 | Pydantic v2 |
| 流式输出 | SSE（Server-Sent Events） |

## 项目结构

```
my_portfolio_fastapi/
├── app/
│   ├── main.py                  # 应用入口，创建 FastAPI 实例
│   ├── api/
│   │   └── endpoints.py         # 所有 API 路由（REST + SSE）
│   ├── core/
│   │   ├── config.py            # 环境变量与应用配置（pydantic-settings）
│   │   └── security.py          # CORS 跨域配置
│   ├── db/
│   │   ├── database.py          # SQLite 连接与会话管理
│   │   ├── models.py            # SQLAlchemy ORM 模型
│   │   ├── schemas.py           # Pydantic 请求/响应模型
│   │   └── init_db.py           # 数据库初始化 & 种子数据注入
│   ├── rag/
│   │   ├── document_loader.py   # Markdown 知识库解析与分块
│   │   ├── vector_store.py      # ChromaDB 向量存储与检索
│   │   └── chat_engine.py       # LLM 调用、Prompt 组装、上下文管理
│   └── services/
│       └── resume_service.py    # 简历数据业务逻辑层
├── resume_knowledge.md          # 非结构化简历知识库（RAG 数据源）
├── requirements.txt
├── .env.example                 # 环境变量模板
└── README.md
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repo-url>
cd my_portfolio_fastapi
```

### 2. 创建虚拟环境并安装依赖

```bash
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 3. 配置环境变量

复制模板并填入你的 API Key：

```bash
cp .env.example .env
```

编辑 `.env` 文件，至少需要配置：

```env
# 必填：你的大模型 API Key（支持 DeepSeek / Kimi / OpenAI）
OPENAI_API_KEY=sk-your-real-api-key

# API 地址（根据你使用的服务商修改）
OPENAI_API_BASE=https://api.deepseek.com/v1

# 模型名称
CHAT_MODEL_NAME=deepseek-chat
```

### 4. 启动服务

**在项目根目录下运行**（注意不是 `app/` 目录）：

```bash
uvicorn app.main:app --reload
```

服务启动后会自动完成：
- 创建 SQLite 数据库并注入种子数据
- 读取 `resume_knowledge.md` 并向量化存入 ChromaDB

首次启动时 ChromaDB 会下载内置的 Embedding 模型（约 80MB），请耐心等待。

访问 http://127.0.0.1:8000/docs 可查看交互式 API 文档（Swagger UI）。

## API 接口一览

### 结构化数据接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/profile` | 获取个人基本信息 |
| GET | `/api/experiences` | 获取工作经历列表 |
| GET | `/api/projects` | 获取项目经历列表 |
| GET | `/api/skills` | 获取技能标签列表 |

### AI 对话接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/chat` | AI 对话（SSE 流式输出） |

请求体：

```json
{
  "session_id": "uuid-xxx",
  "message": "你做过哪些项目？"
}
```

响应格式为 `text/event-stream`，每个事件：

```
data: {"content": "我"}
data: {"content": "做过"}
data: {"content": "以下项目..."}
data: [DONE]
```

### 管理接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/admin/refresh-knowledge` | 重新加载知识库并更新向量数据库 |

### 健康检查

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 服务健康检查 |

## 核心架构说明

### RAG 流程

```
用户提问
  │
  ▼
向量检索（ChromaDB）── 从 resume_knowledge.md 切分的文本块中检索 Top-K 相关内容
  │
  ▼
Prompt 组装 ── System Prompt + 检索到的上下文 + 最近 5 轮对话历史
  │
  ▼
调用大模型 API（流式）
  │
  ▼
SSE 逐 token 推送给前端
```

### 上下文记忆

使用内存字典 `Dict[session_id, List[messages]]` 管理对话历史，保留最近 **5 轮**对话（10 条消息），超出自动裁剪旧消息。

### 知识库更新

编辑 `resume_knowledge.md` 后，调用 `POST /api/admin/refresh-knowledge` 即可触发重新加载和向量化，无需重启服务。

## 自定义简历内容

1. **结构化数据**：编辑 `app/db/init_db.py` 中的种子数据，删除 `resume.db` 后重启服务
2. **知识库文本**：编辑根目录的 `resume_knowledge.md`，然后调用刷新接口

## 常见问题

**Q: 启动报错 `ModuleNotFoundError: No module named 'app'`？**
A: 确保在**项目根目录**下运行 `uvicorn app.main:app --reload`，而非在 `app/` 子目录中。

**Q: 首次启动很慢？**
A: ChromaDB 会在首次使用时下载内置的 ONNX Embedding 模型（all-MiniLM-L6-v2，约 80MB），下载完成后后续启动会很快。

**Q: 如何切换到其他大模型 API？**
A: 修改 `.env` 中的 `OPENAI_API_BASE` 和 `CHAT_MODEL_NAME`。任何兼容 OpenAI API 格式的服务商（DeepSeek、Kimi、智谱等）均可直接替换使用。
