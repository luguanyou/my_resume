# API 接口文档

> 交互式简历 AI 助手后端服务
> 版本：`1.0.0`
> 交互式调试：启动服务后访问 `http://localhost:8000/docs`

---

## 目录

- [基本信息](#基本信息)
- [通用约定](#通用约定)
- [接口列表](#接口列表)
  - [健康检查](#1-健康检查)
  - [个人信息](#2-个人信息)
  - [工作经历](#3-工作经历)
  - [项目经历](#4-项目经历)
  - [技能列表](#5-技能列表)
  - [教育经历](#6-教育经历)
  - [AI 对话（SSE 流式）](#7-ai-对话sse-流式)
  - [刷新知识库](#8-刷新知识库)
- [错误码说明](#错误码说明)

---

## 基本信息

| 项目     | 值                          |
| -------- | --------------------------- |
| Base URL | `http://localhost:8000/api` |
| 协议     | HTTP / 1.1                  |
| 数据格式 | JSON（流式接口为 SSE）      |
| 鉴权     | 无（公开接口）              |
| 跨域     | 已开启 CORS，允许所有来源   |

---

## 通用约定

### 请求头

```
Content-Type: application/json
```

### 错误响应格式

所有错误统一返回以下结构：

```json
{
  "detail": "错误描述信息"
}
```

### HTTP 状态码

| 状态码 | 含义           |
| ------ | -------------- |
| 200    | 请求成功       |
| 400    | 请求参数有误   |
| 404    | 资源不存在     |
| 422    | 请求体校验失败 |
| 500    | 服务器内部错误 |

---

## 接口列表

---

### 1. 健康检查

检查服务是否正常运行。

```
GET /api/health
```

**请求参数**：无

**响应示例**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "ok",
  "vector_store": "ok"
}
```

**响应字段**

| 字段         | 类型   | 说明                       |
| ------------ | ------ | -------------------------- |
| status       | string | 服务状态，固定为 `healthy` |
| version      | string | 服务版本号                 |
| database     | string | 数据库状态                 |
| vector_store | string | 向量库状态                 |

---

### 2. 个人信息

获取简历中的个人基本信息。

```
GET /api/profile
```

**请求参数**：无

**响应示例**

```json
{
  "id": 1,
  "name": "卢官有",
  "title": "后端工程师",
  "years_of_experience": 3,
  "email": "example@email.com",
  "phone": "138-0000-0000",
  "location": "北京",
  "bio": "热爱编程，专注于后端与 AI 应用开发",
  "github": "https://github.com/example",
  "blog": "https://blog.example.com"
}
```

**响应字段**

| 字段                | 类型    | 说明            |
| ------------------- | ------- | --------------- |
| id                  | integer | 记录 ID         |
| name                | string  | 姓名            |
| title               | string  | 职位名称        |
| years_of_experience | integer | 工作年限        |
| email               | string  | 电子邮件        |
| phone               | string  | 联系电话        |
| location            | string  | 所在地          |
| bio                 | string  | 个人简介        |
| github              | string  | GitHub 主页链接 |
| blog                | string  | 博客链接        |

**错误情况**

| 状态码 | 触发条件           |
| ------ | ------------------ |
| 404    | 数据库中无个人信息 |

---

### 3. 工作经历

获取所有工作经历，按开始时间倒序排列（最近的在前）。

```
GET /api/experiences
```

**请求参数**：无

**响应示例**

```json
[
  {
    "id": 1,
    "company": "某科技有限公司",
    "position": "Python 后端工程师",
    "start_date": "2022-07",
    "end_date": "至今",
    "description": "负责核心业务后端服务开发，主导微服务架构改造。"
  },
  {
    "id": 2,
    "company": "某互联网公司",
    "position": "初级开发工程师",
    "start_date": "2021-06",
    "end_date": "2022-06",
    "description": "参与电商平台后台系统开发与维护。"
  }
]
```

**响应字段（单条）**

| 字段        | 类型    | 说明                      |
| ----------- | ------- | ------------------------- |
| id          | integer | 记录 ID                   |
| company     | string  | 公司名称                  |
| position    | string  | 职位                      |
| start_date  | string  | 入职时间，格式 `YYYY-MM`  |
| end_date    | string  | 离职时间，在职则为 `至今` |
| description | string  | 工作内容描述              |

> 无数据时返回空数组 `[]`，不报错。

---

### 4. 项目经历

获取所有项目经历。

```
GET /api/projects
```

**请求参数**：无

**响应示例**

```json
[
  {
    "id": 1,
    "name": "交互式简历 AI 助手",
    "tech_stack": "FastAPI, SQLAlchemy, ChromaDB, DeepSeek",
    "description": "基于 RAG 技术的个人简历 AI 问答系统",
    "role": "独立开发",
    "highlights": "实现流式输出、向量检索、多轮对话记忆"
  }
]
```

**响应字段（单条）**

| 字段        | 类型    | 说明     |
| ----------- | ------- | -------- |
| id          | integer | 记录 ID  |
| name        | string  | 项目名称 |
| tech_stack  | string  | 技术栈   |
| description | string  | 项目描述 |
| role        | string  | 担任角色 |
| highlights  | string  | 项目亮点 |

> 无数据时返回空数组 `[]`，不报错。

---

### 5. 技能列表

获取所有技能信息。

```
GET /api/skills
```

**请求参数**：无

**响应示例**

```json
[
  {
    "id": 1,
    "category": "后端",
    "name": "Python",
    "proficiency": "精通"
  },
  {
    "id": 2,
    "category": "数据库",
    "name": "MySQL",
    "proficiency": "熟练"
  }
]
```

**响应字段（单条）**

| 字段        | 类型    | 说明                               |
| ----------- | ------- | ---------------------------------- |
| id          | integer | 记录 ID                            |
| category    | string  | 技能分类（如：后端、前端、数据库） |
| name        | string  | 技能名称                           |
| proficiency | string  | 熟练程度（如：精通、熟练、了解）   |

> 无数据时返回空数组 `[]`，不报错。

---

### 6. 教育经历

获取所有教育经历，按入学时间倒序排列（最近的在前）。

```
GET /api/education
```

**请求参数**：无

**响应示例**

```json
[
  {
    "id": 1,
    "school": "扬州大学",
    "degree": "硕士",
    "major": "计算机技术",
    "start_date": "2017",
    "end_date": "2020",
    "highlights": "主修机器学习、深度学习；发表北大核心论文一篇；获软件著作权一个；2019年江苏省数学建模二等奖"
  },
  {
    "id": 2,
    "school": "东华理工大学",
    "degree": "本科",
    "major": "软件工程",
    "start_date": "2013",
    "end_date": "2017",
    "highlights": ""
  }
]
```

**响应字段（单条）**

| 字段       | 类型    | 说明                          |
| ---------- | ------- | ----------------------------- |
| id         | integer | 记录 ID                       |
| school     | string  | 学校名称                      |
| degree     | string  | 学历（如：本科、硕士、博士）  |
| major      | string  | 专业                          |
| start_date | string  | 入学年份，格式 `YYYY`         |
| end_date   | string  | 毕业年份，格式 `YYYY`         |
| highlights | string  | 在校荣誉/亮点，无则为空字符串 |

> 无数据时返回空数组 `[]`，不报错。

---

### 7. AI 对话（SSE 流式）

向 AI 助手发送消息，以 Server-Sent Events（SSE）流式方式返回回答。
AI 基于 RAG 技术检索简历知识库，结合多轮对话历史作答。

```
POST /api/chat
```

**请求体**

```json
{
  "session_id": "user-abc-123",
  "message": "你有哪些项目经验？"
}
```

| 字段       | 类型   | 必填 | 说明                                          |
| ---------- | ------ | ---- | --------------------------------------------- |
| session_id | string | 是   | 会话 ID，用于保持多轮对话上下文，由客户端生成 |
| message    | string | 是   | 用户消息，不能为纯空白字符                    |

**响应**

- Content-Type: `text/event-stream`
- 每个 SSE 事件以 `data: ` 开头，以 `\n\n` 结尾

**正常 token 事件**

```
data: {"content": "我"}

data: {"content": "有以下"}

data: {"content": "项目经验："}
```

**结束标记**

```
data: [DONE]
```

**异常事件**（流中发生错误时）

```
data: {"error": "错误描述"}

data: [DONE]
```

**完整响应示例（原始文本）**

```
data: {"content": "你好"}

data: {"content": "，我参与过以下项目："}

data: {"content": "\n\n1. 交互式简历 AI 助手..."}

data: [DONE]
```

**客户端消费示例（JavaScript）**

```javascript
const eventSource = new EventSource("/api/chat"); // 实际用 fetch + ReadableStream

const resp = await fetch("/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ session_id: "my-session", message: "你好" }),
});

const reader = resp.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const lines = decoder.decode(value).split("\n");
  for (const line of lines) {
    if (!line.startsWith("data: ")) continue;
    const raw = line.slice(6).trim();
    if (raw === "[DONE]") break;
    const { content } = JSON.parse(raw);
    process.stdout.write(content); // 逐 token 渲染
  }
}
```

**错误情况**

| 状态码 | 触发条件                     |
| ------ | ---------------------------- |
| 400    | message 为空或仅含空白字符   |
| 422    | 请求体缺少必填字段或类型错误 |

> **多轮对话**：服务端以 `session_id` 为键在内存中维护最多 5 轮（10 条消息）的对话历史。
> 服务重启后历史清空，如需持久化请自行扩展。

---

### 8. 刷新知识库

重新读取简历知识库文件（`resume_knowledge.md`），将内容向量化并存入向量数据库。
**建议在更新简历内容后调用**。

```
POST /api/admin/refresh-knowledge
```

**请求参数**：无

**响应示例**

```json
{
  "status": "ok",
  "chunks_loaded": 42
}
```

**响应字段**

| 字段          | 类型    | 说明                 |
| ------------- | ------- | -------------------- |
| status        | string  | 固定为 `ok`          |
| chunks_loaded | integer | 成功载入的文本块数量 |

**错误情况**

| 状态码 | 触发条件                             |
| ------ | ------------------------------------ |
| 404    | `resume_knowledge.md` 文件不存在     |
| 500    | 向量化或写入向量数据库时发生内部错误 |

---

## 错误码说明

| HTTP 状态码 | 场景                                       | detail 示例                  |
| ----------- | ------------------------------------------ | ---------------------------- |
| 400         | 请求逻辑错误（如消息为空）                 | `"消息不能为空"`             |
| 404         | 资源不存在（如无个人信息、知识库文件缺失） | `"Profile not found"`        |
| 422         | Pydantic 模型校验失败（缺字段、类型错误）  | 见 FastAPI 默认 422 响应结构 |
| 500         | 服务器内部未处理异常                       | `"刷新失败: <具体错误信息>"` |
