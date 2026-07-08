"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { shopsApi } from "@/lib/api/shops";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShopFollowButton } from "@/components/shop/shop-follow-button";
import { Search, Star, Users, Store, BadgeCheck, Loader2 } from "lucide-react";
import { formatCompact } from "@/lib/utils";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import type { CursorPage, Shop } from "@/types";

export default function ShopsPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"follower" | "rating" | "newest">("rating");

  const isSearching = !!searchTerm;

  const listQuery = useInfiniteQuery({
    queryKey: ["shops", "list", sortBy],
    queryFn: ({ pageParam }) =>
      shopsApi.list({ sortBy, cursor: pageParam as string | undefined, size: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    enabled: !isSearching,
  });

  const searchQuery = useInfiniteQuery({
    queryKey: ["shops", "search", searchTerm],
    queryFn: ({ pageParam }) =>
      shopsApi.search({ keyword: searchTerm, cursor: pageParam as string | undefined, size: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    enabled: isSearching,
  });

  const activeQuery = isSearching ? searchQuery : listQuery;
  const shops = activeQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasMore: !!activeQuery.hasNextPage,
    isLoading: activeQuery.isFetchingNextPage,
    onLoadMore: activeQuery.fetchNextPage,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(keyword.trim());
  };

  const handleFollowChange = (shopId: number, isFollowing: boolean) => {
    queryClient.setQueriesData<InfiniteData<CursorPage<Shop>>>(
      { queryKey: ["shops"] },
      (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((s) =>
                  s.id === shopId
                    ? {
                        ...s,
                        isFollowing,
                        followerCount: isFollowing ? s.followerCount + 1 : s.followerCount - 1,
                      }
                    : s
                ),
              })),
            }
          : old
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cửa hàng</h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                if (!e.target.value) setSearchTerm("");
              }}
              placeholder="Tìm kiếm cửa hàng..."
              className="flex-1"
            />
            <Button type="submit" className="bg-carnest-blue text-white">
              <Search className="h-4 w-4" />
            </Button>
          </form>
          {!isSearching && (
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Đánh giá cao nhất</SelectItem>
                <SelectItem value="follower">Nhiều followers nhất</SelectItem>
                <SelectItem value="newest">Mới nhất</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {activeQuery.isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 flex flex-col items-center gap-3">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Store className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Không tìm thấy cửa hàng</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/shops/${shop.slug}`}
                className="group relative flex flex-col items-center gap-3 p-4 rounded-xl border bg-white hover:shadow-md hover:border-carnest-blue transition-all text-center"
              >
                <ShopFollowButton
                  shopId={shop.id}
                  initialIsFollowing={shop.isFollowing}
                  onChange={(next) => handleFollowChange(shop.id, next)}
                  className="absolute top-2 right-2"
                />
                <div className="relative">
                  <div className="h-16 w-16 rounded-full overflow-hidden bg-gray-100">
                    {shop.logoUrl ? (
                      <Image src={shop.logoUrl} alt={shop.shopName} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-2xl font-bold text-carnest-blue">
                        {shop.shopName.charAt(0)}
                      </div>
                    )}
                  </div>
                  {shop.isVerified && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
                      <BadgeCheck className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="w-full">
                  <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-carnest-blue transition-colors">
                    {shop.shopName}
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                      {shop.rating?.toFixed(1) || "Mới"}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {formatCompact(shop.followerCount)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {activeQuery.hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-8">
              {activeQuery.isFetchingNextPage && (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
