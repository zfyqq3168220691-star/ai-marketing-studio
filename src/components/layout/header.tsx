"use client";

import { usePathname } from "next/navigation";
import { PanelLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useUIStore } from "@/store/ui-store";
import { navTitleMap } from "@/config/nav";

export function Header() {
  const pathname = usePathname();
  const toggleSidebar = useUIStore((state) => state.toggleSidebar);

  const title = navTitleMap[pathname] ?? "AI商品营销素材工厂";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label="切换侧边栏"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-semibold">{title}</h1>
      </div>

      {/* 占位操作区：Sprint1 不绑定动作 */}
      <div className="flex items-center gap-2" />
    </header>
  );
}
