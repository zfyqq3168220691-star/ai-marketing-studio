"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";
import { useContentStore } from "@/store/content-store";

export default function ContentPage() {
  const status = useContentStore((s) => s.status);
  const result = useContentStore((s) => s.result);

  if (status !== "success" || !result) {
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <h2 className="text-2xl font-bold">营销文案</h2>
        <p className="text-sm text-muted-foreground">
          还没有生成文案，请先在工作台上传商品并开始生成。
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

  const sections: { title: string; content: string }[] = [
    { title: "抖音文案", content: result.douyinCopy },
    { title: "小红书文案", content: result.xiaohongshuCopy },
    { title: "商品详情文案", content: result.productDescription },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">营销文案</h2>
        <p className="text-sm text-muted-foreground">
          三套文案已就绪，点击复制即可使用
        </p>
      </div>

      {sections.map((section) => (
        <Card key={section.title}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{section.title}</CardTitle>
            <CopyButton text={section.content} label="复制全文" />
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground font-sans">
              {section.content}
            </pre>
          </CardContent>
        </Card>
      ))}

      <Button asChild variant="outline">
        <Link href="/dashboard">
          <ArrowLeft className="h-4 w-4" />
          重新生成
        </Link>
      </Button>
    </div>
  );
}
