import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI商品营销素材工厂",
  description: "上传商品图片，一键生成视频脚本、海报与营销文案",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
