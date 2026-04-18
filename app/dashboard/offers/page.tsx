"use client";

import { useState } from "react";
import Image from "next/image";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { offersApi } from "@/lib/api/offers";
import { formatCurrency, formatDateTime, getErrorMessage } from "@/lib/utils";
import type { Offer, OfferStatus } from "@/types";
import { MessageSquare, Package } from "lucide-react";

const STATUS_LABELS: Record<OfferStatus, string> = {
  PENDING: "Chờ phản hồi",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  COUNTERED: "Có counter",
  COUNTER_ACCEPTED: "Counter accepted",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const STATUS_VARIANT: Record<OfferStatus, "default" | "success" | "destructive" | "warning" | "secondary" | "outline" | "orange"> = {
  PENDING: "secondary",
  ACCEPTED: "success",
  REJECTED: "destructive",
  COUNTERED: "warning",
  COUNTER_ACCEPTED: "success",
  CANCELLED: "outline",
  EXPIRED: "outline",
};

function OfferCard({
  offer,
  isSeller = false,
}: {
  offer: Offer;
  isSeller?: boolean;
}) {
  const queryClient = useQueryClient();
  const [counterOpen, setCounterOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");

  const acceptMutation = useMutation({
    mutationFn: () => offersApi.accept(offer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-offers"] });
      toast.success("Đã chấp nhận offer!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: () => offersApi.reject(offer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-offers"] });
      toast.success("Đã từ chối offer");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const counterMutation = useMutation({
    mutationFn: () => offersApi.counter(offer.id, Number(counterPrice)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-offers"] });
      toast.success("Đã gửi counter offer!");
      setCounterOpen(false);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => offersApi.cancel(offer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
      toast.success("Đã hủy offer");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const acceptCounterMutation = useMutation({
    mutationFn: () => offersApi.acceptCounter(offer.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
      toast.success("Đã chấp nhận counter!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const anyOffer = offer as any;
  const productName = anyOffer.productName ?? offer.product?.name ?? "Sản phẩm";
  const productImage =
    anyOffer.productImage ?? anyOffer.productImageUrl ?? offer.product?.imageUrls?.[0] ?? null;
  const productPrice = anyOffer.productPrice ?? offer.product?.price ?? 0;
  const shopName = anyOffer.shopName ?? offer.shop?.shopName ?? "";
  const buyerName = anyOffer.buyerFullName ?? anyOffer.buyerUsername ?? offer.buyer?.fullName ?? offer.buyer?.username ?? "";

  return (
    <>
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
              {productImage ? (
                <Image
                  src={productImage}
                  alt={productName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-300" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                {productName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDateTime(offer.createdAt)}
                {!isSeller && ` · Shop: ${shopName}`}
                {isSeller && ` · Người mua: ${buyerName}`}
              </p>
            </div>
          </div>
          <Badge variant={STATUS_VARIANT[offer.status]} className="shrink-0 ml-2">
            {STATUS_LABELS[offer.status]}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-4 text-sm mb-3">
          <div>
            <span className="text-gray-500">Giá niêm yết: </span>
            <span className="font-medium">{formatCurrency(productPrice)}</span>
          </div>
          <div>
            <span className="text-gray-500">Đề xuất: </span>
            <span className="font-bold text-carnest-orange">{formatCurrency(offer.offerPrice)}</span>
          </div>
          {offer.counterPrice && (
            <div>
              <span className="text-gray-500">Counter: </span>
              <span className="font-bold text-carnest-blue">{formatCurrency(offer.counterPrice)}</span>
            </div>
          )}
        </div>

        {offer.message && (
          <p className="text-xs text-gray-600 italic bg-gray-50 rounded px-3 py-2 mb-3">
            &quot;{offer.message}&quot;
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          {isSeller && offer.status === "PENDING" && (
            <>
              <Button size="sm" className="bg-green-600 text-white" onClick={() => acceptMutation.mutate()} disabled={acceptMutation.isPending}>
                Chấp nhận
              </Button>
              <Button size="sm" variant="outline" onClick={() => setCounterOpen(true)}>
                Counter offer
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
                Từ chối
              </Button>
            </>
          )}
          {!isSeller && offer.status === "PENDING" && (
            <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
              Hủy offer
            </Button>
          )}
          {!isSeller && offer.status === "COUNTERED" && offer.counterPrice && (
            <>
              <Button size="sm" className="bg-green-600 text-white" onClick={() => acceptCounterMutation.mutate()} disabled={acceptCounterMutation.isPending}>
                Chấp nhận {formatCurrency(offer.counterPrice)}
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 border-red-300" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
                Từ chối
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Counter Offer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Giá đề xuất của buyer: <strong>{formatCurrency(offer.offerPrice)}</strong>
            </p>
            <div>
              <label className="text-sm font-medium">Giá counter của bạn (VNĐ)</label>
              <Input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button
              className="w-full bg-carnest-orange text-white"
              disabled={!counterPrice || counterMutation.isPending}
              onClick={() => counterMutation.mutate()}
            >
              Gửi Counter
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function OffersPage() {
  const myOffersQuery = useInfiniteQuery({
    queryKey: ["my-offers"],
    queryFn: ({ pageParam }) => offersApi.myOffers({ cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
  });

  const shopOffersQuery = useInfiniteQuery({
    queryKey: ["shop-offers"],
    queryFn: ({ pageParam }) => offersApi.shopOffers({ cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
  });

  const myOffers = myOffersQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const shopOffers = shopOffersQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare className="h-6 w-6 text-carnest-blue" />
        Quản lý Offer
      </h1>

      <Tabs defaultValue="my-offers">
        <TabsList className="mb-6">
          <TabsTrigger value="my-offers">
            Offer tôi gửi ({myOffers.length})
          </TabsTrigger>
          <TabsTrigger value="shop-offers">
            Offer shop nhận ({shopOffers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-offers">
          {myOffersQuery.isLoading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : myOffers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có offer nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} isSeller={false} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="shop-offers">
          {shopOffersQuery.isLoading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : shopOffers.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Chưa có offer nào từ buyer</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shopOffers.map((offer) => (
                <OfferCard key={offer.id} offer={offer} isSeller={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
