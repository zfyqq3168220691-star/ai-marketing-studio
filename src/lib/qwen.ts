/**
 * 阿里云百炼 Qwen-Image 2.0 图像生成封装
 * 文档：https://help.aliyun.com/zh/model-studio/qwen-image-edit-guide
 *
 * 支持多模态输入：传参考图片（原图）+ 文字 prompt，让模型基于真实产品图生成海报。
 */

import { AI_CONFIG, getQwenApiKey } from "@/config/ai";

const BASE_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const TIMEOUT_MS = AI_CONFIG.qwen.timeoutMs; // 与 ai.ts 保持一致，给 90s

interface QwenResponse {
  output?: {
    choices?: Array<{
      message?: {
        content?: Array<{
          image?: string;
        }>;
      };
    }>;
  };
  code?: string;
  message?: string;
}

export interface QwenImageOptions {
  size?: string;
  /** 参考图片 base64 数组（不含 data: URI 前缀） */
  referenceImages?: string[];
  /** 参考图片的 MIME 类型（与 images 一一对应） */
  referenceMimeTypes?: string[];
}

/**
 * 调用 Qwen-Image 2.0 生成海报图片。
 *
 * - 传 referenceImages：多模态输入（保留产品原貌，在其基础上设计海报）
 * - 不传：纯文本生图
 *
 * 超时（AbortError）时自动重试，最多重试 AI_CONFIG.retryAttempts 次，
 * 每次重试前按指数退避等待（1s、2s …）。
 */
export async function qwenImage(
  prompt: string,
  options: QwenImageOptions = {}
): Promise<string> {
  const maxRetries = AI_CONFIG.retryAttempts;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const content: unknown[] = [];

      // 多模态输入：先放图片，再放文字（Qwen 要求只能有一段 text）
      if (options.referenceImages && options.referenceImages.length > 0) {
        for (let i = 0; i < options.referenceImages.length; i++) {
          const mime = options.referenceMimeTypes?.[i] ?? "image/jpeg";
          content.push({
            image: `data:${mime};base64,${options.referenceImages[i]}`,
          });
        }
        // 合并保护指令 + 设计 prompt 为一段 text
        content.push({
          text: `以下图片是真实商品照片，请完整保留它们的真实外观、形状、颜色和细节，不得改动商品本身。\n\n${prompt}`,
        });
      } else {
        content.push({ text: prompt });
      }

      const body = {
        model: "qwen-image-2.0-pro",
        input: {
          messages: [
            {
              role: "user",
              content,
            },
          ],
        },
        parameters: {
          n: 1,
          watermark: false,
          size: options.size ?? "1024*1536",
          prompt_extend: true,
        },
      };

      const res = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getQwenApiKey()}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`Qwen-Image 接口错误 ${res.status}: ${detail}`);
      }

      const data = (await res.json()) as QwenResponse;

      const imageUrl = data?.output?.choices?.[0]?.message?.content?.[0]?.image;
      if (!imageUrl) {
        throw new Error(
          `Qwen-Image 返回异常: ${data.code ?? ""} ${data.message ?? "无图片URL"}`
        );
      }

      return imageUrl;
    } catch (err) {
      clearTimeout(timer);

      const isAbort =
        err instanceof Error && err.name === "AbortError";

      if (isAbort) {
        console.warn(
          `[Qwen] 请求超时（${TIMEOUT_MS}ms），第 ${attempt + 1} 次尝试失败。` +
            (attempt < maxRetries
              ? ` ${attempt + 1}s 后重试…`
              : " 已达最大重试次数，放弃。")
        );
      } else {
        console.error(`[Qwen] 请求失败（第 ${attempt + 1} 次）:`, err);
      }

      // 非超时错误，或已用完所有重试次数，直接抛出
      if (!isAbort || attempt >= maxRetries) {
        throw err;
      }

      // 指数退避：第 1 次重试等 1s，第 2 次等 2s …
      await new Promise((resolve) =>
        setTimeout(resolve, (attempt + 1) * 1_000)
      );
    } finally {
      clearTimeout(timer);
    }
  }

  // TypeScript 要求：循环结束后必须有返回值（实际上不可达）
  throw new Error("Qwen-Image: 超出最大重试次数");
}
