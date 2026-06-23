/**
 * 火山引擎 Seedance 2.0 图生视频封装。
 *
 * 端点：
 *   提交：POST https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks
 *   轮询：GET  https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks/{task_id}
 *
 * 文档：https://docs.apiyi.com/api-capabilities/seedance2/video-generation
 */

const BASE_URL =
  "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";
const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_RETRIES = 36; // 最多等 6 分钟

function getApiKey(): string {
  const key = process.env.JIMENG_API_KEY;
  if (!key) {
    throw new Error("未配置 JIMENG_API_KEY，请在 .env.local 中设置");
  }
  return key;
}

/**
 * 调用 Seedance 2.0 图生视频（首帧 → 短视频）。
 *
 * @param imageBase64 - 首帧图片 base64（不含 data: URI 前缀）
 * @param mimeType - 图片 MIME 类型
 * @param prompt - 视频动作描述
 * @param duration - 视频长度（4-15 秒）
 * @returns 视频 MP4 URL（有效期 24 小时）
 */
export async function seedanceImageToVideo(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  duration: number = 5
): Promise<string> {
  const dataUri = `data:${mimeType};base64,${imageBase64}`;
  const apiKey = getApiKey();

  // Step 1: 提交任务
  const submitRes = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "doubao-seedance-2-0-260128",
      content: [
        { type: "text", text: prompt },
        { type: "image_url", image_url: { url: dataUri } },
      ],
      ratio: "adaptive",
      resolution: "720p",
      duration,
      watermark: false,
      generate_audio: false,
    }),
  });

  if (!submitRes.ok) {
    const detail = await submitRes.text();
    throw new Error(`Seedance 提交失败 ${submitRes.status}: ${detail}`);
  }

  const submitBody = (await submitRes.json()) as { id?: string };
  const taskId = submitBody?.id;
  if (!taskId) {
    throw new Error("Seedance 未返回 task id");
  }

  // Step 2: 轮询结果
  for (let i = 0; i < MAX_POLL_RETRIES; i++) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

    const pollRes = await fetch(`${BASE_URL}/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!pollRes.ok) {
      const detail = await pollRes.text();
      throw new Error(`Seedance 查询失败 ${pollRes.status}: ${detail}`);
    }

    const body = (await pollRes.json()) as {
      status?: string;
      content?: { video_url?: string };
      error?: { message?: string };
    };

    const status = body?.status ?? "unknown";

    if (status === "succeeded" || status === "completed") {
      const videoUrl = body?.content?.video_url;
      if (!videoUrl) {
        throw new Error("Seedance 返回成功但无视频 URL");
      }
      return videoUrl;
    }

    if (status === "failed" || status === "expired") {
      throw new Error(body?.error?.message ?? "Seedance 视频生成失败");
    }
  }

  throw new Error("Seedance 视频生成超时");
}
