"use client";

import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, MessageCircle, Tag, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { wantlistApi } from "@/lib/api/wantlist";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function WantListPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["wantlist-public"],
      queryFn: ({ pageParam }) =>
        wantlistApi.getPublic(pageParam as string | undefined, 20),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
    });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Danh sách tìm kiếm xe
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Những collector đang tìm kiếm xe mô hình
          </p>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => router.push("/my/wantlist")}
            className="bg-carnest-blue hover:bg-carnest-blue-dark text-white gap-1.5"
          >
            Yêu cầu của tôi
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có yêu cầu tìm kiếm nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <span className="text-xs text-gray-400 shrink-0 ml-2">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.carBrand && (
                      <span className="inline-flex items-center gap-1 text-xs bg-carnest-blue/8 text-carnest-blue px-2.5 py-1 rounded-full">
                        <Tag className="h-3 w-3" />
                        {item.carBrand}
                      </span>
                    )}
                    {item.carModel && (
                      <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                        {item.carModel}
                      </span>
                    )}
                    {item.scale && (
                      <span className="inline-flex items-center gap-1 text-xs bg-carnest-gold/10 text-carnest-gold px-2.5 py-1 rounded-full">
                        <Scale className="h-3 w-3" />
                        {item.scale}
                      </span>
                    )}
                    {item.maxPrice && (
                      <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                        Ngân sách: {formatCurrency(item.maxPrice)}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Đăng bởi <strong className="text-gray-600">@{item.username}</strong>
                  </p>
                </div>

                <Button
                  size="sm"
                  onClick={() => {
                    if (!isAuthenticated) {
                      toast.error("Vui lòng đăng nhập để liên hệ");
                      return;
                    }
                    router.push("/chat");
                  }}
                  className="bg-carnest-orange hover:bg-carnest-orange-dark text-white shrink-0 gap-1.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  Nhắn tin
                </Button>
              </div>
            </div>
          ))}

          {hasNextPage && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
