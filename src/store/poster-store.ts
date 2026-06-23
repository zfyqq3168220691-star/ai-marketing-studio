"use client";

import { create } from "zustand";
import type { PosterPlan, ProductKnowledge } from "@/types";

const MAX_VERSIONS = 3;

type PosterStatus = "idle" | "loading" | "success" | "error";

export interface ImageInput {
  base64: string;
  mimeType: string;
}

interface PosterState {
  status: PosterStatus;
  /** 多版本保存，[0] = 最新 */
  versions: PosterPlan[];
  /** 当前展示的是第几个版本（索引） */
  activeIndex: number;
  error: string | null;
  feedback: string;
  cachedKnowledge: ProductKnowledge | null;
  cachedImages: ImageInput[];

  generate: (knowledge: ProductKnowledge, images?: ImageInput[]) => Promise<boolean>;
  regenerateWithFeedback: (feedback: string) => Promise<boolean>;
  setFeedback: (text: string) => void;
  /** 切换到某个版本 */
  setActiveIndex: (index: number) => void;
  /** 删除某个版本 */
  removeVersion: (index: number) => boolean;
  loadFromHistory: (plan: PosterPlan, knowledge: ProductKnowledge, images?: ImageInput[]) => void;
  reset: () => void;
}

export const usePosterStore = create<PosterState>((set, get) => ({
  status: "idle",
  versions: [],
  activeIndex: 0,
  error: null,
  feedback: "",
  cachedKnowledge: null,
  cachedImages: [],

  generate: async (knowledge, images) => {
    set({ status: "loading", error: null });
    try {
      const res = await fetch("/api/poster", {
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
        set({ status: "error", error: body.error ?? "海报生成失败，请重新尝试" });
        return false;
      }

      const plan = body.data as PosterPlan;
      set({
        status: "success",
        versions: [plan],
        activeIndex: 0,
        error: null,
        cachedKnowledge: knowledge,
        cachedImages: images ?? [],
      });
      return true;
    } catch {
      set({ status: "error", error: "网络异常，请重新尝试" });
      return false;
    }
  },

  regenerateWithFeedback: async (feedback) => {
    const state = get();
    const knowledge = state.cachedKnowledge;
    const images = state.cachedImages;
    if (!feedback.trim()) return false;
    if (!knowledge) {
      set({ status: "error", error: "缺少商品知识卡数据，请重新从工作台开始" });
      return false;
    }

    if (state.versions.length >= MAX_VERSIONS) {
      set({
        status: "error",
        error: `已达版本上限（${MAX_VERSIONS} 个），请先删除一个旧版本再重新生成`,
      });
      return false;
    }

    set({ status: "loading", error: null });
    try {
      const res = await fetch("/api/poster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          knowledge,
          feedback: feedback.trim(),
          images: images?.map((i) => i.base64),
          imageMimeTypes: images?.map((i) => i.mimeType),
        }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        set({ status: "error", error: body.error ?? "海报重新生成失败，请重试" });
        return false;
      }

      const newPlan = body.data as PosterPlan;
      const newVersions = [newPlan, ...state.versions];

      set({
        status: "success",
        versions: newVersions,
        activeIndex: 0,
        error: null,
        cachedImages: images,
      });

      return true;
    } catch {
      set({ status: "error", error: "网络异常，请重新尝试" });
      return false;
    }
  },

  setFeedback: (text) => set({ feedback: text }),

  setActiveIndex: (index) => {
    const { versions } = get();
    if (index < 0 || index >= versions.length) return;
    set({ activeIndex: index });
  },

  removeVersion: (index) => {
    const { versions, activeIndex } = get();
    if (index < 0 || index >= versions.length) return false;
    if (versions.length <= 1) return false;
    const newVersions = versions.filter((_, i) => i !== index);
    const newActiveIndex = Math.min(activeIndex, newVersions.length - 1);
    set({ versions: newVersions, activeIndex: newActiveIndex });
    return true;
  },

  loadFromHistory: (plan, knowledge, images) =>
    set({
      status: "success",
      versions: [plan],
      activeIndex: 0,
      error: null,
      cachedKnowledge: knowledge,
      cachedImages: images ?? [],
    }),

  reset: () =>
    set({
      status: "idle",
      versions: [],
      activeIndex: 0,
      error: null,
      feedback: "",
      cachedKnowledge: null,
      cachedImages: [],
    }),
}));
