"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/lib/api/products";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";

export function NewProductsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-new-products"],
    queryFn: () => productsApi.list({ size: 8, sortBy: "newest" }),
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
