/** AI 服务配置（DeepSeek + Qwen）。密钥从环境变量读取，绝不硬编码。 */
export const AI_CONFIG = {
  deepseek: {
    baseUrl: "https://api.deepseek.com",
    model: "deepseek-chat",
    timeoutMs: 60_000,
  },
  qwen: {
    timeoutMs: 90_000,
  },
  /** 超时后最多重试次数（首次请求不计入） */
  retryAttempts: 2,
} as const;

export function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) {
    throw new Error("未配置 DEEPSEEK_API_KEY，请在 .env.local 中设置");
  }
  return key;
}

export function getQwenApiKey(): string {
  const key = process.env.QWEN_API_KEY;
  if (!key) {
    throw new Error("未配置 QWEN_API_KEY，请在 .env.local 中设置");
  }
  return key;
}
