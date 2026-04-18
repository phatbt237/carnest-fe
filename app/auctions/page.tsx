"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { auctionsApi } from "@/lib/api/auctions";
import { AuctionCard } from "@/components/auction/auction-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gavel } from "lucide-react";

type Filter = "active" | "ending_soon" | "upcoming" | "ended";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "active", label: "Đang diễn ra" },
  { value: "ending_soon", label: "Sắp kết thúc" },
  { value: "upcoming", label: "Sắp bắt đầu" },
  { value: "ended", label: "Đã kết thúc" },
];

export default function AuctionsPage() {
  const [filter, setFilter] = useState<Filter>("active");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["auctions", filter],
      queryFn: ({ pageParam }) =>
        auctionsApi.list({
          filter,
          cursor: pageParam as string | undefined,
          size: 12,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    });

  const auctions = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Gavel className="h-6 w-6 text-carnest-orange" />
          Đấu giá xe mô hình
        </h1>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.value
                  ? "bg-carnest-blue text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : auctions.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Gavel className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Không có phiên đấu giá nào</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {auctions.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
          {hasNextPage && (
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
