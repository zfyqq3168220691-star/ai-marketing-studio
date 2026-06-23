"use client";

import { create } from "zustand";
import type { ContentPlan, ProductKnowledge } from "@/types";

type ContentStatus = "idle" | "loading" | "success" | "error";

interface ContentState {
  status: ContentStatus;
  result: ContentPlan | null;
  error: string | null;
  cachedKnowledge: ProductKnowledge | null;
  generate: (knowledge: ProductKnowledge) => Promise<boolean>;
  /** 从历史记录加载 */
  loadFromHistory: (plan: ContentPlan, knowledge: ProductKnowledge) => void;
  reset: () => void;
}

export const useContentStore = create<ContentState>((set) => ({
  status: "idle",
  result: null,
  error: null,
  cachedKnowledge: null,
  generate: async (knowledge) => {
    set({ status: "loading", error: null });
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ knowledge }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        set({
          status: "error",
          error: body.error ?? "文案生成失败，请重新尝试",
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
