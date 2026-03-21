"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot } from "lucide-react";

// ─── 数据接口 ─────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface QuickReply {
  label: string;
  prompt: string;
}

interface AIChatWindowProps {
  initialMessages?: ChatMessage[];
  quickReplies?: QuickReply[];
  apiEndpoint?: string;
  agentName?: string;
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    label: "他做了哪些 AI 应用？",
    prompt: "请介绍一下你做过哪些 AI 相关的应用或项目？",
  },
  {
    label: "用 FastAPI 做了什么？",
    prompt: "你用 FastAPI 做了哪些项目？有哪些核心亮点？",
  },
  {
    label: "Vibe Coding 工作流",
    prompt: "介绍一下你的 Vibe Coding 工作流和开发方法论？",
  },
  { label: "技术栈全貌", prompt: "你的主要技术栈是什么？前后端都擅长哪些？" },
];

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "你好！我是官有的 AI 简历助手 👋\n\n你可以问我关于他的项目经历、技术栈、工作方式等任何问题。我会基于他的真实履历来回答。\n\n试试下面的快捷问题，或者直接输入你想了解的内容 ↓",
};

// ─── 子组件：Bot 头像（去重） ──────────────────────────────────
function BotAvatar({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex-shrink-0 w-7 h-7 rounded-md bg-gray-950 flex items-center justify-center ${className}`}
    >
      <Bot size={14} className="text-white" />
    </div>
  );
}

// ─── 子组件：消息气泡 ─────────────────────────────────────────
function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {!isUser && <BotAvatar className="mt-0.5" />}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-gray-950 text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

// ─── 子组件：打字指示器 ──────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex gap-3"
    >
      <BotAvatar />
      <div className="px-3.5 py-3 bg-gray-100 rounded-xl rounded-tl-sm flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────
export default function AIChatWindow({
  initialMessages,
  quickReplies = DEFAULT_QUICK_REPLIES,
  apiEndpoint = "/api/chat",
  agentName = "guanyou-agent-v1.0",
}: AIChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(
    initialMessages ?? [WELCOME_MESSAGE],
  );
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  // 每次组件挂载生成一个 session_id，后端用它维护多轮对话历史
  const sessionId = useRef(
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `session-${Date.now()}`,
  );

  // 只滚动聊天容器内部，不触发页面滚动
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // 组件卸载时中断正在进行的请求
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  // ── 发送消息（SSE 流式输出） ──────────────────────────────
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        content: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);

      const aiMsgId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "" },
      ]);

      // 中断上一个请求（防止快速重复发送时丢失引用）
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const res = await fetch(apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // 符合 API 文档：{ session_id, message }
          body: JSON.stringify({
            session_id: sessionId.current,
            message: trimmed,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`HTTP ${res.status}`);
        }

        // ── SSE 流读取：data: {"content":"..."} / data: {"error":"..."} / data: [DONE]
        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const lines = decoder.decode(value, { stream: true }).split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const payload = line.slice(6).trim();
            if (payload === "[DONE]") break outer;

            try {
              const parsed = JSON.parse(payload);

              // 流中异常事件
              if (parsed.error) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId
                      ? { ...m, content: `错误：${parsed.error}` }
                      : m,
                  ),
                );
                break outer;
              }

              const delta: string = parsed.content ?? "";
              if (delta) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId ? { ...m, content: m.content + delta } : m,
                  ),
                );
              }
            } catch {
              // 忽略非 JSON chunk
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content:
                    "抱歉，连接出现问题。请确认后端服务已启动，或稍后再试。",
                }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, apiEndpoint], // messages 已从依赖中移除：新 API 只需发当前消息
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <section className="w-full px-4 sm:px-8 md:px-12 lg:px-20 max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white"
      >
        {/* ── macOS 标题栏 ── */}
        <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <span className="flex-1 text-center text-xs text-gray-400 font-mono select-none">
            {agentName} ~ bash
          </span>
          <div className="w-10" />
        </div>

        {/* ── 对话流区 ── */}
        <div
          ref={scrollContainerRef}
          className="h-72 sm:h-80 overflow-y-auto px-4 py-4 flex flex-col gap-3.5"
        >
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {isStreaming && messages[messages.length - 1]?.content === "" && (
              <TypingIndicator key="typing" />
            )}
          </AnimatePresence>
        </div>

        {/* ── 快捷回复胶囊 ── */}
        <div className="px-4 pt-2 pb-0 flex gap-2 flex-wrap border-t border-gray-100">
          {quickReplies.map((qr) => (
            <button
              key={qr.label}
              onClick={() => sendMessage(qr.prompt)}
              disabled={isStreaming}
              className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 bg-white hover:border-gray-400 hover:text-gray-900 hover:bg-gray-50 transition-all duration-150 disabled:opacity-40 cursor-pointer"
            >
              {qr.label}
            </button>
          ))}
        </div>

        {/* ── 输入框 ── */}
        <form onSubmit={handleSubmit} className="flex gap-2 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="$ 输入问题与 AI 助手对话..."
            disabled={isStreaming}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm font-mono text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-gray-300 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-950 text-white flex items-center justify-center hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            aria-label="发送"
          >
            <Send size={15} />
          </button>
        </form>
      </motion.div>
    </section>
  );
}
