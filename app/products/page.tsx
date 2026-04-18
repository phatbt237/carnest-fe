import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductsContent } from "./products-content";

export const metadata: Metadata = {
  title: "Tất cả sản phẩm — Xe mô hình diecast",
  description:
    "Mua xe mô hình diecast giá tốt. Lọc theo hãng, tỉ lệ, tình trạng, giá cả.",
};

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center text-gray-500">Đang tải...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
