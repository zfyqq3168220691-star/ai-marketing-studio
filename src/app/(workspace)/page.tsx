import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sparkles, Clapperboard, ImageIcon, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const capabilities = [
  {
    icon: Clapperboard,
    title: "AI 视频生成",
    desc: "3 镜头叙事型短视频，AI 配音，商品展示 + 场景化表达",
  },
  {
    icon: ImageIcon,
    title: "AI 商品海报",
    desc: "极简高级感电商海报，色彩由商品决定，支持反馈优化",
  },
  {
    icon: FileText,
    title: "营销文案",
    desc: "抖音、小红书、电商详情三套文案，一键复制使用",
  },
];

const steps = [
  { num: "01", title: "上传商品", desc: "上传商品图片，填写名称与核心卖点" },
  { num: "02", title: "AI 分析", desc: "自动分析商品知识卡，可编辑修改" },
  { num: "03", title: "选择生成", desc: "按需勾选视频、海报、文案" },
  { num: "04", title: "导出使用", desc: "预览、下载、保存到历史记录" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6 lg:px-12">
        <div className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={28} height={28} />
          <span className="text-sm font-semibold">AI素材工厂</span>
        </div>
        <Button asChild size="sm">
          <Link href="/dashboard">
            开始使用
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </Button>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-20 pb-16 text-center lg:pt-28 lg:pb-20">
        <div className="mx-auto max-w-3xl space-y-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            上传商品图片
            <br />
            <span className="text-primary">AI 一键生成营销素材</span>
          </h1>
          <p className="mx-auto max-w-xl text-base text-muted-foreground sm:text-lg">
            不再需要设计团队和视频剪辑。上传商品图片和名称，自动生成宣传视频、海报和营销文案。
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="gap-2">
              <Link href="/dashboard">
                <Sparkles className="h-4 w-4" />
                免费开始生成
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/history">
                查看案例
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 能力卡片 */}
      <section className="px-6 pb-16 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">我们能做什么</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {capabilities.map((cap) => {
              const Icon = cap.icon;
              return (
                <Card key={cap.title} className="border-0 bg-background shadow-sm">
                  <CardHeader>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="mt-2 text-base">{cap.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{cap.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 使用流程 */}
      <section className="bg-muted/50 px-6 py-16 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-2xl font-bold">四步完成</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step) => (
              <div key={step.num} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step.num}
                </div>
                <h3 className="mb-1 font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center lg:px-12">
        <div className="mx-auto max-w-xl space-y-4">
          <h2 className="text-2xl font-bold">现在就试试</h2>
          <p className="text-sm text-muted-foreground">
            不花一分钱，上传一张商品图片就能看到 AI 的效果
          </p>
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Sparkles className="h-4 w-4" />
              开始生成
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t px-6 py-6 text-center text-xs text-muted-foreground lg:px-12">
        AI商品营销素材工厂 · MVP
      </footer>
    </div>
  );
}
