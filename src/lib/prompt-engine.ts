/**
 * Prompt Engine —— "执行导演"。
 *
 * 将 DeepSeek 输出的分镜中的 imagePrompt 翻译为实际的 AI 生成调用：
 *   1. 所有涉及产品的镜头均传入原图参考，保证产品不走样
 *   2. 叙事/人物镜头用 Seedream 5.0 图生图（保留原产品外观）
 *   3. 产品特写镜头用 Qwen-Image 多模态
 *   4. 配图 → 通义万相 i2v（并行加速）→ FFmpeg 拼接
 */

import { qwenImage } from "@/lib/qwen";

import { wanImageToVideo } from "@/lib/wan";
import { textToSpeech } from "@/lib/tts";
import type { StoryboardItem, ShotResult } from "@/types";
import { execFile } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

const SHOT_DURATION = 3;
const TEMP_DIR = path.join(os.tmpdir(), "ai-marketing-video");

function getFfmpegPath(): string | null {
  // 1. 环境变量覆盖
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;

  // 2. Linux 系统路径（Railway 通过 apt-get 安装的位置）
  const linuxPaths = ["/usr/bin/ffmpeg", "/usr/local/bin/ffmpeg"];
  for (const p of linuxPaths) {
    if (fs.existsSync(p)) return p;
  }

  // 3. Windows 本地开发路径
  const localPath = path.join(process.cwd(), "tools", "ffmpeg.exe");
  if (fs.existsSync(localPath)) return localPath;

  return null;
}

async function tryConcat(inputPaths: string[], outputPath: string): Promise<boolean> {
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) return false;
  if (inputPaths.length < 1) return false;

  try {
    if (inputPaths.length === 1) {
      await new Promise<void>((resolve, reject) => {
        execFile(ffmpegPath, ["-i", inputPaths[0], "-c", "copy", "-y", outputPath], { timeout: 30000 }, (err) => {
          if (err) reject(err); else resolve();
        });
      });
      return true;
    }

    // 多段拼接：先转 TS 再 concat demuxer（TS 格式最容易拼接，不要求编码参数一致）
    const tsPaths: string[] = [];
    for (let i = 0; i < inputPaths.length; i++) {
      const tsPath = path.join(TEMP_DIR, `clip_${Date.now()}_${i}.ts`);
      await new Promise<void>((resolve, reject) => {
        execFile(ffmpegPath, [
          "-i", inputPaths[i],
          "-c", "copy",
          "-bsf:v", "h264_mp4toannexb",
          "-f", "mpegts",
          "-y", tsPath,
        ], { timeout: 30000 }, (err) => {
          if (err) reject(err); else resolve();
        });
      });
      tsPaths.push(tsPath);
    }

    // 创建 concat 文件列表
    const listContent = tsPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n");
    const listPath = path.join(TEMP_DIR, `concat_${Date.now()}.txt`);
    fs.writeFileSync(listPath, listContent);

    await new Promise<void>((resolve, reject) => {
      execFile(ffmpegPath, [
        "-f", "concat",
        "-safe", "0",
        "-i", listPath,
        "-c", "copy",
        "-y", outputPath,
      ], { timeout: 60000 }, (err) => {
        if (err) reject(err); else resolve();
      });
    });

    // 清理 ts 临时文件
    for (const ts of tsPaths) { try { fs.unlinkSync(ts); } catch { /* ignore */ } }
    try { fs.unlinkSync(listPath); } catch { /* ignore */ }

    return true;
  } catch {
    return false;
  }
}

/**
 * 步骤 1：为每个镜头生成配图。
 * - 所有镜头都尽可能传入原图作为参考，保证产品不走样
 * - 产品特写 → Qwen-Image 多模态
 * - 叙事镜头 → Seedream 5.0 图生图（保留原产品外观）
 * - 无等待间隔，并行加速
 */
async function generateShotImages(
  storyboard: StoryboardItem[],
  userProductBase64?: string,
  userProductMime?: string
): Promise<{ shot: StoryboardItem; imageUrl: string }[]> {
  const results: { shot: StoryboardItem; imageUrl: string }[] = [];

  for (let i = 0; i < storyboard.length; i++) {
    const shot = storyboard[i];
    let imageUrl = "";

    try {
      if (isProductShot(shot.camera) && userProductBase64 && userProductMime) {
        imageUrl = await qwenImage(shot.imagePrompt, {
          referenceImages: [userProductBase64],
          referenceMimeTypes: [userProductMime],
        });
      } else if (userProductBase64 && userProductMime) {
        imageUrl = await qwenImage(shot.imagePrompt, {
          referenceImages: [userProductBase64],
          referenceMimeTypes: [userProductMime],
        });
      } else {
        const { seedreamTextToImage } = await import("@/lib/jimeng");
        imageUrl = await seedreamTextToImage(shot.imagePrompt);
      }
    } catch (err) {
      console.warn(`镜头 ${shot.shot} 生图失败:`, err);
    }

    results.push({ shot, imageUrl });
  }

  return results;
}

