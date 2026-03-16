# RAG 个人知识库深度解析

> 面向零基础新人，结合本项目源码逐步拆解 5 个核心疑问。

---

## 目录

1. [resume_knowledge.md 如何准备](#1-resume_knowledgemd-如何准备)
2. [文档加载与分块的具体规则](#2-文档加载与分块的具体规则)
3. [向量化存入数据库的实现](#3-向量化存入数据库的实现)
4. [问题检索的实现细节](#4-问题检索的实现细节)
5. [流式输出的实现原理](#5-流式输出的实现原理)

---

## 1. resume_knowledge.md 如何准备

### 1.1 它是什么

`resume_knowledge.md` 是整个 RAG 系统的**原始知识来源**，就是一份用 Markdown 格式写的个人简历文本。
AI 的所有回答都以这份文件为根据，文件写得越详细、越准确，AI 回答就越好。

### 1.2 必须包含的信息

| 章节 | 为什么需要 | 示例问题场景 |
|------|-----------|-------------|
| 基本信息 | 让 AI 知道"我是谁" | "你是谁？" "你有几年经验？" |
| 技术能力 | 最常被问到的内容 | "你会哪些语言？" "熟悉 Vue 吗？" |
| 工作经历 | 体现职业发展轨迹 | "你之前在哪工作过？" |
| 项目经历 | 展示实际能力的最佳证明 | "做过什么项目？" "有没有 AI 相关经验？" |
| 个人优势 | 软性能力描述 | "你有什么优点？" |
| 联系方式 | 最终转化 | "怎么联系你？" |

### 1.3 格式规范（关键！）

格式不只是"好看"，它直接影响分块质量。本项目用 `##` 和 `###` 作为主要分割标志。

```markdown
# 文档标题（只有一个）

## 一级章节（##开头，这是主要分割点）

这里写这个章节的概述内容。

### 二级章节（###开头，细化分割）

- **关键词**（熟练程度）：具体描述，越详细越好
- 尽量用口语化的第一人称，因为 AI 要用"我"来回答
```

### 1.4 本项目实际文件的结构示例

```
# 卢官有 - 个人简历知识库          ← H1: 文档标题（只有一个）

## 基本信息                        ← H2: 一级章节
[概述内容]

## 技术能力                        ← H2: 一级章节

### 编程语言                       ← H3: 二级章节
- Python（精通）：...
- JavaScript（精通）：...

### 后端技术                       ← H3: 二级章节
- FastAPI（精通）：...

## 工作经历                        ← H2: 一级章节

### 全栈开发工程师 — 某科技公司    ← H3: 具体职位
[详细描述]

## 项目经历                        ← H2: 一级章节

### 农资店数字化进销存系统          ← H3: 具体项目
- 技术栈：...
- 角色：...
- 描述：...
- 亮点：...
```

### 1.5 写作要点

**用第一人称**，因为 AI 的 system prompt 要求它用"我"回答：

```markdown
# 错误写法（第三人称）
卢官有是一名 Python 开发者，他熟悉 FastAPI...

# 正确写法（第一人称）
我是一名 Python 开发者，我熟悉 FastAPI...
```

**描述要具体**，模糊描述会让 AI 也给出模糊的回答：

```markdown
# 模糊写法
熟悉前端技术，会 Vue。

# 具体写法
Vue3（精通）：使用 Composition API + Pinia + Vue Router 构建过多个企业级应用，
熟悉组件化开发、状态管理、路由守卫等核心特性。
```

---

## 2. 文档加载与分块的具体规则

### 2.1 为什么要分块？

想象一下：你的简历有 3000 字，用户问"你会哪些编程语言？"。
如果把 3000 字全部塞给 LLM，有两个问题：
1. **浪费 token**：大部分内容和问题无关，却要全部处理（费钱又费时）
2. **回答质量下降**：相关信息被大量无关内容"稀释"，LLM 难以聚焦

**分块的目的**：把文档切成小块，每次只把最相关的几块送给 LLM。

### 2.2 核心代码

```python
# app/rag/document_loader.py

from langchain_text_splitters import RecursiveCharacterTextSplitter

def load_and_split(file_path: str, chunk_size: int = 500, chunk_overlap: int = 80):
    # 第一步：读取整个 MD 文件
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    # 第二步：创建分块器
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,        # 每块最多 500 个字符
        chunk_overlap=80,      # 相邻块重叠 80 个字符
        separators=["\n## ", "\n### ", "\n\n", "\n", "。", "；", " "],
        keep_separator=True,   # 保留分隔符本身
    )

    # 第三步：切割文本
    chunks = splitter.split_text(text)
    return chunks
```

### 2.3 RecursiveCharacterTextSplitter 的工作原理

这是 **LangChain** 提供的递归字符分割器，核心思想是：**按优先级依次尝试分隔符，直到块大小满足要求**。

```
分隔符优先级（从高到低）：

1. "\n## "   ← 优先在 H2 标题处切割（章节边界）
2. "\n### "  ← 其次在 H3 标题处切割（小节边界）
3. "\n\n"    ← 再次在空行处切割（段落边界）
4. "\n"      ← 在换行处切割（行边界）
5. "。"      ← 在句号处切割（句子边界）
6. "；"      ← 在分号处切割
7. " "       ← 最后在空格处切割（词边界）
```

**递归逻辑**：先用 `\n## ` 切一刀，如果某个片段还是太长（>500字），就再用 `\n### ` 切，以此类推，直到每块都 ≤ 500 字。

### 2.4 分块的可视化过程

以本项目的 `resume_knowledge.md` 为例：

```
原始文档（约 2500 字）
│
├─ 第1刀：按 "\n## " 切（优先级最高）
│   ├── 块A: "# 卢官有...\n## 基本信息\n我叫卢官有..."（约 200字）
│   ├── 块B: "## 技术能力\n### 编程语言\n..."（约 600字，超过500！）
│   ├── 块C: "## 工作经历\n..."（约 400字）
│   └── 块D: "## 项目经历\n..."（约 900字，超过500！）
│
├─ 第2刀：对超长块按 "\n### " 切
│   ├── 块B1: "## 技术能力\n### 编程语言\n..."（约 300字）✓
│   ├── 块B2: "### 后端技术\n..."（约 280字）✓
│   ├── 块D1: "## 项目经历\n### 农资店..."（约 400字）✓
│   └── 块D2: "### 智能仓储3D..."（约 450字）✓
│
└─ 最终结果：~8个块，每块 200-500 字
```

### 2.5 chunk_overlap（重叠）的作用

重叠 80 字是为了防止信息在分割点被切断：

```
没有重叠的问题：

块1结尾: "...Vue3精通，使用Composition API构建了"
块2开头: "多个企业级应用，有丰富的实战经验..."

→ 如果用户问"Vue3 的实际经验"，可能两个块都匹配不上完整信息

有80字重叠的效果：

块1: "...Vue3精通，使用Composition API构建了多个企业级应用..."（包含完整语义）
块2: "构建了多个企业级应用，有丰富的实战经验..."（重复了前面80字）

→ 每个块都包含完整的语义单元，检索更准确
```

---

## 3. 向量化存入数据库的实现

### 3.1 什么是"向量"？

向量就是用一串数字表示文字的"语义坐标"。

```
"Python 开发经验" → [0.23, -0.11, 0.87, 0.04, ...]  (1536维数字)
"擅长 Python 编程" → [0.21, -0.09, 0.85, 0.06, ...]  (1536维数字)
"喜欢打篮球"       → [-0.54, 0.72, -0.31, 0.88, ...] (1536维数字)
```

语义相似的句子 → 数字列表相似（空间距离近）
语义不同的句子 → 数字列表差异大（空间距离远）

**这个转换过程由 Embedding 模型完成**，本项目用的是 ChromaDB 内置的本地 Embedding 模型（`all-MiniLM-L6-v2`），无需联网，免费使用。

> **注意**：`config.py` 里虽然写了 `EMBEDDING_MODEL_NAME = "text-embedding-ada-002"`，但实际代码中 `vector_store.py` 创建 collection 时没有传入该参数，ChromaDB 默认使用本地的 `all-MiniLM-L6-v2` 模型进行向量化。

### 3.2 核心代码逐行解析

```python
# app/rag/vector_store.py

import chromadb

def refresh_knowledge() -> int:
    settings = get_settings()
    client = _get_client()          # 获取 ChromaDB 客户端

    # 1. 删除旧集合（全量刷新，避免数据重复）
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass
    _collection = None

    # 2. 加载并分块文档
    chunks = load_and_split(settings.KNOWLEDGE_FILE)
    # chunks = ["## 基本信息\n我叫卢官有...", "### 编程语言\n- Python...", ...]

    # 3. 获取/创建向量集合
    collection = _get_or_create_collection()

    # 4. 批量写入（ChromaDB 自动完成向量化）
    ids = [f"chunk_{i}" for i in range(len(chunks))]
    # ids = ["chunk_0", "chunk_1", "chunk_2", ...]

    collection.add(
        documents=chunks,   # 原始文本列表
        ids=ids             # 每个块的唯一ID
    )
    # ChromaDB 在这一步内部自动调用 Embedding 模型
    # 将每个文本块转成向量并存储

    return len(chunks)
```

```python
def _get_or_create_collection():
    global _collection
    if _collection is None:
        client = _get_client()
        _collection = client.get_or_create_collection(
            name="resume_knowledge",       # 集合名称（相当于表名）
            metadata={"hnsw:space": "cosine"},  # 使用余弦相似度
        )
    return _collection
```

### 3.3 ChromaDB 存储了什么

`collection.add()` 之后，ChromaDB 在磁盘上（`./chroma_db/`）存储了一个结构化数据库，每条记录包含：

```
┌─────────────┬──────────────────────────────────────────────────────┬───────────────────────────────────────┐
│ id          │ document（原始文本）                                  │ embedding（向量）                     │
├─────────────┼──────────────────────────────────────────────────────┼───────────────────────────────────────┤
│ chunk_0     │ "## 基本信息\n我叫卢官有，是一名拥有5年经验的..."     │ [0.12, -0.34, 0.78, 0.05, ...] 384维 │
│ chunk_1     │ "## 技术能力\n### 编程语言\n- Python（精通）..."      │ [0.67, 0.23, -0.11, 0.89, ...] 384维 │
│ chunk_2     │ "### 后端技术\n- FastAPI（精通）：高性能异步..."      │ [0.45, 0.11, -0.22, 0.76, ...] 384维 │
│ ...         │ ...                                                  │ ...                                   │
└─────────────┴──────────────────────────────────────────────────────┴───────────────────────────────────────┘
```

### 3.4 HNSW 算法（为什么检索这么快）

`metadata={"hnsw:space": "cosine"}` 中的 `hnsw` 是 **Hierarchical Navigable Small World** 的缩写，一种高效的近似最近邻搜索算法。

简单理解：它把向量按"相似邻居"预先组织成一张图，检索时沿着图走，不需要和每个向量都计算距离，速度极快（百万向量级别毫秒响应）。

### 3.5 全量刷新 vs 增量更新

本项目用的是**全量刷新**策略：

```python
# 先删除整个集合，再重新写入
client.delete_collection(COLLECTION_NAME)
collection.add(documents=all_chunks, ids=all_ids)
```

**优点**：简单，不会有旧数据残留
**缺点**：文档很大时比较慢

对于个人简历这种小文档（几千字），全量刷新完全够用。

---

## 4. 问题检索的实现细节

### 4.1 检索的核心原理

用户的问题和文档块都被转成向量。在向量空间中，**找离问题向量最近的 N 个文档块向量**，就是最相关的内容。

```
用户问："你会哪些编程语言？"
         │
         ▼ Embedding 模型
         │
  问题向量: [0.65, 0.24, -0.10, 0.88, ...]
         │
         ▼ 在向量空间中计算余弦相似度
         │
  chunk_1 (编程语言描述): 相似度 0.92  ← 最相关
  chunk_2 (后端技术描述): 相似度 0.78  ← 次相关
  chunk_0 (基本信息):     相似度 0.61  ← 第三相关
  chunk_5 (联系方式):     相似度 0.23  ← 不相关
         │
         ▼ 取 TOP K=3
         │
  返回 [chunk_1, chunk_2, chunk_0] 的原始文本
```

### 4.2 余弦相似度是什么

余弦相似度衡量两个向量的**方向相似程度**，而不是距离远近：

```
相似度 = cos(θ) = (A · B) / (|A| × |B|)

取值范围：-1 到 1
  1.0 = 完全相同
  0.8+ = 高度相关
  0.5  = 一般相关
  0.0  = 完全无关
 -1.0  = 完全相反
```

余弦相似度对文本长短不敏感，更适合语义检索（比欧氏距离更好）。

### 4.3 核心检索代码逐行解析

```python
# app/rag/vector_store.py

def search(query: str, top_k: int | None = None) -> list[str]:
    settings = get_settings()
    k = top_k or settings.RAG_TOP_K   # 默认 k=3，返回最相关的3个块

    collection = _get_or_create_collection()

    # 安全检查：如果知识库是空的直接返回
    if collection.count() == 0:
        return []

    results = collection.query(
        query_texts=[query],               # 传入问题原文，ChromaDB 自动向量化
        n_results=min(k, collection.count())  # 防止 k > 总块数报错
    )

    # results 结构：
    # {
    #   "ids": [["chunk_1", "chunk_2", "chunk_0"]],
    #   "documents": [["## 技术能力...", "### 后端技术...", "## 基本信息..."]],
    #   "distances": [[0.08, 0.22, 0.39]],  ← 距离（越小越相关）
    #   "metadatas": [[None, None, None]]
    # }

    documents = results.get("documents", [[]])[0]   # 取第一个查询的结果列表
    return documents  # 返回原始文本列表
```

**注意**：`query_texts` 接收的是字符串，ChromaDB 内部自动用相同的 Embedding 模型把它转成向量再检索，保证了问题和文档用同一个向量空间，结果才准确。

### 4.4 RAG_TOP_K = 3 的意义

每次检索只返回 3 个最相关的文本块，原因：

```
TOP_K 太小（如1）：
  - 可能漏掉相关信息
  - "你的 Vue 和 Python 哪个更强？" → 只返回1块，可能只包含其中一个

TOP_K 太大（如10）：
  - system prompt 变得很长，消耗大量 token
  - 无关内容增多，LLM 回答质量反而下降
  - 费钱（token 越多费用越高）

TOP_K = 3：
  - 经验值，覆盖大多数问题所需信息
  - 控制 prompt 长度在合理范围
```

### 4.5 检索完整数据流

```
用户问："你做过哪些 AI 相关的项目？"
                │
                ▼ vector_store.search("你做过哪些 AI 相关的项目？")
                │
                ├─ ChromaDB 内部：问题 → Embedding → 向量
                │
                ├─ HNSW 图检索：找最近的3个向量
                │
                └─ 返回原始文本：
                     [
                       "### 交互式个人简历 Agent\n- 技术栈：FastAPI + LangChain...",
                       "### AI / LLM 相关\n- 熟练使用 OpenAI API...",
                       "### 智能仓储 3D 可视化大屏\n- 技术栈：Three.js..."
                     ]
                │
                ▼ chat_engine 拼装到 system prompt 中
                │
                ▼ 发给 DeepSeek LLM
                │
                ▼ "我做过的 AI 相关项目主要有：
                   1. **交互式个人简历 Agent** — 基于 RAG 架构...
                   2. 此外在工作中也有使用 OpenAI API 的经验..."
```

---

## 5. 流式输出的实现原理

### 5.1 为什么需要流式输出

LLM 生成一段完整回答需要 3-10 秒。如果等生成完再返回：
- 用户盯着空白页面等待，体验极差
- 连接容易超时

流式输出让用户**边生成边看**，就像打字机一样，体验好得多。

### 5.2 涉及的两个技术

| 技术 | 作用 | 位置 |
|------|------|------|
| **OpenAI stream=True** | LLM 一次生成一个 token 就立即返回 | chat_engine.py |
| **SSE (Server-Sent Events)** | 服务器向客户端持续推送数据 | endpoints.py |

### 5.3 第一层：OpenAI 流式调用

```python
# app/rag/chat_engine.py

async def chat_stream(session_id: str, message: str):

    # ... 检索 + 拼装 messages ...

    stream = await client.chat.completions.create(
        model="deepseek-chat",
        messages=messages,
        stream=True,       # ← 关键：开启流式模式
        temperature=0.7,
        max_tokens=1024,
    )

    full_reply = ""
    async for chunk in stream:          # ← 每次迭代得到一小段
        delta = chunk.choices[0].delta
        if delta.content:               # ← 有时 delta.content 是 None（心跳帧）
            full_reply += delta.content
            yield delta.content         # ← 立即 yield 出去，不等全部完成

    # 全部生成完后，把完整回答存入历史
    _session_store[session_id].append({"role": "assistant", "content": full_reply})
```

`yield` 是 Python **异步生成器**的语法。每次 `yield` 一个 token，调用方立即收到，而不是等函数执行完再返回。

### 5.4 第二层：SSE 协议推送

```python
# app/api/endpoints.py

async def _sse_generator(session_id: str, message: str):
    try:
        async for token in chat_stream(session_id, message):
            # 把每个 token 包装成 SSE 格式
            payload = json.dumps({"content": token}, ensure_ascii=False)
            yield f"data: {payload}\n\n"    # ← SSE 格式：必须以 \n\n 结尾
            # 例如：data: {"content": "我"}\n\n

        yield "data: [DONE]\n\n"            # ← 结束信号

    except Exception as e:
        error_payload = json.dumps({"error": str(e)}, ensure_ascii=False)
        yield f"data: {error_payload}\n\n"
        yield "data: [DONE]\n\n"


@router.post("/chat")
async def api_chat(req: ChatRequest):
    return StreamingResponse(
        _sse_generator(req.session_id, req.message),
        media_type="text/event-stream",     # ← SSE 的 MIME 类型
        headers={
            "Cache-Control": "no-cache",    # ← 禁止缓存（必须）
            "Connection": "keep-alive",     # ← 保持长连接
            "X-Accel-Buffering": "no",      # ← 禁止 Nginx 缓冲（必须）
        },
    )
```

### 5.5 SSE 协议格式详解

SSE（Server-Sent Events）是一种 HTTP 协议的扩展，格式非常简单：

```
# 标准 SSE 帧格式
data: 数据内容\n\n

# 本项目实际传输的数据流：
data: {"content": "我"}\n\n
data: {"content": "擅"}\n\n
data: {"content": "长"}\n\n
data: {"content": " Python"}\n\n
data: {"content": " 和"}\n\n
data: {"content": " Vue3"}\n\n
data: {"content": "，"}\n\n
...
data: [DONE]\n\n       ← 前端监听到这个就关闭连接
```

> **注意**：每条消息必须以 `\n\n`（两个换行）结尾，这是 SSE 协议规定的消息分隔符。

### 5.6 完整的流式链路（从 LLM 到浏览器）

```
DeepSeek LLM 服务器
    │
    │ 生成一个 token: "我"
    ▼
OpenAI SDK (stream chunk)
    │ chunk.choices[0].delta.content = "我"
    ▼
chat_stream() 生成器
    │ yield "我"
    ▼
_sse_generator() 生成器
    │ yield 'data: {"content": "我"}\n\n'
    ▼
FastAPI StreamingResponse
    │ 立即将这个字节写入 HTTP 响应体
    ▼
浏览器（前端）
    │ EventSource 监听到一条消息
    │ event.data = '{"content": "我"}'
    │ 解析后把 "我" 追加到对话框
    ▼
用户看到字符逐个出现（打字机效果）
```

### 5.7 前端如何接收 SSE

虽然本项目是后端，但为了完整理解，前端接收的代码逻辑如下：

```javascript
// 前端示例代码（仅供理解）

async function sendMessage(message) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: 'user-abc', message })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value);
        const lines = text.split('\n\n');   // 按 SSE 分隔符切割

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);     // 去掉 "data: " 前缀
                if (data === '[DONE]') return;  // 结束
                const { content } = JSON.parse(data);
                appendToChat(content);           // 追加到页面
            }
        }
    }
}
```

### 5.8 多轮对话上下文记忆

```python
# app/rag/chat_engine.py

# 会话存储（进程内存，重启清空）
_session_store: dict[str, list[dict[str, str]]] = defaultdict(list)

MAX_HISTORY_ROUNDS = 5   # 保留最近 5 轮对话

def _build_messages(session_id, user_message, context_chunks):
    # system prompt（包含检索到的简历内容）
    system_msg = {"role": "system", "content": "..."}

    # 取出该 session 的历史消息
    history = _session_store[session_id]

    # 追加本次用户消息
    history.append({"role": "user", "content": user_message})

    # 超过 10 条（5轮 × 2）就截断，防止 token 爆炸
    if len(history) > MAX_HISTORY_ROUNDS * 2:
        history = history[-(MAX_HISTORY_ROUNDS * 2):]
        _session_store[session_id] = history

    # 最终发给 LLM 的 messages 数组
    return [system_msg] + history
    # = [system, user1, ai1, user2, ai2, ..., user(当前)]
```

**session_id 的作用**：每个浏览器 Tab 或用户有一个唯一的 session_id（通常前端用 UUID 生成），服务器用它来区分不同用户的对话历史。

---

## 总结：整个 RAG 系统的数据流图

```
┌─────────────────────────────────────────────────────────┐
│                    离线准备阶段（一次性）                  │
│                                                         │
│  resume_knowledge.md                                    │
│         │                                               │
│         ▼ document_loader.py                            │
│  分块: ["基本信息...", "技术能力...", "项目经历...", ...]  │
│         │                                               │
│         ▼ vector_store.refresh_knowledge()              │
│  ChromaDB: {chunk_0: [向量], chunk_1: [向量], ...}      │
│  持久化到 ./chroma_db/ 目录                              │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    在线对话阶段（每次请求）                 │
│                                                         │
│  用户: "你会哪些技术？"                                   │
│         │                                               │
│         ▼ POST /api/chat                                │
│         │                                               │
│         ▼ vector_store.search("你会哪些技术？")           │
│  返回: ["编程语言块", "后端技术块", "前端技术块"]           │
│         │                                               │
│         ▼ chat_engine._build_messages()                 │
│  messages = [                                           │
│    {role: system, content: "你是卢官有的助手...\n检索内容"},│
│    {role: user, content: "上一个问题"},                  │
│    {role: assistant, content: "上一个回答"},             │
│    {role: user, content: "你会哪些技术？"}  ← 当前        │
│  ]                                                      │
│         │                                               │
│         ▼ DeepSeek API (stream=True)                    │
│  token流: "我" → "擅" → "长" → " Python" → ...          │
│         │                                               │
│         ▼ SSE: data: {"content": "我"}\n\n              │
│         ▼ SSE: data: {"content": "擅"}\n\n              │
│         ▼ ...                                           │
│         ▼ SSE: data: [DONE]\n\n                         │
│                                                         │
│  用户看到打字机效果的回答                                 │
└─────────────────────────────────────────────────────────┘
```

---

*文档生成时间：2026-03-12 | 项目：my_portfolio_fastapi*
