"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download, Loader2, Sparkles, Trash2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { usePosterStore } from "@/store/poster-store";
import { useHistoryStore } from "@/store/history-store";
import { useAnalysisStore } from "@/store/analysis-store";

export default function PosterPage() {
  const versions = usePosterStore((s) => s.versions);
  const activeIndex = usePosterStore((s) => s.activeIndex);
  const error = usePosterStore((s) => s.error);
  const feedback = usePosterStore((s) => s.feedback);
  const status = usePosterStore((s) => s.status);

  const setFeedback = usePosterStore((s) => s.setFeedback);
  const regenerateWithFeedback = usePosterStore((s) => s.regenerateWithFeedback);
  const setActiveIndex = usePosterStore((s) => s.setActiveIndex);
  const removeVersion = usePosterStore((s) => s.removeVersion);

  const analysis = useAnalysisStore((s) => s.result);
  const addHistory = useHistoryStore((s) => s.add);

  const result = versions[activeIndex] ?? null;
  const loading = status === "loading";

  if (!result || versions.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">宣传海报</h2>
        <p className="text-sm text-muted-foreground">
          还没有生成海报，请先在工作台上传商品并开始生成。
        </p>
        <Button asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            前往工作台
          </Link>
        </Button>
      </div>
    );
  }

  const handleRegenerate = async () => {
    if (!feedback.trim()) return;
    await regenerateWithFeedback(feedback);
  };

  const handleSaveVersion = (plan: typeof result, index: number) => {
    addHistory({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productName: plan.headline,
      imagePreviews: [],
      imageBase64: [],
      imageMimeTypes: [],
      createdAt: new Date().toISOString(),
      analysis: analysis ?? { name: plan.headline, category: "", sellingPoints: [], targetUsers: [], scenes: [], advantages: [] },
      video: null,
      poster: plan,
      content: null,
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">宣传海报</h2>
        <p className="text-sm text-muted-foreground">
          {result.headline} · 版本 {activeIndex + 1}/{versions.length}
        </p>
      </div>

      {/* 版本缩略图切换 */}
      {versions.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {versions.map((v, i) => (
            <div key={i} className="group relative shrink-0">
              <button
                type="button"
                onClick={() => setActiveIndex(i)}
                className={cn(
                  "flex h-16 w-16 items-center justify-center overflow-hidden rounded-md border-2 transition-all",
                  i === activeIndex
                    ? "border-primary ring-1 ring-primary"
                    : "border-input hover:border-muted-foreground"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.imageUrl}
                  alt={`V${i + 1}`}
                  className="h-full w-full object-cover"
                />
              </button>
              <div className="mt-0.5 flex items-center justify-center gap-1">
                <span className="text-[10px] text-muted-foreground">V{i + 1}</span>
                <button
                  type="button"
                  onClick={() => handleSaveVersion(v, i)}
                  className="text-[10px] text-blue-500 hover:text-blue-700"
                  title="保存到历史记录"
                >
                  保存
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeVersion(i)}
                className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                aria-label={`删除版本 ${i + 1}`}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 只有一张时也显示保存按钮 */}
      {versions.length === 1 && (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSaveVersion(result, 0)}
          >
            <Save className="h-3.5 w-3.5" />
            保存当前海报到历史记录
          </Button>
        </div>
      )}

      {/* 海报展示 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">预览 · V{activeIndex + 1}</CardTitle>
          <Button asChild variant="outline" size="sm">
            <a
              href={result.imageUrl}
              download={`poster-${result.headline}-V${activeIndex + 1}.png`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Download className="h-3.5 w-3.5" />
              下载
            </a>
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative w-full max-w-md overflow-hidden rounded-lg border shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.imageUrl}
              alt={result.headline}
              className="h-auto w-full object-contain"
            />
          </div>

          {result.features && result.features.length > 0 && (
            <div className="grid w-full grid-cols-3 gap-4 border-t pt-4 text-center">
              {result.features.map((f, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-sm font-semibold">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.detail}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 反馈重新生成 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">重新生成</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            输入你对这版海报的建议，AI 会根据反馈调整后重新生成（最多保留 3 个版本）
          </p>
          <Textarea
            placeholder="例如：颜色太暖了，希望更冷一点；标题可以再小一些；背景加一些茉莉花装饰…"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            disabled={loading}
          />
          <div className="flex gap-2">
            <Button
              size="lg"
              className="flex-1"
              disabled={!feedback.trim() || loading}
              onClick={handleRegenerate}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在重新生成…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  根据建议重新生成
                </>
              )}
            </Button>
            <Button asChild variant="outline" size="lg" disabled={loading}>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                重新上传
              </Link>
            </Button>
          </div>
          {error && !loading && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
