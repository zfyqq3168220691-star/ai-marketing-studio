import { AI_CONFIG, getApiKey } from "@/config/ai";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  /** 强制返回 JSON 对象 */
  json?: boolean;
  temperature?: number;
}

/**
 * 调用 DeepSeek Chat Completions（OpenAI 兼容协议）。
 * 仅服务端使用，返回模型文本内容。
 *
 * 超时（AbortError）时自动重试，最多重试 AI_CONFIG.retryAttempts 次，
 * 每次重试前按指数退避等待（1s、2s …）。
 */
export async function deepseekChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const maxRetries = AI_CONFIG.retryAttempts;
  const timeoutMs = AI_CONFIG.deepseek.timeoutMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${AI_CONFIG.deepseek.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getApiKey()}`,
        },
        body: JSON.stringify({
          model: AI_CONFIG.deepseek.model,
          messages,
          temperature: options.temperature ?? 0.7,
          ...(options.json
            ? { response_format: { type: "json_object" } }
            : {}),
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const detail = await res.text();
        throw new Error(`DeepSeek 接口错误 ${res.status}: ${detail}`);
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (typeof content !== "string") {
        throw new Error("DeepSeek 返回内容为空");
      }
      return content;
    } catch (err) {
      clearTimeout(timer);

      const isAbort =
        err instanceof Error && err.name === "AbortError";

      if (isAbort) {
        console.warn(
          `[DeepSeek] 请求超时（${timeoutMs}ms），第 ${attempt + 1} 次尝试失败。` +
            (attempt < maxRetries
              ? ` ${attempt + 1}s 后重试…`
              : " 已达最大重试次数，放弃。")
        );
      } else {
        console.error(`[DeepSeek] 请求失败（第 ${attempt + 1} 次）:`, err);
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
  throw new Error("DeepSeek: 超出最大重试次数");
}
