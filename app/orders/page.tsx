"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useInfiniteQuery } from "@tanstack/react-query";
import { ordersApi } from "@/lib/api/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import type { OrderStatus } from "@/types";
import { ORDER_STATUS_LABELS } from "@/types";
import { Package } from "lucide-react";

const STATUSES: { value: OrderStatus | ""; label: string }[] = [
  { value: "", label: "Tất cả" },
  { value: "PENDING_PAYMENT", label: "Chờ thanh toán" },
  { value: "PENDING", label: "Chờ xác nhận" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "DELIVERED", label: "Đã giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn thanh toán" },
];

const STATUS_VARIANT: Record<OrderStatus, "default" | "success" | "warning" | "destructive" | "secondary" | "outline" | "orange" | "expired"> = {
  PENDING_PAYMENT: "warning",
  PENDING: "secondary",
  CONFIRMED: "default",
  SHIPPING: "orange",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "destructive",
  REFUNDED: "outline",
  EXPIRED: "expired",
};

export default function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | "">("");

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["my-orders", status],
      queryFn: ({ pageParam }) =>
        ordersApi.myOrders({
          status: status || undefined,
          cursor: pageParam as string | undefined,
          size: 10,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    });

  const orders = data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-5">Đơn hàng của tôi</h1>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-5">
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatus(s.value as OrderStatus | "")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              status === s.value
                ? "bg-carnest-blue text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-1/5" />
              </div>
              <div className="flex gap-3">
                <Skeleton className="h-16 w-16 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-1/3 ml-auto" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Không có đơn hàng nào</p>
          <Link href="/products" className="mt-4 inline-block">
            <Button className="bg-carnest-blue text-white">Mua sắm ngay</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}>
              <div className="rounded-xl border bg-white p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-900">
                      #{order.orderCode}
                    </p>
                    <Badge variant={STATUS_VARIANT[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDateTime(order.createdAt)} · {order.shop?.shopName}
                  </p>
                </div>

                <div className="flex gap-3 mb-3">
                  {order.items.slice(0, 3).map((item, idx) => {
                    const imgSrc = (item as any).productImage
                      || (item as any).productImageUrl
                      || (item as any).imageUrl
                      || item.product?.imageUrls?.[0]
                      || null;
                    const altText = (item as any).productName || item.product?.name || "";
                    const key = (item as any).productId || item.product?.id || idx;
                    return (
                      <div
                        key={key}
                        className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0"
                      >
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={altText}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-gray-300" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {order.items.length > 3 && (
                    <div className="h-16 w-16 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-500 font-medium shrink-0">
                      +{order.items.length - 3}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {order.items.length} sản phẩm
                  </span>
                  <span className="font-bold text-carnest-orange">
                    {formatCurrency(order.totalPrice)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {hasNextPage && (
            <div className="text-center">
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
