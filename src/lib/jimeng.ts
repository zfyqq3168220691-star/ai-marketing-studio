/**
 * 火山引擎 即梦 Seedream 5.0 图像生成封装。
 *
 * 端点：POST https://ark.cn-beijing.volces.com/api/v3/images/generations
 * 文档：https://www.volcengine.com/docs/82379/1541523
 */

const BASE_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations";
const TIMEOUT_MS = 60_000;

function getApiKey(): string {
  const key = process.env.JIMENG_API_KEY;
  if (!key) {
    throw new Error("未配置 JIMENG_API_KEY，请在 .env.local 中设置");
  }
  return key;
}

interface SeedreamResponse {
  data?: Array<{ url?: string; b64_json?: string }>;
}

/**
 * Seedream 5.0 文生图（纯文本 prompt → 图片）
 */
export async function seedreamTextToImage(
  prompt: string,
  options: { size?: string } = {}
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: "doubao-seedream-5-0-260128",
        prompt,
        size: options.size ?? "2K",
        watermark: false,
        response_format: "url",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Seedream 接口错误 ${res.status}: ${detail}`);
    }

    const body = (await res.json()) as SeedreamResponse;
    const imageUrl = body?.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Seedream 未返回图片 URL");
    }

    return imageUrl;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Seedream 5.0 图生图（参考图 + prompt → 图片，保留原图外观）
 */
export async function seedreamImageToImage(
  prompt: string,
  referenceBase64: string,
  referenceMimeType: string,
  options: { size?: string } = {}
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const dataUri = `data:${referenceMimeType};base64,${referenceBase64}`;
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: "doubao-seedream-5-0-260128",
        prompt,
        image: dataUri,
        size: options.size ?? "2K",
        watermark: false,
        response_format: "url",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`Seedream 图生图接口错误 ${res.status}: ${detail}`);
    }

    const body = (await res.json()) as SeedreamResponse;
    const imageUrl = body?.data?.[0]?.url;
    if (!imageUrl) {
      throw new Error("Seedream 图生图未返回图片 URL");
    }

    return imageUrl;
  } finally {
    clearTimeout(timer);
  }
}
