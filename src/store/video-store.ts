"use client";

import { create } from "zustand";
import type { ProductKnowledge, VideoPlan } from "@/types";

/** 前端上传图片的 base64 + mime 信息 */
export interface ImageInput {
  base64: string;
  mimeType: string;
}

type VideoStatus = "idle" | "loading" | "success" | "error";

interface VideoState {
  status: VideoStatus;
  result: VideoPlan | null;
  error: string | null;
  cachedKnowledge: ProductKnowledge | null;
  generate: (knowledge: ProductKnowledge, images?: ImageInput[]) => Promise<boolean>;
  /** 从历史记录加载（不调 API） */
  loadFromHistory: (plan: VideoPlan, knowledge: ProductKnowledge) => void;
  reset: () => void;
}

export const useVideoStore = create<VideoState>((set) => ({
  status: "idle",
  result: null,
  error: null,
  cachedKnowledge: null,
  generate: async (knowledge, images) => {
    set({ status: "loading", error: null });
    try {
      const res = await fetch("/api/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledge,
          images: images?.map((i) => i.base64),
          imageMimeTypes: images?.map((i) => i.mimeType),
        }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        set({
          status: "error",
          error: body.error ?? "视频方案生成失败，请重新尝试",
        });
        return false;
      }

      set({ status: "success", result: body.data, error: null, cachedKnowledge: knowledge });
      return true;
    } catch {
      set({ status: "error", error: "网络异常，请重新尝试" });
      return false;
    }
  },
  loadFromHistory: (plan, knowledge) =>
    set({ status: "success", result: plan, error: null, cachedKnowledge: knowledge }),
  reset: () => set({ status: "idle", result: null, error: null, cachedKnowledge: null }),
}));
