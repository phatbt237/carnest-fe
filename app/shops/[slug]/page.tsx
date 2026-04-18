import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { shopsApi } from "@/lib/api/shops";
import { ShopDetailClient } from "./shop-detail-client";

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const shop = await shopsApi.getBySlug(params.slug);
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
    const shop = await shopsApi.getBySlug(params.slug);
    return <ShopDetailClient shop={shop} />;
  } catch {
    notFound();
  }
}
