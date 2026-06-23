import { NextResponse } from "next/server";

import { deepseekChat } from "@/lib/deepseek";
import { buildContentPrompt } from "@/lib/prompts";
import type { ApiResponse, ContentPlan } from "@/types";

export const runtime = "nodejs";

function json(body: ApiResponse<ContentPlan>, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  let knowledge: unknown;
  try {
    const body = await req.json();
    knowledge = body?.knowledge;
  } catch {
    return json({ success: false, error: "请求格式错误" }, 400);
  }

  if (!knowledge || typeof knowledge !== "object") {
    return json({ success: false, error: "缺少商品知识卡数据" }, 400);
  }

  try {
    const { system, user } = buildContentPrompt(
      knowledge as {
        name: string;
        category: string;
        sellingPoints: string[];
        targetUsers: string[];
        scenes: string[];
        advantages: string[];
      }
    );

    const raw = await deepseekChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.8 }
    );

    const parsed = JSON.parse(raw) as ContentPlan;
    return json({ success: true, data: parsed });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "文案生成超时，请稍后重试"
        : "文案生成失败，请重新尝试";
    return json({ success: false, error: message }, 500);
  }
}
