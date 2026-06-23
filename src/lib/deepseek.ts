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
 */
export async function deepseekChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_CONFIG.deepseek.timeoutMs);

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
  } finally {
    clearTimeout(timer);
  }
}
