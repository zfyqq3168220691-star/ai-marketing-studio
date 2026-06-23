"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { UPLOAD_CONFIG, UPLOAD_ERROR } from "@/config/upload";
import { useUploadStore, type UploadImage } from "@/store/upload-store";

/** 生成本地预览用的唯一 id */
function makeId(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

/** File → base64 */
function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ImageUploader() {
  const images = useUploadStore((s) => s.images);
  const addImages = useUploadStore((s) => s.addImages);
  const removeImage = useUploadStore((s) => s.removeImage);

  const [dragging, setDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const remainingSlots = UPLOAD_CONFIG.maxFiles - images.length;

  const handleFiles = React.useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);

      const incoming = Array.from(fileList);
      const accepted: UploadImage[] = [];

      for (const file of incoming) {
        if (
          !UPLOAD_CONFIG.acceptedTypes.includes(
            file.type as (typeof UPLOAD_CONFIG.acceptedTypes)[number]
          )
        ) {
          setError(UPLOAD_ERROR.type);
          continue;
        }
        if (file.size > UPLOAD_CONFIG.maxSizeBytes) {
          setError(UPLOAD_ERROR.size);
          continue;
        }
        if (images.length + accepted.length >= UPLOAD_CONFIG.maxFiles) {
          setError(UPLOAD_ERROR.count);
          break;
        }
        const { base64, mimeType } = await fileToBase64(file);
        accepted.push({
          id: makeId(file, images.length + accepted.length),
          file,
          previewUrl: URL.createObjectURL(file),
          base64,
          mimeType,
        });
      }

      if (accepted.length > 0) addImages(accepted);
    },
    [images.length, addImages]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => remainingSlots > 0 && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && remainingSlots > 0) {
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          remainingSlots > 0
            ? "cursor-pointer hover:border-primary/50"
            : "cursor-not-allowed opacity-60",
          dragging ? "border-primary bg-accent" : "border-input"
        )}
      >
        <Upload className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm font-medium">
          点击或拖拽图片到此处上传
        </p>
        <p className="text-xs text-muted-foreground">
          支持 JPG / PNG / WEBP，单张 ≤10MB，最多 {UPLOAD_CONFIG.maxFiles} 张
          （还可上传 {Math.max(remainingSlots, 0)} 张）
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={UPLOAD_CONFIG.acceptAttr}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-md border"
            >
              <Image
                src={img.previewUrl}
                alt={img.file.name}
                fill
                sizes="120px"
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={() => removeImage(img.id)}
                aria-label="删除图片"
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ImageIcon className="h-3.5 w-3.5" />
          <span>尚未选择图片</span>
        </div>
      )}
    </div>
  );
}
