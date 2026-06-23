import { NextResponse } from "next/server";

import { deepseekChat } from "@/lib/deepseek";
import { buildVideoPrompt } from "@/lib/prompts";
import { runVideoPipeline } from "@/lib/prompt-engine";
import type { ApiResponse, VideoPlan } from "@/types";

export const runtime = "nodejs";

function json(body: ApiResponse<VideoPlan>, status = 200) {
  return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
  let knowledge: unknown;
  let images: unknown;
  let imageMimeTypes: unknown;

  try {
    const body = await req.json();
    knowledge = body?.knowledge;
    images = body?.images;
    imageMimeTypes = body?.imageMimeTypes;
  } catch {
    return json({ success: false, error: "请求格式错误" }, 400);
  }

  if (!knowledge || typeof knowledge !== "object") {
    return json({ success: false, error: "缺少商品知识卡数据" }, 400);
  }

  const typedKnowledge = knowledge as {
    name: string;
    category: string;
    sellingPoints: string[];
    targetUsers: string[];
    scenes: string[];
    advantages: string[];
  };

  try {
    // Step 1: DeepSeek 生成增强版视频方案（含 imagePrompt + camera）
    const { system, user } = buildVideoPrompt(typedKnowledge);
    const raw = await deepseekChat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { json: true, temperature: 0.8 }
    );

    const parsed = JSON.parse(raw) as VideoPlan;

    if (!parsed.storyboard?.length) {
      return json({ success: false, error: "分镜生成不完整" }, 500);
    }

    // Step 2: Prompt Engine 流水线（逐镜头生图 → 短视频 → 拼接）
    const firstImage = Array.isArray(images) ? String(images[0]) : undefined;
    const firstMime = Array.isArray(imageMimeTypes) ? String(imageMimeTypes[0]) : undefined;

    const { shotResults, finalVideoUrl } = await runVideoPipeline(
      parsed.storyboard,
      parsed.voiceover,
      firstImage,
      firstMime
    );

    return json({
      success: true,
      data: {
        ...parsed,
        shotResults,
        videoUrl: finalVideoUrl,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "视频方案生成超时，请稍后重试"
        : `视频方案生成失败: ${err instanceof Error ? err.message : "请重新尝试"}`;
    return json({ success: false, error: message }, 500);
  }
}
