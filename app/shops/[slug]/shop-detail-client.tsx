"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star, Users, UserPlus, UserMinus, Package, MessageCircle, BadgeCheck, Settings, Loader2, Info, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardSkeleton } from "@/components/product/product-card-skeleton";
import { productsApi } from "@/lib/api/products";
import { shopsApi } from "@/lib/api/shops";
import { showcasesApi } from "@/lib/api/showcases";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage, formatCompact } from "@/lib/utils";
import { ReviewList } from "@/components/review/review-list";
import { ReportModal } from "@/components/report/report-modal";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import type { Shop } from "@/types";

interface Props {
  shop: Shop;
}

export function ShopDetailClient({ shop: initialShop }: Props) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [shop, setShop] = useState(initialShop);

  // The initial shop data is fetched server-side without the user's auth token,
  // so isFollowing/isOwner come back generic. Re-fetch client-side to get the real values.
  useEffect(() => {
    if (!isAuthenticated) return;
    shopsApi
      .getBySlug(initialShop.slug)
      .then((fresh) => {
        setShop((s) => ({ ...s, isFollowing: fresh.isFollowing, isOwner: fresh.isOwner }));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, initialShop.slug]);

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

  const sentinelRef = useInfiniteScroll({
    hasMore: !!productsQuery.hasNextPage,
    isLoading: productsQuery.isFetchingNextPage,
    onLoadMore: productsQuery.fetchNextPage,
  });

  const showcasesQuery = useQuery({
    queryKey: ["shop-showcases", shop.owner?.id],
    queryFn: () => showcasesApi.getByUser(shop.owner!.id),
    enabled: !!shop.owner?.id,
  });

  const showcases = showcasesQuery.data ?? [];

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
        <div className="mb-6 flex flex-col items-start sm:flex-row sm:items-center gap-4 pt-3">
          {/* Avatar — overlaps the banner above */}
          <div className="relative shrink-0 -mt-14 sm:-mt-12">
            <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white bg-white shadow-lg">
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
            {shop.isVerified && (
              <div className="absolute -top-2 -right-2 h-7 w-7 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white shadow-md">
                <BadgeCheck className="h-4 w-4 text-white" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              {shop.shopName}
            </h1>
            {shop.isVerified && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                <BadgeCheck className="h-3.5 w-3.5" />
                Shop đã xác minh
              </p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-1">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <strong>{shop.rating?.toFixed(1) || "Chưa có"}</strong>
                {shop.reviewCount > 0 && (
                  <span>({formatCompact(shop.reviewCount)} đánh giá)</span>
                )}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <strong>{formatCompact(shop.followerCount)}</strong> followers
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {shop.isOwner ? (
              <Button asChild className="gap-1.5 bg-carnest-blue hover:bg-carnest-blue-dark text-white">
                <Link href="/dashboard/shop">
                  <Settings className="h-4 w-4" />
                  Quản lý shop
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="gap-1.5 border-carnest-blue text-carnest-blue hover:bg-carnest-blue hover:text-white"
                >
                  <a href={`/chat?receiverId=${shop.owner?.id}`}>
                    <MessageCircle className="h-4 w-4" />
                    Nhắn tin
                  </a>
                </Button>
                {shop.owner && <ReportModal targetType="USER" targetId={shop.owner.id} />}
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
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="products" className="pb-10">
          <TabsList className="mb-6 grid h-auto w-full grid-cols-2 gap-1.5 p-1.5 md:flex md:h-9 md:w-fit md:gap-0 md:p-1">
            <TabsTrigger
              value="products"
              className="h-auto flex-col gap-0.5 py-2 text-[11px] md:flex-row md:py-1 md:text-sm"
            >
              <Package className="h-4 w-4 md:mr-1.5" />
              <span>Sản phẩm</span>
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="h-auto flex-col gap-0.5 py-2 text-[11px] md:flex-row md:py-1 md:text-sm"
            >
              <Star className="h-4 w-4 md:mr-1.5" />
              <span className="flex items-center gap-1">
                Đánh giá
                {shop.reviewCount > 0 && (
                  <span className="text-[10px] text-gray-500 md:text-xs">
                    ({formatCompact(shop.reviewCount)})
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="showcases"
              className="h-auto flex-col gap-0.5 py-2 text-[11px] md:flex-row md:py-1 md:text-sm"
            >
              <Sparkles className="h-4 w-4 md:mr-1.5" />
              <span className="flex items-center gap-1">
                Bộ sưu tập
                {showcases.length > 0 && (
                  <span className="text-[10px] text-gray-500 md:text-xs">
                    ({showcases.length})
                  </span>
                )}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="info"
              className="h-auto flex-col gap-0.5 py-2 text-[11px] md:flex-row md:py-1 md:text-sm"
            >
              <Info className="h-4 w-4 md:mr-1.5" />
              <span>Thông tin</span>
            </TabsTrigger>
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
                  <div ref={sentinelRef} className="flex justify-center py-8">
                    {productsQuery.isFetchingNextPage && (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                    )}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            <ReviewList shopId={shop.id} shopOwnerId={shop.owner?.id ?? 0} />
          </TabsContent>

          <TabsContent value="showcases">
            {showcasesQuery.isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-48 rounded-xl border bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : showcases.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có bộ sưu tập nào</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {showcases.map((sc) => (
                  <Link
                    key={sc.id}
                    href={`/showcases/${sc.id}`}
                    className="group rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-36 bg-gradient-to-br from-carnest-blue/20 to-carnest-gold/20 overflow-hidden">
                      {sc.coverImageUrl && (
                        <Image
                          src={sc.coverImageUrl}
                          alt={sc.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900">{sc.name}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {sc.description}
                      </p>
                      <div className="flex gap-4 text-xs text-gray-400 mt-3">
                        <span>{sc.itemCount} xe</span>
                        <span>♥ {sc.likeCount}</span>
                        <span>{sc.viewCount} lượt xem</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
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
