#!/bin/bash

# 遇到错误立即停止
set -e

echo "🚀 开始下载 Chroma 模型文件 (使用 hf-mirror.com 镜像源)..."

# 1. 设置模型存放的相对目录
MODEL_DIR="root_models/all-MiniLM-L6-v2"
mkdir -p "$MODEL_DIR/onnx"

# 2. 定义基础下载链接
BASE_URL="https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main"

# 3. 需要下载的文件列表
FILES=(
  "config.json"
  "tokenizer.json"
  "tokenizer_config.json"
  "vocab.txt"
  "special_tokens_map.json"
  "onnx/model.onnx"
)

# 4. 循环下载
for FILE in "${FILES[@]}"; do
  echo "⬇️ 正在下载: $FILE"
  # -c 支持断点续传，-q 减少无用输出，--show-progress 显示进度条
  wget -c -q --show-progress "$BASE_URL/$FILE" -O "$MODEL_DIR/$FILE"
done

echo "🎉 所有模型文件下载完成！存放于 ./${MODEL_DIR} 目录。"
echo "👉 下一步：请将 Dockerfile 中的下载命令替换为 COPY 指令。"