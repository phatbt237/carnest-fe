"use client";

import { useState } from "react";
import Image from "next/image";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Users, UserPlus, UserMinus, Package, MessageCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { productsApi } from "@/lib/api/products";
import { shopsApi } from "@/lib/api/shops";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage } from "@/lib/utils";
import { ReviewList } from "@/components/review/review-list";
import { ReportModal } from "@/components/report/report-modal";
import type { Shop } from "@/types";

interface Props {
  shop: Shop;
}

export function ShopDetailClient({ shop: initialShop }: Props) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [shop, setShop] = useState(initialShop);

  const productsQuery = useInfiniteQuery({
    queryKey: ["shop-products", shop.id],
    queryFn: ({ pageParam }) =>
      productsApi.getByShop(shop.id, {
        cursor: pageParam as string | undefined,
        size: 12,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
  });

  const products = productsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  const followMutation = useMutation({
    mutationFn: () =>
      shop.isFollowing
        ? shopsApi.unfollow(shop.id)
        : shopsApi.follow(shop.id),
    onSuccess: () => {
      setShop((s) => ({
        ...s,
        isFollowing: !s.isFollowing,
        followerCount: s.isFollowing ? s.followerCount - 1 : s.followerCount + 1,
      }));
      toast.success(shop.isFollowing ? "Đã hủy follow" : "Đã follow shop!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    followMutation.mutate();
  };

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 md:h-64 bg-gradient-to-br from-carnest-blue to-carnest-blue-light overflow-hidden">
        {shop.bannerUrl && (
          <Image
            src={shop.bannerUrl}
            alt={`${shop.shopName} banner`}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Shop info */}
      <div className="container mx-auto px-4">
        <div className="relative -mt-12 mb-6 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="h-24 w-24 rounded-xl overflow-hidden border-4 border-white bg-white shadow-lg relative shrink-0">
            {shop.logoUrl ? (
              <Image
                src={shop.logoUrl}
                alt={shop.shopName}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-bold text-carnest-blue">
                {shop.shopName.charAt(0)}
              </div>
            )}
          </div>

          <div className="flex-1 pb-2">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {shop.shopName}
              {shop.isVerified && (
                <BadgeCheck className="h-6 w-6 text-blue-500 shrink-0" title="Shop đã xác minh" />
              )}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <strong>{shop.rating?.toFixed(1) || "Chưa có"}</strong>
                {shop.reviewCount > 0 && (
                  <span>({shop.reviewCount} đánh giá)</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <strong>{shop.followerCount}</strong> followers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-1.5 border-carnest-blue text-carnest-blue hover:bg-carnest-blue hover:text-white"
            >
              <a href={`/chat?receiverId=${shop.owner.id}`}>
                <MessageCircle className="h-4 w-4" />
                Nhắn tin
              </a>
            </Button>
            <ReportModal targetType="USER" targetId={shop.owner.id} />
          </div>
          <Button
            onClick={handleFollow}
            disabled={followMutation.isPending}
            variant={shop.isFollowing ? "outline" : "default"}
            className={
              shop.isFollowing
                ? "border-carnest-blue text-carnest-blue hover:bg-carnest-blue hover:text-white"
                : "bg-carnest-blue hover:bg-carnest-blue-dark text-white"
            }
          >
            {shop.isFollowing ? (
              <>
                <UserMinus className="mr-1.5 h-4 w-4" />
                Đang theo dõi
              </>
            ) : (
              <>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Theo dõi
              </>
            )}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="pb-10">
          <TabsList className="mb-6">
            <TabsTrigger value="products">
              <Package className="mr-1.5 h-4 w-4" />
              Sản phẩm
            </TabsTrigger>
            <TabsTrigger value="reviews">
              <Star className="mr-1.5 h-4 w-4" />
              Đánh giá
              {shop.reviewCount > 0 && (
                <span className="ml-1.5 text-xs text-gray-500">
                  ({shop.reviewCount})
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
          </TabsList>

          <TabsContent value="products">
            {productsQuery.isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
                {productsQuery.hasNextPage && (
                  <div className="text-center mt-8">
                    <Button
                      variant="outline"
                      onClick={() => productsQuery.fetchNextPage()}
                      disabled={productsQuery.isFetchingNextPage}
                    >
                      {productsQuery.isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewList shopId={shop.id} shopOwnerId={shop.owner.id} />
          </TabsContent>

          <TabsContent value="info">
            <div className="max-w-2xl space-y-6">
              {shop.description && (
                <div className="rounded-xl border bg-white p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Giới thiệu
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {shop.description}
                  </p>
                </div>
              )}
              {shop.shippingInfo && (
                <div className="rounded-xl border bg-white p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Thông tin vận chuyển
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {shop.shippingInfo}
                  </p>
                </div>
              )}
              {shop.returnPolicy && (
                <div className="rounded-xl border bg-white p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Chính sách hoàn trả
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                    {shop.returnPolicy}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
