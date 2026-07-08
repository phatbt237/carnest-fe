"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { categoriesApi } from "@/lib/api/categories";
import { productsApi } from "@/lib/api/products";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { Package, ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";

interface Props {
  slug: string;
}

export function CategoryContent({ slug }: Props) {
  // Find category by slug from list
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: categoriesApi.list,
  });

  const category = categories?.find((c) => c.slug === slug);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["products-by-category", category?.id],
      queryFn: ({ pageParam }) =>
        productsApi.list({
          categoryId: category?.id,
          cursor: pageParam as string | undefined,
          size: 20,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
      enabled: !!category?.id,
    });

  const products = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-carnest-blue">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900">{category?.name || slug}</span>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {category?.name || slug}
      </h1>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Không có sản phẩm trong danh mục này</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
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
  );
}
