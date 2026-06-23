import {
  LayoutDashboard,
  ScanSearch,
  Clapperboard,
  Image,
  FileText,
  History,
  Home,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

/** 导航单一数据源：被 Sidebar 与 Breadcrumb 共用 */
export const navItems: NavItem[] = [
  { title: "首页", href: "/", icon: Home },
  { title: "工作台", href: "/dashboard", icon: LayoutDashboard },
  { title: "商品分析", href: "/analyze", icon: ScanSearch },
  { title: "视频生成", href: "/video", icon: Clapperboard },
  { title: "海报生成", href: "/poster", icon: Image },
  { title: "文案生成", href: "/content", icon: FileText },
  { title: "历史记录", href: "/history", icon: History },
];

export const navTitleMap: Record<string, string> = Object.fromEntries(
  navItems.map((item) => [item.href, item.title])
);
