import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopsApi } from "@/lib/api/shops";
import { ShopDetailClient } from "./shop-detail-client";

interface Props {
  params: { slug: string };
}

// cache() deduplicates the API call — generateMetadata and the page share one request
const getShop = cache(shopsApi.getBySlug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const shop = await getShop(params.slug);
    return {
      title: `${shop.shopName} — Cửa hàng xe mô hình`,
      description: shop.description || `Xem sản phẩm từ ${shop.shopName} trên CarNest`,
      openGraph: {
        images: shop.logoUrl ? [shop.logoUrl] : [],
      },
    };
  } catch {
    return { title: "Cửa hàng | CarNest" };
  }
}

export const revalidate = 120;

export default async function ShopDetailPage({ params }: Props) {
  try {
    const shop = await getShop(params.slug);
    return <ShopDetailClient shop={shop} />;
  } catch {
    notFound();
  }
}
