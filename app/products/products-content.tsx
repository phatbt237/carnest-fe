"use client";

import { useSearchParams } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { ProductFilter } from "@/components/product/product-filter";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, Package, Loader2 } from "lucide-react";
import type { ProductFilter as ProductFilterType } from "@/types";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";

export function ProductsContent() {
  const searchParams = useSearchParams();

  const filter: ProductFilterType = {
    keyword: searchParams.get("keyword") || undefined,
    sortBy:
      (searchParams.get("sortBy") as ProductFilterType["sortBy"]) ||
      "newest",
    categoryId: searchParams.get("categoryId")
      ? Number(searchParams.get("categoryId"))
      : undefined,
    brandId: searchParams.get("brandId")
      ? Number(searchParams.get("brandId"))
      : undefined,
    scale: (searchParams.get("scale") as ProductFilterType["scale"]) || undefined,
    condition:
      (searchParams.get("condition") as ProductFilterType["condition"]) ||
      undefined,
    minPrice: searchParams.get("minPrice")
      ? Number(searchParams.get("minPrice"))
      : undefined,
    maxPrice: searchParams.get("maxPrice")
      ? Number(searchParams.get("maxPrice"))
      : undefined,
    size: 20,
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["products", filter],
      queryFn: ({ pageParam }) =>
        productsApi.list({ ...filter, cursor: pageParam as string | undefined }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) =>
        lastPage.hasMore ? lastPage.nextCursor ?? undefined : undefined,
    });

  const products = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.totalElements ?? 0;

  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {filter.keyword ? `Kết quả: "${filter.keyword}"` : "Tất cả sản phẩm"}
          </h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-1">
              {total.toLocaleString("vi-VN")} sản phẩm
            </p>
          )}
        </div>

        {/* Mobile filter toggle */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="md:hidden gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Bộ lọc
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Bộ lọc</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <ProductFilter />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex gap-6">
        {/* Sidebar filter — desktop */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="sticky top-20 rounded-xl border bg-white p-4">
            <h2 className="font-semibold text-sm text-gray-700 mb-4">
              Bộ lọc
            </h2>
            <ProductFilter />
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Không tìm thấy sản phẩm</p>
              <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {hasNextPage && (
                <div ref={sentinelRef} className="flex justify-center py-8">
                  {isFetchingNextPage && (
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
