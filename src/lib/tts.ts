/**
 * 阿里云百炼 CosyVoice 非实时语音合成。
 *
 * 端点：POST https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer
 * 文档：https://help.aliyun.com/zh/model-studio/non-realtime-tts-user-guide
 */

const API_URL =
  "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer";
const TIMEOUT_MS = 60_000;

function getApiKey(): string {
  const key = process.env.QWEN_API_KEY;
  if (!key) throw new Error("未配置 QWEN_API_KEY");
  return key;
}

interface TtsResponse {
  output?: {
    audio?: { url?: string };
  };
}

/**
 * 将文本合成为 MP3 音频，返回音频 Buffer。
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getApiKey()}`,
      },
      body: JSON.stringify({
        model: "cosyvoice-v3-flash",
        input: {
          text,
          voice: "longanyang",
          format: "mp3",
          sample_rate: 24000,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`TTS 接口错误 ${res.status}: ${detail}`);
    }

    const body = (await res.json()) as TtsResponse;
    const audioUrl = body?.output?.audio?.url;
    if (!audioUrl) {
      throw new Error("TTS 未返回音频 URL");
    }

    // 下载音频文件
    const audioRes = await fetch(audioUrl, { signal: controller.signal });
    if (!audioRes.ok) {
      throw new Error(`下载音频失败 ${audioRes.status}`);
    }

    const buf = Buffer.from(await audioRes.arrayBuffer());
    if (buf.length < 100) {
      throw new Error("TTS 音频过短");
    }

    return buf;
  } finally {
    clearTimeout(timer);
  }
}
