"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Truck, TrendingUp, Car } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatCurrency, getDiscountPercent, formatCompact } from "@/lib/utils";
import type { Product } from "@/types";
import { CONDITION_LABELS } from "@/types";

interface ProductCardProps {
  product: Product;
}

const CONDITION_BADGE_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "destructive" | "outline" | "secondary" | "orange"
> = {
  SEALED: "success",
  OPENED: "secondary",
  LOOSE: "outline",
  DAMAGED_BOX: "warning",
  CUSTOM: "orange",
};

function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <Car className="h-10 w-10 text-gray-300" />
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      loading="lazy"
      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      onError={() => setError(true)}
    />
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = !!product.originalPrice && product.originalPrice > product.price;
  const discount = hasDiscount
    ? getDiscountPercent(product.price, product.originalPrice!)
    : 0;

  const mainImage =
    product.primaryImage ||
    product.images?.[0]?.imageUrl ||
    product.imageUrls?.[0] ||
    "";
  const isOutOfStock = product.quantity === 0;

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <div
        className="
          relative rounded-2xl bg-white border border-gray-100 overflow-hidden
          shadow-sm transition-all duration-300 ease-out
          hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1
        "
      >
        {/* Image container */}
        <div className={`relative aspect-square overflow-hidden bg-gray-50 ${isOutOfStock ? "opacity-70 grayscale" : ""}`}>
          <ProductImage src={mainImage} alt={product.name} />

          {/* Gradient overlay — bottom */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />

          {/* Top-left: discount badge */}
          {discount > 0 && (
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white leading-none ring-1 ring-white/40 shadow-[0_2px_8px_rgba(0,0,0,0.4)] tracking-wide">
                -{discount}%
              </span>
            </div>
          )}

          {/* Top-right: condition badge */}
          <div className="absolute top-2.5 right-2.5">
            <Badge
              variant={CONDITION_BADGE_VARIANT[product.condition] || "outline"}
              className="text-[10px] px-2 py-0.5 rounded-full ring-1 ring-white/50 shadow-[0_2px_8px_rgba(0,0,0,0.4)] tracking-wide"
            >
              {CONDITION_LABELS[product.condition]}
            </Badge>
          </div>

          {/* Bottom-left: freeship badge */}
          {product.freeShipping && (
            <div className="absolute bottom-2.5 left-2.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold text-white leading-none ring-1 ring-white/40 shadow-[0_2px_10px_rgba(0,0,0,0.45)] tracking-wide">
                <Truck className="h-2.5 w-2.5 shrink-0" />
                Miễn ship
              </span>
            </div>
          )}

          {/* Out of stock overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="rounded-full bg-black/65 backdrop-blur-sm px-3.5 py-1.5 text-xs font-semibold text-white tracking-wide">
                Hết hàng
              </span>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="p-3.5">
          {/* Brand + scale meta */}
          <p className="text-[11px] font-medium text-gray-400 mb-1 truncate tracking-wide uppercase">
            {product.carBrand}
            {product.scale && (
              <span className="text-gray-300 mx-1">·</span>
            )}
            {product.scale}
          </p>

          {/* Product name */}
          <h3 className="text-[13.5px] font-semibold text-gray-900 line-clamp-2 leading-snug mb-2.5 font-heading">
            {product.name}
          </h3>

          {/* Price + sold count — sold count always aligns with the new price row */}
          <div className="flex items-start justify-between gap-1">
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-carnest-gold leading-none">
                {formatCurrency(product.price)}
              </span>
              <span
                className={cn(
                  "text-[11px] text-gray-350 line-through mt-1",
                  !hasDiscount && "invisible"
                )}
              >
                {formatCurrency(product.originalPrice ?? product.price)}
              </span>
            </div>
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400 shrink-0">
              <TrendingUp className="h-2.5 w-2.5" />
              {product.soldCount > 0 ? `Đã bán ${formatCompact(product.soldCount)}` : "Chưa bán"}
            </span>
          </div>
        </div>

        {/* Gold accent line — appears on hover */}
        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-carnest-gold scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left rounded-b-2xl" />
      </div>
    </Link>
  );
}
