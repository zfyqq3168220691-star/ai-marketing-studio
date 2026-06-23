/**
 * 阿里云百炼 Qwen-Image 2.0 图像生成封装
 * 文档：https://help.aliyun.com/zh/model-studio/qwen-image-edit-guide
 *
 * 支持多模态输入：传参考图片（原图）+ 文字 prompt，让模型基于真实产品图生成海报。
 */

import { getQwenApiKey } from "@/config/ai";

const BASE_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation";
const TIMEOUT_MS = 70_000; // 多模态生成稍慢，给 70s

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
 */
export async function qwenImage(
  prompt: string,
  options: QwenImageOptions = {}
): Promise<string> {
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
  } finally {
    clearTimeout(timer);
  }
}
