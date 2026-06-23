/**
 * 阿里云百炼 通义万相 Wan2.7 图生视频（i2v）封装。
 *
 * 接口文档：
 *   https://help.aliyun.com/zh/model-studio/image-to-video-general-api-reference
 *
 * 流程：异步提交任务 → 轮询等待 → 返回视频 URL
 */

import { getQwenApiKey } from "@/config/ai";

const SUBMIT_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis";
const POLL_INTERVAL_MS = 10_000; // 每 10s 轮询一次
const MAX_POLL_RETRIES = 60; // 最多等 10 分钟

interface WanSubmitResult {
  taskId: string;
}

interface WanPollResult {
  status: "PENDING" | "RUNNING" | "SUCCEEDED" | "FAILED";
  videoUrl?: string;
  message?: string;
}

/** 提交视频生成任务 */
async function submitTask(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  duration: number
): Promise<WanSubmitResult> {
  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  const res = await fetch(SUBMIT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getQwenApiKey()}`,
      "X-DashScope-Async": "enable",
    },
    body: JSON.stringify({
      model: "wan2.7-i2v-2026-04-25",
      input: {
        prompt,
        media: [{ type: "first_frame", url: dataUri }],
      },
      parameters: {
        resolution: "720P",
        duration,
        prompt_extend: true,
        watermark: false,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`通义万相提交失败 ${res.status}: ${detail}`);
  }

  const body = (await res.json()) as {
    output?: { task_id?: string };
  };

  const taskId = body?.output?.task_id;
  if (!taskId) {
    throw new Error("通义万相未返回 task_id");
  }

  return { taskId };
}

/** 轮询查询任务状态 */
async function pollTask(taskId: string): Promise<WanPollResult> {
  for (let i = 0; i < MAX_POLL_RETRIES; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const res = await fetch(
      `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
      {
        headers: { Authorization: `Bearer ${getQwenApiKey()}` },
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`通义万相查询失败 ${res.status}: ${detail}`);
    }

    const body = (await res.json()) as {
      output?: {
        task_status?: string;
        video_url?: string;
        message?: string;
      };
    };

    const status = body?.output?.task_status ?? "UNKNOWN";

    if (status === "SUCCEEDED") {
      return {
        status: "SUCCEEDED",
        videoUrl: body?.output?.video_url,
      };
    }
    if (status === "FAILED") {
      return {
        status: "FAILED",
        message: body?.output?.message ?? "视频生成失败",
      };
    }
  }

  return { status: "FAILED", message: "视频生成超时" };
}

/**
 * 调用通义万相图生视频。
 *
 * @param imageBase64 - 首帧图片 base64（不含 data: URI 前缀）
 * @param mimeType - 图片 MIME 类型
 * @param prompt - 视频画面提示词
 * @param duration - 视频长度（2-15 秒）
 * @returns 视频 MP4 的 URL（有效期 24 小时）
 */
export async function wanImageToVideo(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  duration: number = 10
): Promise<string> {
  const { taskId } = await submitTask(imageBase64, mimeType, prompt, duration);
  const result = await pollTask(taskId);

  if (result.status !== "SUCCEEDED" || !result.videoUrl) {
    throw new Error(result.message ?? "视频生成失败");
  }

  return result.videoUrl;
}
