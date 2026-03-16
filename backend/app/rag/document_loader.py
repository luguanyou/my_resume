import os
from langchain_text_splitters import RecursiveCharacterTextSplitter


def load_and_split(file_path: str, chunk_size: int = 500, chunk_overlap: int = 80) -> list[str]:
    """读取 Markdown 文件并按语义分块。"""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"知识库文件不存在: {file_path}")

    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n## ", "\n### ", "\n\n", "\n", "。", "；", " "],
        keep_separator=True,
    )
    chunks = splitter.split_text(text)
    return chunks
