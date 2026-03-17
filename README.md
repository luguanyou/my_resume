# 交互式个人简历 Agent

一个结合传统简历展示与 AI 对话能力的全栈项目。访客可以通过自然语言与简历 AI 助手对话，深入了解项目经历、技术栈和工作经验。

## 功能特性

- **结构化简历展示** — 个人信息、工作经历、项目经验、技能标签，由 FastAPI + SQLite 驱动
- **RAG 智能问答** — 基于简历知识库的检索增强生成，回答更准确、有据可查
- **流式对话体验** — SSE（Server-Sent Events）逐字输出，打字机效果
- **多轮对话记忆** — 保留最近 5 轮上下文，支持连续追问
- **Docker 一键部署** — 前后端均提供 Dockerfile 与 docker-compose 配置

## 技术栈

| 层级         | 技术                                  |
| ------------ | ------------------------------------- |
| 前端框架     | Next.js 16 + React 19 + TypeScript    |
| 前端样式     | Tailwind CSS v4 + Framer Motion       |
| 后端框架     | FastAPI (Python)                      |
| 关系型数据库 | SQLite + SQLAlchemy ORM               |
| 向量数据库   | ChromaDB（本地持久化）                |
| AI 对话      | OpenAI SDK（兼容 DeepSeek / Kimi 等） |
| RAG 框架     | LangChain Text Splitters              |
| 数据校验     | Pydantic v2                           |
| 流式输出     | SSE（Server-Sent Events）             |

## 项目结构

```
my_resume/
├── backend/                     # FastAPI 后端
│   ├── app/
│   │   ├── main.py              # 应用入口
│   │   ├── api/                 # API 路由（REST + SSE）
│   │   ├── core/                # 配置与 CORS
│   │   ├── db/                  # 数据库模型、Schema、初始化
│   │   ├── rag/                 # 文档加载、向量存储、对话引擎
│   │   └── services/            # 业务逻辑层
│   ├── resume_knowledge.md      # 非结构化知识库（RAG 数据源）
│   ├── requirements.txt
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/                    # Next.js 前端
│   ├── app/                     # App Router 页面与布局
│   ├── components/              # UI 组件
│   ├── lib/                     # 工具函数
│   ├── Dockerfile
│   └── docker-compose.yml
└── README.md
```

## 快速开始

### 方式一：本地开发

#### 后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入你的 API Key：
# OPENAI_API_KEY=sk-your-key
# OPENAI_API_BASE=https://api.deepseek.com/v1
# CHAT_MODEL_NAME=deepseek-chat

# 启动服务（首次启动会自动初始化数据库和向量库）
uvicorn app.main:app --reload
```

后端运行于 http://localhost:8000，Swagger 文档：http://localhost:8000/docs

> 首次启动时 ChromaDB 会下载内置 Embedding 模型（约 80MB），请耐心等待。

#### 前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行于 http://localhost:3000

### 方式二：Docker 部署

```bash
# 后端
cd backend
docker-compose up -d

# 前端
cd frontend
docker-compose up -d
```

## API 接口

### 结构化数据

| 方法 | 路径               | 说明         |
| ---- | ------------------ | ------------ |
| GET  | `/api/profile`     | 个人基本信息 |
| GET  | `/api/experiences` | 工作经历列表 |
| GET  | `/api/projects`    | 项目经历列表 |
| GET  | `/api/skills`      | 技能标签列表 |
| GET  | `/api/health`      | 健康检查     |

### AI 对话（SSE）

```
POST /api/chat
Content-Type: application/json

{
  "session_id": "uuid-xxx",
  "message": "你做过哪些项目？"
}
```

响应为 `text/event-stream`，每帧格式：

```
data: {"content": "我做过..."}
data: [DONE]
```

### 知识库管理

```
POST /api/admin/refresh-knowledge
```

编辑 `resume_knowledge.md` 后调用此接口，无需重启服务即可热更新知识库。

## RAG 架构

```
用户提问
  │
  ▼
向量检索（ChromaDB）  ←──  resume_knowledge.md 切分后向量化
  │
  ▼
Prompt 组装（System Prompt + 检索上下文 + 近 5 轮对话历史）
  │
  ▼
大模型 API 流式调用（DeepSeek / Kimi / OpenAI）
  │
  ▼
SSE 逐 token 推送至前端
```

## 自定义简历内容

1. **结构化数据**：修改 `backend/app/db/init_db.py` 中的种子数据，删除 `backend/resume.db` 后重启服务
2. **知识库文本**：编辑 `backend/resume_knowledge.md`，调用 `POST /api/admin/refresh-knowledge` 热更新

## 常见问题

**Q: 后端启动报 `ModuleNotFoundError: No module named 'app'`？**
A: 确保在 `backend/` 目录下运行 `uvicorn app.main:app --reload`，而非在 `app/` 子目录中。

**Q: 首次启动很慢？**
A: ChromaDB 会下载内置 ONNX Embedding 模型（all-MiniLM-L6-v2，约 80MB），下载完成后后续启动很快。

**Q: 如何切换大模型服务商？**
A: 修改 `.env` 中的 `OPENAI_API_BASE` 和 `CHAT_MODEL_NAME`，任何兼容 OpenAI API 格式的服务商均可直接使用。
