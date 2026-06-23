"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUploader } from "@/components/upload/image-uploader";
import { useUploadStore } from "@/store/upload-store";
import { useAnalysisStore } from "@/store/analysis-store";
import { UPLOAD_CONFIG } from "@/config/upload";

export function ProductForm() {
  const router = useRouter();

  const images = useUploadStore((s) => s.images);
  const productName = useUploadStore((s) => s.productName);
  const customSellingPoints = useUploadStore((s) => s.customSellingPoints);
  const setProductName = useUploadStore((s) => s.setProductName);
  const setCustomSellingPoints = useUploadStore((s) => s.setCustomSellingPoints);

  const analysisStatus = useAnalysisStore((s) => s.status);
  const analysisError = useAnalysisStore((s) => s.error);
  const analyze = useAnalysisStore((s) => s.analyze);

  const loading = analysisStatus === "loading";

  const canSubmit =
    images.length >= UPLOAD_CONFIG.minFiles &&
    productName.trim().length > 0 &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const knowledge = await analyze(
      productName.trim(),
      customSellingPoints.trim() || undefined
    );
    if (knowledge) {
      router.push("/analyze");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="product-images">商品图片</Label>
        <ImageUploader />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-name">商品名称</Label>
        <Input
          id="product-name"
          placeholder="例如：无线蓝牙耳机"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          maxLength={50}
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="custom-selling-points">
          核心卖点 <span className="text-xs text-muted-foreground">（选填，AI 会重点分析这些方向）</span>
        </Label>
        <Input
          id="custom-selling-points"
          placeholder="例如：IPX7防水、专利耳挂设计、记忆海绵耳塞"
          value={customSellingPoints}
          onChange={(e) => setCustomSellingPoints(e.target.value)}
          maxLength={200}
          disabled={loading}
        />
      </div>

      {analysisError && <p className="text-sm text-red-500">{analysisError}</p>}

      <Button type="submit" size="lg" disabled={!canSubmit} className="w-full">
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            正在分析商品…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            开始分析
          </>
        )}
      </Button>
    </form>
  );
}
