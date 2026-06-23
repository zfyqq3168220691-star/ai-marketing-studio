"use client";

import { create } from "zustand";

export interface UploadImage {
  id: string;
  file: File;
  previewUrl: string;
  base64: string;
  mimeType: string;
}

interface UploadState {
  images: UploadImage[];
  productName: string;
  customSellingPoints: string;
  addImages: (images: UploadImage[]) => void;
  removeImage: (id: string) => void;
  clearImages: () => void;
  setProductName: (name: string) => void;
  setCustomSellingPoints: (points: string) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  images: [],
  productName: "",
  customSellingPoints: "",
  addImages: (newImages) =>
    set((state) => ({ images: [...state.images, ...newImages] })),
  removeImage: (id) =>
    set((state) => {
      const target = state.images.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return { images: state.images.filter((img) => img.id !== id) };
    }),
  clearImages: () =>
    set((state) => {
      state.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return { images: [] };
    }),
  setProductName: (name) => set({ productName: name }),
  setCustomSellingPoints: (points) => set({ customSellingPoints: points }),
  reset: () =>
    set((state) => {
      state.images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
      return { images: [], productName: "", customSellingPoints: "" };
    }),
}));
