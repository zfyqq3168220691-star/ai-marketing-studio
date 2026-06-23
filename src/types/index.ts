// 类型占位（来源：SAD 数据结构设计）
// Sprint1 仅声明骨架，字段在后续 Sprint 按模块补全，作为全局统一类型来源。

/** 商品知识卡：所有内容生成的唯一数据源 */
export interface Product {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  sellingPoints: string[];
  targetUsers: string[];
  scenes: string[];
  createdAt: string;
}

/** AI 商品分析结果（来源：SAD ProductKnowledge / 需求确认文档九） */
export interface ProductKnowledge {
  name: string;
  category: string;
  sellingPoints: string[];
  targetUsers: string[];
  scenes: string[];
  advantages: string[];
}

/** 统一 API 响应包络（PROJECT_CONTEXT 原则5：统一API规范） */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 视频素材 */
export interface VideoAsset {
  id: string;
  productId: string;
  title: string;
  script: string;
  /** 分镜列表 */
  storyboard: StoryboardItem[];
  voiceover: string;
  subtitle: string;
  createdAt: string;
}

/** 单个分镜（增强版，含 AI 生成指令） */
export interface StoryboardItem {
  shot: number;
  scene: string;
  subtitle: string;
  durationSec: number;
  /** Qwen-Image 文生图/图生图提示词 */
  imagePrompt: string;
  /** 镜头类型（close-up / medium shot / wide shot） */
  camera: string;
}

/** 单镜头生成结果（图片 + 视频） */
export interface ShotResult {
  shot: number;
  imageUrl: string;
  videoUrl?: string;
}

/** 视频方案（API 实时输出） */
export interface VideoPlan {
  title: string;
  script: string;
  storyboard: StoryboardItem[];
  voiceover: string;
  subtitle: string;
  /** 通义万相生成的最终拼接视频 MP4 URL */
  videoUrl?: string;
  /** 每个镜头的独立素材 */
  shotResults?: ShotResult[];
}

/** 海报素材 */
export interface PosterAsset {
  id: string;
  productId: string;
  posterUrl: string;
  headline: string;
  subHeadline: string;
  createdAt: string;
}

/** 单条卖点项（标题+介绍） */
export interface FeatureItem {
  title: string;
  detail: string;
}

/** 海报方案（API 实时输出） */
export interface PosterPlan {
  headline: string;
  /** 三栏卖点列表 */
  features: FeatureItem[];
  imageUrl: string;
}

/** 营销文案素材 */
export interface ContentAsset {
  id: string;
  productId: string;
  douyinCopy: string;
  xiaohongshuCopy: string;
  productDescription: string;
  createdAt: string;
}

/** 文案方案（API 实时输出） */
export interface ContentPlan {
  douyinCopy: string;
  xiaohongshuCopy: string;
  productDescription: string;
}
