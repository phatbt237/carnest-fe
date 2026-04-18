import type { Metadata } from "next";
import { Suspense } from "react";
import { CategoryContent } from "./category-content";

interface Props {
  params: { slug: string };
}

export const metadata: Metadata = {
  title: "Danh mục sản phẩm | CarNest",
};

export default function CategoryPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Đang tải...</div>}>
      <CategoryContent slug={params.slug} />
    </Suspense>
  );
}
