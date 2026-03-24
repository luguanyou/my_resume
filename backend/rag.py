import os
from typing import List

# 导入 ChromaDB，这是一个轻量级的本地向量数据库，用于存储和检索文本的向量表示
import chromadb
# 导入 OpenAI 客户端，用于调用大语言模型（如 ChatGPT、DeepSeek 或其他兼容模型）
from openai import OpenAI
# 导入文本分割器，用于将长篇的文档切分成小块，方便后续的向量化和精确检索
from langchain_text_splitters import RecursiveCharacterTextSplitter

# 针对国内用户：配置 HuggingFace 镜像源，防止 ChromaDB 首次运行时下载默认的 Embedding 模型超时
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

# ==========================================
# 1. 配置区域 (新手友好：直接修改这里的变量即可)
# ==========================================

# 大模型 API 配置（这里以兼容 OpenAI 格式的 API 为例，比如 DeepSeek）
API_KEY = "your_api_key_here"  # 替换为你的真实 API Key
BASE_URL = "https://api.openai.com/v1" # 或者填 DeepSeek 的地址: https://api.deepseek.com
MODEL_NAME = "gpt-3.5-turbo" # 或者是你使用的具体模型名，如 deepseek-chat

# 知识库文件路径 (你需要准备一个包含你的知识的 txt 或 md 文件)
KNOWLEDGE_FILE_PATH = "./knowledge.md"

# 向量数据库保存的文件夹路径 (运行后会自动在当前目录生成这个文件夹)
CHROMA_DB_DIR = "./chroma_db"

# 每次向 AI 提供几条最相关的知识片段作为参考
TOP_K_RESULTS = 3

# ==========================================
# 2. 文档加载与切分 (Data Ingestion)
# ==========================================
def load_and_split_document(file_path: str) -> List[str]:
    """
    第一步：读取本地的知识库文件，并把它切分成小块。
    为什么需要切分？因为大模型每次能接收的文本长度有限，而且把所有内容都塞给它会降低回答的准确性，还会浪费钱。
    """
    print(f"\n[步骤 1] 正在读取文件: {file_path}")
    if not os.path.exists(file_path):
        # 如果文件不存在，我们自动创建一个简单的示例文件，方便新手直接运行测试
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("# 张三的个人简历\n张三是一名优秀的 Python 程序员，他非常喜欢钻研 AI 技术。他最近在使用 RAG 技术开发自己的专属问答助手。\n\n## 技能特长\n熟悉 Python、Docker、Linux 部署。")
        print(f"未找到文件，已自动为您创建一个示例文件: {file_path}")

    # 读取文件内容
    with open(file_path, "r", encoding="utf-8") as f:
        text = f.read()

    # 使用 LangChain 的切分器，按字符和段落切分
    # chunk_size=500 表示每块大约 500 个字符
    # chunk_overlap=50 表示相邻的两块会有 50 个字符的重叠，防止一句话被生硬地从中间切断
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", "。", "；", " "]
    )
    chunks = splitter.split_text(text)
    print(f"文件读取完毕，共切分成 {len(chunks)} 个文本块。")
    return chunks

# ==========================================
# 3. 向量数据库的构建与存储 (Embedding & Storage)
# ==========================================
def build_vector_database(chunks: List[str]) -> chromadb.Collection:
    """
    第二步：将切分好的文本块存入向量数据库中。
    ChromaDB 会自动把文本转换成“向量”（一串代表语义的数字），这样系统就能通过计算数字的相似度来找到相关的文本。
    """
    print("\n[步骤 2] 正在初始化 ChromaDB 向量数据库...")
    # 创建一个持久化的 ChromaDB 客户端，数据会保存在指定的文件夹中
    client = chromadb.PersistentClient(path=CHROMA_DB_DIR)
    
    # 创建或获取一个“集合”（Collection），类似于关系型数据库中的“表”
    collection_name = "my_knowledge"
    
    # 每次运行为了演示干净的效果，我们可以先尝试删除旧的集合，再重新创建
    try:
        client.delete_collection(collection_name)
    except Exception:
        pass # 如果不存在就忽略报错
        
    collection = client.get_or_create_collection(name=collection_name)

    # 准备存入数据库的数据
    # ids 需要是唯一的字符串列表，用于区分不同的文本块
    ids = [f"doc_{i}" for i in range(len(chunks))]
    
    print("正在将文本块转化为向量并存入数据库，这可能需要一点时间（首次运行会自动下载约 80MB 的 Embedding 模型）...")
    # 将文本和对应的 ID 存入集合中。ChromaDB 默认会使用一个内置的轻量级模型将文本转化为向量
    collection.add(documents=chunks, ids=ids)
    print("数据库构建完成！")
    
    return collection