function isProductShot(camera: string): boolean {
  return camera === "product close-up" || camera === "product_close-up";
}

function isNarrativeShot(camera: string): boolean {
  return ["close-up", "medium shot", "wide shot"].includes(camera);
}

/**
 * 步骤 2：串行将每个镜头的配图转为 3 秒短视频（避免限流）
 */
async function generateShotVideos(
  shots: { shot: StoryboardItem; imageUrl: string }[]
): Promise<ShotResult[]> {
  const tasks = shots.map(async ({ shot, imageUrl }) => {
    try {
      const imgRes = await fetch(imageUrl);
      const imgBuf = Buffer.from(await imgRes.arrayBuffer());
      const base64 = imgBuf.toString("base64");
      const mime = "image/png";
      const videoPrompt = `${shot.scene}, ${shot.camera}, smooth gentle motion, cinematic shallow depth of field, warm golden lighting, soft background bokeh, premium commercial quality, stable natural movement`;
      const videoUrl = await wanImageToVideo(base64, mime, videoPrompt, SHOT_DURATION);
      return { shot: shot.shot, imageUrl, videoUrl } as ShotResult;
    } catch {
      return { shot: shot.shot, imageUrl } as ShotResult;
    }
  });
  return Promise.all(tasks);
}

async function tryConcatVideos(shotResults: ShotResult[]): Promise<string | null> {
  const videoResults = shotResults.filter((r) => r.videoUrl);
  if (videoResults.length === 0) return null;

  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const inputPaths: string[] = [];

  for (const r of videoResults) {
    try {
      const res = await fetch(r.videoUrl!);
      const buf = Buffer.from(await res.arrayBuffer());
      const tmpPath = path.join(TEMP_DIR, `clip_${r.shot}.mp4`);
      fs.writeFileSync(tmpPath, buf);
      inputPaths.push(tmpPath);
    } catch { /* skip */ }
  }

  if (inputPaths.length === 1) {
    // 只有一段视频，直接返回
    const buf = fs.readFileSync(inputPaths[0]);
    return `data:video/mp4;base64,${buf.toString("base64")}`;
  }

  const outputPath = path.join(TEMP_DIR, `final_${Date.now()}.mp4`);
  const ok = await tryConcat(inputPaths, outputPath);
  if (!ok) return null;

  const outputBuf = fs.readFileSync(outputPath);
  return `data:video/mp4;base64,${outputBuf.toString("base64")}`;
}

/** 生成配音并合并到视频 */
async function mergeAudioToVideo(videoDataUrl: string, text: string): Promise<string> {
  // 1. 生成 TTS 音频
  const audioBuf = await textToSpeech(text);

  // 2. 把 data:video URL 转为临时文件
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  const base64Data = videoDataUrl.split(",")[1];
  const videoBuf = Buffer.from(base64Data, "base64");
  const videoPath = path.join(TEMP_DIR, `video_${Date.now()}.mp4`);
  const audioPath = path.join(TEMP_DIR, `audio_${Date.now()}.mp3`);
  const outputPath = path.join(TEMP_DIR, `merged_${Date.now()}.mp4`);
  fs.writeFileSync(videoPath, videoBuf);
  fs.writeFileSync(audioPath, audioBuf);

  // 3. FFmpeg 合并音视频
  const ffmpegPath = getFfmpegPath();
  if (!ffmpegPath) throw new Error("FFmpeg not available");

  await new Promise<void>((resolve, reject) => {
    const args = [
      "-i", videoPath,
      "-i", audioPath,
      "-c:v", "copy",
      "-c:a", "aac",
      "-map", "0:v:0",
      "-map", "1:a:0",
      "-shortest",
      "-y", outputPath,
    ];
    execFile(ffmpegPath, args, { timeout: 30000 }, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });

  const mergedBuf = fs.readFileSync(outputPath);
  return `data:video/mp4;base64,${mergedBuf.toString("base64")}`;
}

/** 完整流水线：配图 → 并行短片 → 拼接 */
export async function runVideoPipeline(
  storyboard: StoryboardItem[],
  voiceover?: string,
  userProductBase64?: string,
  userProductMime?: string
): Promise<{ shotResults: ShotResult[]; finalVideoUrl?: string }> {
  const shots = await generateShotImages(storyboard.slice(0, 3), userProductBase64, userProductMime);
  const shotResults = await generateShotVideos(shots);
  let finalVideoUrl = await tryConcatVideos(shotResults);

  // 尝试配音（TTS + FFmpeg 合并到视频）
  if (finalVideoUrl && voiceover?.trim()) {
    try {
      finalVideoUrl = await mergeAudioToVideo(finalVideoUrl, voiceover.trim());
    } catch (err) {
      console.warn("配音失败，保留无声视频:", err);
    }
  }

  return { shotResults, finalVideoUrl: finalVideoUrl ?? undefined };
}
