"use client";

import { create } from "zustand";
import type { ProductKnowledge, VideoPlan, PosterPlan, ContentPlan } from "@/types";

const STORAGE_KEY = "ai-marketing-history";

export interface HistoryRecord {
  id: string;
  productName: string;
  imagePreviews: string[];
  imageBase64: string[];
  imageMimeTypes: string[];
  createdAt: string;
  analysis: ProductKnowledge;
  video: VideoPlan | null;
  poster: PosterPlan | null;
  content: ContentPlan | null;
}

interface HistoryState {
  records: HistoryRecord[];
  load: () => void;
  add: (record: HistoryRecord) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export function saveToDisk(records: HistoryRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // localStorage 可能满或不可用
  }
}

export function loadFromDisk(): HistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as HistoryRecord[];
  } catch {
    return [];
  }
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  records: [],
  load: () => set({ records: loadFromDisk() }),
  add: (record) =>
    set((state) => {
      const records = [record, ...state.records];
      saveToDisk(records);
      return { records };
    }),
  remove: (id) =>
    set((state) => {
      const records = state.records.filter((r) => r.id !== id);
      saveToDisk(records);
      return { records };
    }),
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ records: [] });
  },
}));
