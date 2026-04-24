import { NextRequest } from "next/server";
import type { ChatRequest } from "@/lib/api";

// 强制动态渲染，不缓存 SSE 响应
export const dynamic = "force-dynamic";

const API_BASE_URL =
  process.env.API_BASE_URL ?? "http://localhost:8000";

export async function POST(req: NextRequest) {
  // ── 1. 解析请求体 ──────────────────────────────────────────
  let body: ChatRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ detail: "请求体解析失败" }, { status: 400 });
  }

  const { session_id, message } = body;

  if (!message?.trim()) {
    return Response.json({ detail: "消息不能为空" }, { status: 400 });
  }
  if (!session_id) {
    return Response.json({ detail: "session_id 不能为空" }, { status: 400 });
  }

  // ── 2. 转发到后端 ──────────────────────────────────────────
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/myresume/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id, message }),
    });
  } catch {
    return Response.json(
      { detail: "无法连接到 AI 后端服务，请确认服务已启动" },
      { status: 502 }
    );
  }

  if (!upstream.ok || !upstream.body) {
    const errText = await upstream.text().catch(() => "");
    return Response.json(
      { detail: errText || `后端响应异常：${upstream.status}` },
      { status: upstream.status }
    );
  }

  // ── 3. 透传 SSE 流 ─────────────────────────────────────────
  // 直接将后端 ReadableStream 透传给客户端，不做任何缓冲
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no", // 关闭 Nginx 缓冲
      Connection: "keep-alive",
    },
  });
}
