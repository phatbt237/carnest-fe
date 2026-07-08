"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useInfiniteQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, MessageCircle, Tag, Ruler, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ContactDialog } from "@/components/chat/contact-dialog";
import { wantlistApi } from "@/lib/api/wantlist";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";

export default function WantListPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [contactItem, setContactItem] = useState<{ id: number; userId?: number; username: string; title: string } | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const handleContact = (item: { id: number; userId?: number; username: string; title: string }) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để liên hệ");
      return;
    }
    // Known user: jump straight into the chat with the wantlist pre-tagged.
    // Only fall back to the compose dialog when the poster's user id isn't available.
    if (item.userId) {
      const params = new URLSearchParams({
        receiverId: String(item.userId),
        username: item.username,
        tagType: "WANT_LIST",
        tagId: String(item.id),
        tagLabel: item.title,
      });
      router.push(`/chat?${params.toString()}`);
      return;
    }
    setContactItem({ id: item.id, userId: item.userId, username: item.username, title: item.title });
  };

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["wantlist-public"],
      queryFn: ({ pageParam }) =>
        wantlistApi.getPublic(pageParam as string | undefined, 20),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
    });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Chưa có yêu cầu tìm kiếm nào</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 bg-carnest-surface hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-carnest-gold transition-colors font-heading leading-snug line-clamp-2 flex-1">
                    {item.title}
                  </p>
                  <span className="text-xs text-gray-400 shrink-0 whitespace-nowrap">
                    {formatDate(item.createdAt)}
                  </span>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5">
                  {item.carBrand && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-carnest-navy/6 px-2 py-0.5 text-[11px] font-medium text-carnest-navy">
                      {item.carBrand}
                    </span>
                  )}
                  {item.carModel && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {item.carModel}
                    </span>
                  )}
                  {item.scale && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                      <Ruler className="h-2.5 w-2.5" />
                      {item.scale}
                    </span>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Image + username/budget */}
                <div className="flex gap-5">
                  {item.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setLightbox(item.imageUrl)}
                      className="relative aspect-[3/2] w-24 shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white hover:opacity-90 transition-opacity"
                    >
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="96px" />
                    </button>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="font-medium text-gray-600 truncate">@{item.username}</span>
                    </div>
                    {item.maxPrice ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 min-w-0">
                        <Tag className="h-3 w-3 shrink-0" />
                        <span className="truncate">Tối đa {formatCurrency(item.maxPrice)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Giá thương lượng</span>
                    )}
                  </div>
                </div>

                {/* Footer row */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MessageCircle className="h-3 w-3" />
                      {item.contactCount} lượt liên hệ
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleContact(item)}
                      className="bg-carnest-orange hover:bg-carnest-orange-dark text-white shrink-0 gap-1.5"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Nhắn tin
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              {isFetchingNextPage && (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              )}
            </div>
          )}
        </div>
      )}

      {contactItem && (
        <ContactDialog
          open
          onOpenChange={(v) => !v && setContactItem(null)}
          wantlistId={contactItem.id}
          receiverId={contactItem.userId}
          tagTitle={contactItem.title}
          username={contactItem.username}
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[80vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
