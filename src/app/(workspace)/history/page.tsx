"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Trash2, Eye, ArrowLeft, Calendar, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHistoryStore, type HistoryRecord } from "@/store/history-store";
import { useAnalysisStore } from "@/store/analysis-store";
import { useVideoStore } from "@/store/video-store";
import { usePosterStore } from "@/store/poster-store";
import { useContentStore } from "@/store/content-store";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const router = useRouter();
  const records = useHistoryStore((s) => s.records);
  const remove = useHistoryStore((s) => s.remove);
  const load = useHistoryStore((s) => s.load);

  const loadAnalysis = useAnalysisStore((s) => s.loadFromHistory);
  const loadVideo = useVideoStore((s) => s.loadFromHistory);
  const loadPoster = usePosterStore((s) => s.loadFromHistory);
  const loadContent = useContentStore((s) => s.loadFromHistory);

  React.useEffect(() => {
    load();
  }, [load]);

  const handleView = (record: HistoryRecord, page: string) => {
    loadAnalysis(record.analysis);
    if (record.video) loadVideo(record.video, record.analysis);
    if (record.poster) {
      const images = record.imageBase64?.length
        ? record.imageBase64.map((b64, i) => ({
            base64: b64,
            mimeType: record.imageMimeTypes?.[i] ?? "image/jpeg",
          }))
        : undefined;
      loadPoster(record.poster, record.analysis, images);
    }
    if (record.content) loadContent(record.content, record.analysis);
    router.push(page);
  };

  if (records.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">历史记录</h2>
        <p className="text-sm text-muted-foreground">
          还没有历史记录，生成营销素材后会自动保存到这里。
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold">历史记录</h2>
          <p className="text-sm text-muted-foreground">
            共 {records.length} 条记录
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <Card key={record.id}>
            <CardContent className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-muted">
                {record.imagePreviews?.[0] ? (
                  <Image
                    src={record.imagePreviews[0]}
                    alt={record.productName}
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col justify-center gap-1">
                <p className="font-medium">{record.productName}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {formatDate(record.createdAt)}
                </p>
                <div className="flex flex-wrap gap-1">
                  {record.video && <span className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-600">视频</span>}
                  {record.poster && <span className="rounded bg-green-50 px-1.5 py-0.5 text-xs text-green-600">海报</span>}
                  {record.content && <span className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-600">文案</span>}
                </div>
              </div>

              <div className="flex shrink-0 flex-col justify-center gap-2">
                <div className="flex flex-wrap gap-1">
                  <Button variant="outline" size="sm" onClick={() => handleView(record, "/analyze")}>
                    <Eye className="h-3.5 w-3.5" />
                    分析
                  </Button>
                  {record.video && (
                    <Button variant="outline" size="sm" onClick={() => handleView(record, "/video")}>
                      <Eye className="h-3.5 w-3.5" />
                      视频
                    </Button>
                  )}
                  {record.poster && (
                    <Button variant="outline" size="sm" onClick={() => handleView(record, "/poster")}>
                      <Eye className="h-3.5 w-3.5" />
                      海报
                    </Button>
                  )}
                  {record.content && (
                    <Button variant="outline" size="sm" onClick={() => handleView(record, "/content")}>
                      <Eye className="h-3.5 w-3.5" />
                      文案
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => remove(record.id)} className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-3.5 w-3.5" />
                  删除
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
