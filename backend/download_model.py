import os
import urllib.request
from pathlib import Path

def download_chroma_onnx_model():
    # 绕过 ChromaDB 默认的 AWS S3 下载源，直接从 HuggingFace 国内镜像源下载所需的 ONNX 文件
    files = {
        "config.json": "https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/config.json",
        "model.onnx": "https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model.onnx",
        "special_tokens_map.json": "https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/special_tokens_map.json",
        "tokenizer_config.json": "https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer_config.json",
        "tokenizer.json": "https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer.json",
        "vocab.txt": "https://hf-mirror.com/Xenova/all-MiniLM-L6-v2/resolve/main/vocab.txt"
    }

    # ChromaDB 默认查找这个目录下的文件
    target_dir = os.path.join(str(Path.home()), ".cache", "chroma", "onnx_models", "all-MiniLM-L6-v2", "onnx")
    os.makedirs(target_dir, exist_ok=True)

    print(f"Downloading model to {target_dir}...")
    for filename, url in files.items():
        filepath = os.path.join(target_dir, filename)
        if not os.path.exists(filepath):
            print(f"Downloading {filename}...")
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            try:
                with urllib.request.urlopen(req) as response, open(filepath, 'wb') as out_file:
                    out_file.write(response.read())
                print(f"Downloaded {filename}")
            except Exception as e:
                print(f"Error downloading {filename}: {e}")
                raise
        else:
            print(f"File {filename} already exists")
    print("Download complete. ChromaDB will now use the cached model.")

if __name__ == "__main__":
    download_chroma_onnx_model()
