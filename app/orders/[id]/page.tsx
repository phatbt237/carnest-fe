"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ordersApi } from "@/lib/api/orders";
import { useAuth } from "@/lib/context/auth-context";
import {
  cn,
  formatCurrency,
  formatDateTime,
  getErrorMessage,
} from "@/lib/utils";
import {
  ORDER_STATUS_LABELS,
  type Order,
} from "@/types";
import { CheckCircle, Package, Truck, X, Wallet, AlertCircle } from "lucide-react";
import { ReviewForm } from "@/components/review/review-form";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary" | "outline" | "orange" | "expired"> = {
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


export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => ordersApi.getById(orderId),
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: ordersApi.getWallet,
    enabled: order?.status === "PENDING_PAYMENT" && order?.paymentMethod === "WALLET",
  });

  const walletBalance = wallet?.balance ?? 0;
  const orderTotal = order?.totalPrice ?? 0;
  const isWalletPayment = order?.paymentMethod === "WALLET";
  const hasEnoughBalance = walletBalance >= orderTotal;


  const payMutation = useMutation({
    mutationFn: () => ordersApi.pay(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Thanh toán thành công!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(orderId, "Người mua hủy đơn"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Đã hủy đơn hàng");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deliveredMutation = useMutation({
    mutationFn: () => ordersApi.delivered(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Đã xác nhận nhận hàng!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const completeMutation = useMutation({
    mutationFn: () => ordersApi.complete(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Đơn hàng đã hoàn thành!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-60 w-full rounded-xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500">
        Không tìm thấy đơn hàng
      </div>
    );
  }

  const isBuyer = user?.id === order.buyer?.id;
  const isSeller = user?.id === order.shop?.owner?.id;

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Đơn hàng #{order.orderCode}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {formatDateTime(order.createdAt)}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
      </div>

{/* Wallet info for PENDING_PAYMENT */}
      {order.status === "PENDING_PAYMENT" && isBuyer && isWalletPayment && (
        <div className="rounded-xl border bg-white p-4 mb-4 space-y-3">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
            <Wallet className="h-4 w-4 text-carnest-blue" />
            Thông tin thanh toán
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền đơn hàng</span>
              <span className="font-bold text-carnest-orange">{formatCurrency(orderTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Số dư ví hiện tại</span>
              <span className={cn("font-semibold", hasEnoughBalance ? "text-green-600" : "text-red-500")}>
                {formatCurrency(walletBalance)}
              </span>
            </div>
            {!hasEnoughBalance && (
              <div className="flex items-start gap-2 text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-1">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Số dư không đủ. Cần nạp thêm <strong>{formatCurrency(orderTotal - walletBalance)}</strong></span>
              </div>
            )}
            {hasEnoughBalance && (
              <div className="text-xs text-gray-400">
                Số dư sau khi thanh toán: {formatCurrency(walletBalance - orderTotal)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 mb-6">
        {order.status === "PENDING_PAYMENT" && isBuyer && (
          <Button
            onClick={() => payMutation.mutate()}
            disabled={payMutation.isPending || (isWalletPayment && !hasEnoughBalance)}
            className="bg-carnest-orange hover:bg-carnest-orange-dark text-white"
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            {payMutation.isPending ? "Đang thanh toán..." : "Thanh toán ngay"}
          </Button>
        )}
        {["PENDING_PAYMENT", "PENDING"].includes(order.status) && (
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
          >
            <X className="mr-1.5 h-4 w-4" />
            Hủy đơn
          </Button>
        )}
        {order.status === "SHIPPING" && isBuyer && (
          <Button
            onClick={() => deliveredMutation.mutate()}
            disabled={deliveredMutation.isPending}
            className="bg-carnest-blue text-white"
          >
            <Truck className="mr-1.5 h-4 w-4" />
            Đã nhận hàng
          </Button>
        )}
        {order.status === "DELIVERED" && isBuyer && (
          <Button
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="mr-1.5 h-4 w-4" />
            Hoàn thành đơn
          </Button>
        )}
      </div>

      {/* Products */}
      <div className="rounded-xl border bg-white p-5 space-y-4 mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Package className="h-4 w-4" />
          Sản phẩm ({order.items.length})
        </h2>
        <Separator />
        {order.items.map((item, idx) => {
          const anyItem = item as any;
          const imgSrc = anyItem.productImage ?? anyItem.productImageUrl ?? anyItem.imageUrl ?? item.product?.imageUrls?.[0] ?? null;
          const name = anyItem.productName ?? item.product?.name ?? "Sản phẩm";
          const key = anyItem.productId ?? item.product?.id ?? idx;
          const subtotal = item.subtotal ?? (item.price ?? 0) * (item.quantity ?? 0);
          return (
            <div key={key} className="flex gap-3">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={name}
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-2">{name}</p>
                <p className="text-xs text-gray-500">
                  {formatCurrency(item.price)} x{item.quantity}
                </p>
              </div>
              <p className="text-sm font-bold text-carnest-orange shrink-0">
                {formatCurrency(subtotal)}
              </p>
            </div>
          );
        })}
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Tổng cộng</span>
          <span className="text-carnest-orange text-lg">
            {formatCurrency(order.totalPrice)}
          </span>
        </div>
      </div>

      {/* Shipping info */}
      <div className="rounded-xl border bg-white p-5 space-y-3 mb-4">
        <h2 className="font-semibold text-gray-900">Thông tin giao hàng</h2>
        <Separator />
        {[
          { label: "Người nhận", value: order.shippingName },
          { label: "Điện thoại", value: order.shippingPhone },
          { label: "Địa chỉ", value: order.shippingAddress },
          { label: "Phương thức thanh toán", value: order.paymentMethod },
          ...(order.trackingNumber
            ? [
                { label: "Mã vận đơn", value: order.trackingNumber },
                { label: "Đơn vị vận chuyển", value: order.shippingMethod },
              ]
            : []),
          ...(order.buyerNote
            ? [{ label: "Ghi chú", value: order.buyerNote }]
            : []),
        ].map(
          (item) =>
            item.value && (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900 text-right ml-2 max-w-[200px]">
                  {item.value}
                </span>
              </div>
            )
        )}
      </div>

      {order.cancelReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-700">Lý do hủy:</p>
          <p className="text-sm text-red-600 mt-1">{order.cancelReason}</p>
        </div>
      )}

      {/* Review section — buyer can review completed orders */}
      {order.status === "COMPLETED" && isBuyer && (
        <ReviewForm orderId={orderId} />
      )}
    </div>
  );
}
