"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { shopsApi } from "@/lib/api/shops";
import { ShopFollowButton } from "@/components/shop/shop-follow-button";
import { formatCompact } from "@/lib/utils";

export function FeaturedShopsSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["home-featured-shops"],
    queryFn: () => shopsApi.list({ sortBy: "rating", size: 8 }),
    staleTime: 5 * 60 * 1000,
  });

  const shops = data?.items ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-36 rounded-2xl border border-gray-100 bg-white animate-pulse" />
        ))}
      </div>
    );
  }

  if (!shops.length) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {shops.map((shop) => (
        <Link
          key={shop.id}
          href={`/shops/${shop.slug}`}
          className="group relative flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-center"
        >
          <ShopFollowButton
            shopId={shop.id}
            initialIsFollowing={shop.isFollowing}
            className="absolute top-2 right-2"
          />
          <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-carnest-gold/40 transition-all relative">
            {shop.logoUrl ? (
              <Image
                src={shop.logoUrl}
                alt={shop.shopName}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-xl font-bold text-carnest-navy font-heading">
                {shop.shopName.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 group-hover:text-carnest-gold transition-colors font-heading">
              {shop.shopName}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              ⭐ {shop.rating?.toFixed(1) || "Mới"} · {formatCompact(shop.followerCount)} followers
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
