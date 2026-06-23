"use client";

import { create } from "zustand";

import type { ProductKnowledge } from "@/types";

type AnalysisStatus = "idle" | "loading" | "success" | "error";

interface AnalysisState {
  status: AnalysisStatus;
  result: ProductKnowledge | null;
  error: string | null;
  analyze: (productName: string, customSellingPoints?: string) => Promise<ProductKnowledge | null>;
  updateTextField: (field: "name" | "category", value: string) => void;
  updateArrayField: (field: "sellingPoints" | "targetUsers" | "scenes" | "advantages", items: string[]) => void;
  addArrayItem: (field: "sellingPoints" | "targetUsers" | "scenes" | "advantages", item: string) => void;
  removeArrayItem: (field: "sellingPoints" | "targetUsers" | "scenes" | "advantages", index: number) => void;
  /** 从历史记录加载 */
  loadFromHistory: (knowledge: ProductKnowledge) => void;
  clearError: () => void;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  status: "idle",
  result: null,
  error: null,
  analyze: async (productName, customSellingPoints) => {
    set({ status: "loading", error: null });
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, customSellingPoints }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        set({
          status: "error",
          error: body.error ?? "商品分析失败，请重新尝试",
        });
        return null;
      }

      set({ status: "success", result: body.data, error: null });
      return body.data as ProductKnowledge;
    } catch {
      set({ status: "error", error: "网络异常，请重新尝试" });
      return null;
    }
  },
  updateTextField: (field, value) =>
    set((state) => {
      if (!state.result) return state;
      return { result: { ...state.result, [field]: value } };
    }),
  updateArrayField: (field, items) =>
    set((state) => {
      if (!state.result) return state;
      return { result: { ...state.result, [field]: items } };
    }),
  addArrayItem: (field, item) =>
    set((state) => {
      if (!state.result) return state;
      const arr = [...state.result[field], item];
      return { result: { ...state.result, [field]: arr } };
    }),
  removeArrayItem: (field, index) =>
    set((state) => {
      if (!state.result) return state;
      const arr = state.result[field].filter((_, i) => i !== index);
      return { result: { ...state.result, [field]: arr } };
    }),
  loadFromHistory: (knowledge) => set({ status: "success", result: knowledge, error: null }),
  clearError: () => set({ error: null }),
  reset: () => set({ status: "idle", result: null, error: null }),
}));
