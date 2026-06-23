"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { navTitleMap } from "@/config/nav";
import { cn } from "@/lib/utils";

export function Breadcrumb() {
  const pathname = usePathname();

  const isHome = pathname === "/";
  const currentTitle = navTitleMap[pathname];

  return (
    <nav
      aria-label="面包屑"
      className="flex items-center gap-1 px-4 py-3 text-sm text-muted-foreground"
    >
      <Link href="/" className="hover:text-foreground">
        首页
      </Link>

      {!isHome && currentTitle && (
        <>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className={cn("text-foreground")}>{currentTitle}</span>
        </>
      )}
    </nav>
  );
}
