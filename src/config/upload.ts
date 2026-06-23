/** 上传约束（来源：需求确认文档六 / SAD 八） */
export const UPLOAD_CONFIG = {
  maxFiles: 5,
  minFiles: 1,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"] as const,
  acceptAttr: "image/jpeg,image/png,image/webp",
} as const;

export const UPLOAD_ERROR = {
  type: "仅支持 JPG / PNG / WEBP 格式",
  size: "单张图片不能超过 10MB",
  count: "最多上传 5 张图片",
} as const;
