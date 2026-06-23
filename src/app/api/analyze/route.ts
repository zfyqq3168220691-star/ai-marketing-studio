import { NextResponse } from "next/server";

import { deepseekChat } from "@/lib/deepseek";
import { buildAnalyzePrompt } from "@/lib/prompts";
import type { ApiResponse, ProductKnowledge } from "@/types";

export const runtime = "nodejs";

function json(body: ApiResponse<ProductKnowledge>, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  let productName: string;
  let customSellingPoints: string | undefined;
  try {
    const body = await req.json();
    productName = String(body?.productName ?? "").trim();
    customSellingPoints = String(body?.customSellingPoints ?? "").trim() || undefined;
  } catch {
    return json({ success: false, error: "请求格式错误" }, 400);
  }

  if (!productName) {
    return json({ success: false, error: "缺少商品名称" }, 400);
  }

  try {
    const { system, user } = buildAnalyzePrompt(productName, customSellingPoints);
    const raw = await deepseekChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.7 }
    );

    const parsed = JSON.parse(raw) as ProductKnowledge;
    return json({ success: true, data: parsed });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "内容生成超时，请稍后重试"
        : "商品分析失败，请重新尝试";
    return json({ success: false, error: message }, 500);
  }
}
