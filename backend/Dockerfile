# ── Stage 1: 依赖构建阶段 ──────────────────────────────────────────────
FROM python:3.11-slim AS builder

# 从 Astral 官方镜像获取 uv 的二进制文件（Docker 中使用 uv 的官方最佳实践）
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# 接收 docker-compose 传进来的代理配置，确保在某些网络环境下能够正常下载
ARG HTTP_PROXY
ARG HTTPS_PROXY
ENV HTTP_PROXY=$HTTP_PROXY
ENV HTTPS_PROXY=$HTTPS_PROXY

# 配置 uv 行为：
# 1. 开启字节码编译（生成 .pyc），提升容器内 Python 应用的冷启动速度
ENV UV_COMPILE_BYTECODE=1

# 创建虚拟环境并设置环境变量激活它
ENV VIRTUAL_ENV=/opt/venv
RUN uv venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 复制依赖文件并使用 uv 极速安装
# uv 的解析和下载速度通常比 pip 快 10-100 倍
COPY requirements.txt .
RUN uv pip install -r requirements.txt

# 预下载较小的内置模型（使用国内镜像）
ENV HF_ENDPOINT=https://hf-mirror.com
COPY download_model.py .
RUN python download_model.py

# ── Stage 2: 运行阶段 ──────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# 设置时区和编码
ENV TZ=Asia/Shanghai
ENV PYTHONUNBUFFERED=1

# 从 builder 阶段复制完整的虚拟环境
# 注意：同时需要把 VIRTUAL_ENV 和 PATH 环境变量带过来
ENV VIRTUAL_ENV=/opt/venv
COPY --from=builder /opt/venv /opt/venv
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# 复制预下载的小模型缓存（如果有）
COPY --from=builder /root/.cache/chroma /root/.cache/chroma

# 复制项目代码与数据文件
COPY app/ ./app/
COPY data/ ./data/
COPY resume_knowledge.md .

# 创建必要的挂载目录
RUN mkdir -p /app/db /app/chroma_db /app/model_cache

# 暴露端口
EXPOSE 8000

# 以非 root 用户运行，提升安全性
RUN useradd -m appuser \
    && chown -R appuser /app \
    && cp -r /root/.cache /home/appuser/.cache 2>/dev/null || true \
    && chown -R appuser /home/appuser/.cache
USER appuser

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