# ==========================================
# 4. 检索最相关的内容 (Retrieval)
# ==========================================
def retrieve_knowledge(collection: chromadb.Collection, user_question: str) -> str:
    """
    第三步：根据用户的问题，去向量数据库中搜索最相关的文本块。
    """
    print(f"\n[步骤 3] 正在检索与问题 '{user_question}' 相关的知识...")
    # query 方法会自动把用户的问题转为向量，然后和数据库里的文本向量比对，返回最相似的几条
    results = collection.query(
        query_texts=[user_question],
        n_results=min(TOP_K_RESULTS, collection.count()) # 防止数据库里的数据不够 TOP_K 条
    )
    
    # 提取出检索到的文本
    documents = results.get("documents", [[]])[0]
    
    if not documents:
        print("未检索到相关内容。")
        return ""
        
    print(f"检索成功，找到了 {len(documents)} 条相关内容。")
    # 把检索到的多段文本拼接成一段长文本，中间用两个换行符隔开
    combined_context = "\n\n".join(documents)
    return combined_context

# ==========================================
# 5. 结合大模型生成回答 (Generation)
# ==========================================
def generate_answer(user_question: str, context: str) -> str:
    """
    第四步：把检索到的知识（context）和用户的问题组合起来，发给大模型，让它基于知识生成回答。
    """
    print("\n[步骤 4] 正在呼叫大模型生成回答...")
    
    # 初始化 OpenAI 客户端
    client = OpenAI(api_key=API_KEY, base_url=BASE_URL)
    
    # 核心步骤：设计系统提示词 (System Prompt)
    # 明确告诉大模型它的身份，并强调整体只能依据我们提供的上下文来回答，这叫做“防幻觉提示词”
    system_prompt = f"""你是一个智能问答助手。
请你严格根据下面提供的【参考知识】来回答用户的问题。
如果【参考知识】中没有提到用户问的内容，你就直接回答“抱歉，我的知识库中没有关于这方面的信息”，千万不要自己编造。

【参考知识】:
{context}
"""

    # 构造发送给大模型的对话消息
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_question}
    ]

    try:
        # 调用大模型 API 进行对话
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.3, # 较低的温度能让回答更严谨，减少 AI 自由发挥和胡编乱造
        )
        # 提取模型回复的文本内容
        answer = response.choices[0].message.content
        return answer
    except Exception as e:
        return f"调用大模型时出错，请检查 API_KEY 和网络配置。错误信息: {str(e)}"

# ==========================================
# 主流程演示入口 (当你直接运行 python rag.py 时会执行这里的代码)
# ==========================================
if __name__ == "__main__":
    print("=== RAG (检索增强生成) 极简演示程序启动 ===")
    
    # 提醒新手配置 API Key
    if API_KEY == "your_api_key_here":
        print("\n[警告] 您还没有配置 API_KEY，这会导致最后一步请求大模型失败！")
        print("但是前面的文档切分、数据库构建和检索流程仍然可以正常演示。\n")
    
    # 1. 加载并切分文档
    chunks = load_and_split_document(KNOWLEDGE_FILE_PATH)
    
    # 2. 构建向量数据库
    collection = build_vector_database(chunks)
    
    # 3. 模拟用户提问 (你可以修改这里的问题来测试)
    user_question = "张三是做什么的？他有什么技能特长？"
    print(f"\n用户提问: {user_question}")
    
    # 4. 从数据库检索相关知识
    retrieved_context = retrieve_knowledge(collection, user_question)
    
    # 5. 生成最终回答
    if retrieved_context:
        final_answer = generate_answer(user_question, retrieved_context)
        print("\n================ 最终回答 ================")
        print(final_answer)
        print("==========================================")
    else:
        print("没有检索到上下文，跳过大模型生成。")
