"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, MessageSquare } from "lucide-react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { reviewsApi } from "@/lib/api/reviews";
import { formatDate } from "@/lib/utils";
import { ReplyForm } from "./reply-form";
import { useAuth } from "@/lib/context/auth-context";
import type { Review } from "@/types";

interface StarDisplayProps {
  value: number;
  size?: "sm" | "md";
}

function StarDisplay({ value, size = "sm" }: StarDisplayProps) {
  const sz = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${sz} ${
            s <= value
              ? "fill-yellow-400 text-yellow-400"
              : "fill-none text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

interface RatingSummaryProps {
  reviews: Review[];
}

function RatingSummary({ reviews }: RatingSummaryProps) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  return (
    <div className="rounded-xl border bg-white p-5 mb-6 flex gap-8">
      <div className="flex flex-col items-center justify-center gap-1 shrink-0">
        <span className="text-4xl font-bold text-carnest-gold">{avg.toFixed(1)}</span>
        <StarDisplay value={Math.round(avg)} size="md" />
        <span className="text-xs text-gray-400">{reviews.length} đánh giá</span>
      </div>
      <div className="flex-1 space-y-1.5">
        {dist.map(({ star, count }) => (
          <div key={star} className="flex items-center gap-2">
            <span className="text-xs text-gray-500 w-4 shrink-0">{star}</span>
            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400 shrink-0" />
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all"
                style={{
                  width:
                    reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%",
                }}
              />
            </div>
            <span className="text-xs text-gray-400 w-5 text-right">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  review: Review;
  shopOwnerId?: number;
}

function ReviewCard({ review, shopOwnerId }: ReviewCardProps) {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const isSeller = user?.id === shopOwnerId;

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      {/* Reviewer info */}
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-carnest-blue/10 flex items-center justify-center text-sm font-semibold text-carnest-blue shrink-0 overflow-hidden">
          {review.reviewerAvatar ? (
            <Image
              src={review.reviewerAvatar}
              alt={review.reviewerUsername}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            review.reviewerUsername.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">
            {review.reviewerUsername}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarDisplay value={review.rating} />
            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
          </div>
        </div>
      </div>

      {/* Sub-criteria */}
      {(review.ratingAccuracy || review.ratingShipping || review.ratingCommunication) && (
        <div className="flex flex-wrap gap-3 text-xs text-gray-500">
          {review.ratingAccuracy && (
            <span>Mô tả: <StarDisplay value={review.ratingAccuracy} /></span>
          )}
          {review.ratingShipping && (
            <span>Ship: <StarDisplay value={review.ratingShipping} /></span>
          )}
          {review.ratingCommunication && (
            <span>Giao tiếp: <StarDisplay value={review.ratingCommunication} /></span>
          )}
        </div>
      )}

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-gray-700 leading-relaxed">{review.comment}</p>
      )}

      {/* Images */}
      {review.imageUrls?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {review.imageUrls.map((url, i) => (
            <button
              key={i}
              onClick={() => setLightbox(url)}
              className="h-16 w-16 rounded-lg overflow-hidden border hover:opacity-90 transition-opacity"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Reply */}
      {review.reply && (
        <div className="bg-gray-50 rounded-lg p-3 border-l-2 border-carnest-blue">
          <p className="text-xs font-semibold text-carnest-blue mb-1">
            Phản hồi của người bán:
          </p>
          <p className="text-sm text-gray-600">{review.reply}</p>
        </div>
      )}

      {/* Reply button for seller */}
      {isSeller && !review.reply && (
        <div>
          {showReplyForm ? (
            <ReplyForm
              reviewId={review.id}
              onSuccess={() => setShowReplyForm(false)}
              onCancel={() => setShowReplyForm(false)}
            />
          ) : (
            <button
              onClick={() => setShowReplyForm(true)}
              className="flex items-center gap-1.5 text-xs text-carnest-blue hover:text-carnest-blue-dark transition-colors"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              Phản hồi
            </button>
          )}
        </div>
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

interface ReviewListProps {
  shopId: number;
  shopOwnerId?: number;
}

export function ReviewList({ shopId, shopOwnerId }: ReviewListProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["reviews", shopId],
      queryFn: ({ pageParam }) =>
        reviewsApi.getByShop(shopId, pageParam as string | undefined, 10),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
    });

  const reviews = data?.pages.flatMap((p) => p.items) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <RatingSummary reviews={reviews} />
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Star className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Chưa có đánh giá nào</p>
        </div>
      ) : (
        <>
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} shopOwnerId={shopOwnerId} />
          ))}
          {hasNextPage && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Đang tải..." : "Xem thêm đánh giá"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
