"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVideoStore } from "@/store/video-store";

export default function VideoPage() {
  const status = useVideoStore((s) => s.status);
  const result = useVideoStore((s) => s.result);

  if (status !== "success" || !result) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">商品视频</h2>
        <p className="text-sm text-muted-foreground">
          还没有生成视频，请先在工作台上传商品并开始生成。
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">{result.title}</h2>
      </div>

      {/* 只展示合成后的视频，不展示分镜素材 */}
      {result.videoUrl ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">商品视频</CardTitle>
            <Button asChild variant="outline" size="sm">
              <a
                href={result.videoUrl}
                download={`video-${result.title}.mp4`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Download className="h-3.5 w-3.5" />
                下载视频
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            <video
              src={result.videoUrl}
              controls
              autoPlay
              muted
              loop
              className="w-full rounded-lg border shadow-lg"
              style={{ aspectRatio: "1/1", maxWidth: "100%" }}
            >
              您的浏览器不支持视频播放
            </video>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              视频正在合成中，请稍后刷新查看
            </p>
          </CardContent>
        </Card>
      )}

      <Button asChild variant="outline">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          重新生成
        </Link>
      </Button>
    </div>
  );
}
