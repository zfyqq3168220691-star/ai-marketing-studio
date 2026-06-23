import { ProductForm } from "@/components/upload/product-form";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold">工作台</h2>
        <p className="text-sm text-muted-foreground">
          上传商品图片并填写名称，AI 分析后可编辑修改，确认后再生成营销素材
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
