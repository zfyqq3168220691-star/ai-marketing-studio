"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, Plus, Loader2, Sparkles, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAnalysisStore } from "@/store/analysis-store";
import { useVideoStore } from "@/store/video-store";
import { usePosterStore } from "@/store/poster-store";
import { useContentStore } from "@/store/content-store";
import { useUploadStore } from "@/store/upload-store";
import { useHistoryStore } from "@/store/history-store";

const GENERATE_OPTIONS = [
  { key: "video" as const, label: "视频方案", desc: "标题、脚本、分镜 + AI 生成短视频", time: "约 1-2 分钟" },
  { key: "poster" as const, label: "宣传海报", desc: "主标题、卖点三栏、AI 生成海报图", time: "约 40 秒" },
  { key: "content" as const, label: "营销文案", desc: "抖音文案、小红书文案、商品详情文案", time: "约 3 秒" },
] as const;

type OptionKey = (typeof GENERATE_OPTIONS)[number]["key"];

export default function AnalyzePage() {
  const router = useRouter();

  const status = useAnalysisStore((s) => s.status);
  const result = useAnalysisStore((s) => s.result);
  const updateTextField = useAnalysisStore((s) => s.updateTextField);
  const updateArrayField = useAnalysisStore((s) => s.updateArrayField);
  const addArrayItem = useAnalysisStore((s) => s.addArrayItem);
  const removeArrayItem = useAnalysisStore((s) => s.removeArrayItem);

  const uploadImages = useUploadStore((s) => s.images);

  const generateVideo = useVideoStore((s) => s.generate);
  const generatePoster = usePosterStore((s) => s.generate);
  const generateContent = useContentStore((s) => s.generate);

  const addHistory = useHistoryStore((s) => s.add);
  

  const [generating, setGenerating] = React.useState(false);
  const [genError, setGenError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Set<OptionKey>>(
    new Set(["video", "poster", "content"])
  );

  const toggle = (key: OptionKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const noSelection = selected.size === 0;

  if (status !== "success" || !result) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">商品分析</h2>
        <p className="text-sm text-muted-foreground">
          还没有分析结果，请先在工作台上传商品并开始分析。
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

  const error = genError;

  const fields: Array<{
    key: "sellingPoints" | "targetUsers" | "scenes" | "advantages";
    label: string;
  }> = [
    { key: "sellingPoints", label: "核心卖点" },
    { key: "targetUsers", label: "目标用户" },
    { key: "scenes", label: "使用场景" },
    { key: "advantages", label: "产品优势" },
  ];

  const handleGenerate = async () => {
    if (noSelection) return;
    setGenerating(true);
    setGenError(null);

    const knowledge = { ...result };
    const tasks: Promise<boolean>[] = [];

    if (selected.has("video")) {
      const videoImages = uploadImages.map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }));
      tasks.push(generateVideo(knowledge, videoImages));
    }
    if (selected.has("poster")) {
      const posterImages = uploadImages.map((img) => ({
        base64: img.base64,
        mimeType: img.mimeType,
      }));
      tasks.push(generatePoster(knowledge, posterImages));
    }
    if (selected.has("content")) tasks.push(generateContent(knowledge));

    const results = await Promise.all(tasks);
    const allOk = results.every(Boolean);

    if (!allOk) {
      setGenError("部分素材生成失败，请重试");
      setGenerating(false);
      return;
    }

    // 保存到历史记录
    const videoState = useVideoStore.getState();
    const posterState = usePosterStore.getState();
    const contentState = useContentStore.getState();

    const historyId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    addHistory({
      id: historyId,
      productName: knowledge.name,
      imagePreviews: uploadImages.map((img) => img.previewUrl),
      imageBase64: uploadImages.map((img) => img.base64),
      imageMimeTypes: uploadImages.map((img) => img.mimeType),
      createdAt: new Date().toISOString(),
      analysis: knowledge,
      video: videoState.result,
      poster: posterState.versions[0] ?? null,
      content: contentState.result,
    });

    // 关联历史记录 ID，便于海报重新生成后同步
    if (selected.has("poster")) {
    }

    const firstSelected = selected.has("video")
      ? "/video"
      : selected.has("poster")
        ? "/poster"
        : "/content";
    router.push(firstSelected);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">商品分析</h2>
        <p className="text-sm text-muted-foreground">
          核对并修改分析结果，选择要生成的素材
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="edit-name">商品名称</Label>
          <Input
            id="edit-name"
            value={result.name}
            onChange={(e) => updateTextField("name", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="edit-category">商品类别</Label>
          <Input
            id="edit-category"
            value={result.category}
            onChange={(e) => updateTextField("category", e.target.value)}
          />
        </div>
      </div>

      {fields.map(({ key, label }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{label}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result[key].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const updated = [...result[key]];
                    updated[i] = e.target.value;
                    updateArrayField(key, updated);
                  }}
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem(key, i)}
                  className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={`删除${label}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={() => addArrayItem(key, "")}
            >
              <Plus className="h-3.5 w-3.5" />
              添加
            </Button>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择要生成的营销素材</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {GENERATE_OPTIONS.map((opt) => {
            const isSelected = selected.has(opt.key);
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggle(opt.key)}
                disabled={generating}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-accent",
                )}
              >
                <div
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input"
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.desc}</p>
                </div>
                <span className="text-xs text-muted-foreground">{opt.time}</span>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={generating || noSelection}
        onClick={handleGenerate}
      >
        {generating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            正在生成营销素材…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            生成所选素材（{selected.size} 项）
          </>
        )}
      </Button>
    </div>
  );
}
