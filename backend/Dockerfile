# ── 构建阶段 ──────────────────────────────────────────────
FROM python:3.11-slim AS builder

WORKDIR /app

# 先单独复制依赖文件，利用 Docker 层缓存
# 只要 requirements.txt 不变，pip install 就不会重跑
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── 运行阶段 ──────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# 从 builder 阶段复制已安装的依赖
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 复制项目代码与数据文件
COPY app/           ./app/
COPY data/          ./data/
COPY resume_knowledge.md .

# 创建持久化目录（volume 挂载点）
RUN mkdir -p /app/db /app/chroma_db

# 暴露端口
EXPOSE 8000

# 以非 root 用户运行，提升安全性
RUN useradd -m appuser && chown -R appuser /app
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
