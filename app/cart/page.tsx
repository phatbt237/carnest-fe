"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, ShoppingCart, ArrowRight, Package, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cartApi } from "@/lib/api/cart";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import type { CartItem } from "@/types";

export default function CartPage() {
  const { isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const { data: cart, isLoading } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: !authLoading,
  });

  const removeMutation = useMutation({
    mutationFn: (productId: number) => cartApi.removeItem(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Đã xóa khỏi giỏ hàng");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      setSelectedIds(new Set());
      toast.success("Đã xóa toàn bộ giỏ hàng");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const items = cart?.items ?? [];

  // Group items by shop
  const shopGroups = items.reduce<Record<number, { shopName: string; shopSlug: string; items: CartItem[] }>>(
    (acc, item) => {
      if (!acc[item.shopId]) {
        acc[item.shopId] = { shopName: item.shopName, shopSlug: item.shopSlug, items: [] };
      }
      acc[item.shopId].items.push(item);
      return acc;
    },
    {}
  );

  const toggleSelect = (productId: number, shopId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        // Check if selecting from a different shop
        const currentShopId = getSelectedShopId(prev, items);
        if (currentShopId !== null && currentShopId !== shopId) {
          toast.warning("Chỉ có thể đặt hàng từ 1 shop mỗi lần. Bỏ chọn shop hiện tại trước.");
          return prev;
        }
        next.add(productId);
      }
      return next;
    });
  };

  const toggleShop = (shopId: number) => {
    const shopItems = shopGroups[shopId]?.items ?? [];
    const allSelected = shopItems.every((i) => selectedIds.has(i.productId));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        shopItems.forEach((i) => next.delete(i.productId));
      } else {
        // Check if another shop already has selections
        const currentShopId = getSelectedShopId(prev, items);
        if (currentShopId !== null && currentShopId !== shopId) {
          toast.warning("Chỉ có thể đặt hàng từ 1 shop mỗi lần. Bỏ chọn shop hiện tại trước.");
          return prev;
        }
        shopItems.forEach((i) => next.add(i.productId));
      }
      return next;
    });
  };

  const selectedItems = items.filter((i) => selectedIds.has(i.productId));
  const selectedTotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const selectedShopIds = new Set(selectedItems.map((i) => i.shopId));
  const multipleShopsSelected = selectedShopIds.size > 1;

  if (isLoading || authLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl border">
              <Skeleton className="h-20 w-20 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-5 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!cart || items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng</h1>
        <div className="text-center py-20 text-gray-500">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Giỏ hàng trống</p>
          <p className="text-sm mt-1 mb-6">Hãy thêm sản phẩm để tiếp tục</p>
          <Link href="/products">
            <Button className="bg-carnest-blue text-white">Mua sắm ngay</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Giỏ hàng ({items.length})
        </h1>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => clearMutation.mutate()}
          disabled={clearMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Xóa tất cả
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart items grouped by shop */}
        <div className="lg:col-span-2 space-y-5">
          {Object.entries(shopGroups).map(([shopIdStr, group]) => {
            const shopId = Number(shopIdStr);
            const shopItems = group.items;
            const allShopSelected = shopItems.every((i) => selectedIds.has(i.productId));
            const someShopSelected = shopItems.some((i) => selectedIds.has(i.productId));
            const totalQty = shopItems.reduce((s, i) => s + i.quantity, 0);

            return (
              <div key={shopId} className="rounded-xl border bg-white overflow-hidden">
                {/* Shop header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b">
                  <input
                    type="checkbox"
                    checked={allShopSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someShopSelected && !allShopSelected;
                    }}
                    onChange={() => toggleShop(shopId)}
                    className="h-4 w-4 rounded"
                  />
                  <Store className="h-4 w-4 text-carnest-blue shrink-0" />
                  <Link
                    href={`/shops/${group.shopSlug}`}
                    className="font-semibold text-sm text-gray-900 hover:text-carnest-blue transition-colors"
                  >
                    {group.shopName}
                  </Link>
                  <span className="text-xs text-gray-400 ml-auto">
                    {shopItems.length} loại · {totalQty} chiếc
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y">
                  {shopItems.map((item) => (
                    <div key={item.id} className="flex gap-3 p-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.productId)}
                        onChange={() => toggleSelect(item.productId, shopId)}
                        className="h-4 w-4 rounded mt-1 shrink-0"
                      />
                      <div className="relative h-20 w-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Package className="h-8 w-8 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 line-clamp-2">
                          {item.productName}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {item.scale}
                          {item.brandName ? ` · ${item.brandName}` : ""}
                        </p>
                        {!item.isAvailable && (
                          <p className="text-xs text-red-500 mt-0.5">Sản phẩm không còn khả dụng</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div>
                            <span className="text-base font-bold text-carnest-orange">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              x{item.quantity}
                            </span>
                          </div>
                          <button
                            onClick={() => removeMutation.mutate(item.productId)}
                            disabled={removeMutation.isPending}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Tóm tắt đơn hàng</h2>
            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Đã chọn ({selectedItems.length} sản phẩm)
                </span>
                <span className="font-medium">{formatCurrency(selectedTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Tính khi checkout</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between font-bold">
              <span>Tạm tính</span>
              <span className="text-carnest-orange text-lg">
                {formatCurrency(selectedTotal)}
              </span>
            </div>

            {multipleShopsSelected && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                Chỉ được đặt hàng từ 1 shop mỗi lần. Vui lòng bỏ chọn sản phẩm của shop khác.
              </p>
            )}

            <Link
              href={
                selectedItems.length > 0 && !multipleShopsSelected
                  ? `/checkout?products=${selectedItems.map((i) => i.productId).join(",")}`
                  : "#"
              }
            >
              <Button
                className="w-full bg-carnest-orange hover:bg-carnest-orange-dark text-white"
                size="lg"
                disabled={selectedItems.length === 0 || multipleShopsSelected}
              >
                Tiến hành đặt hàng
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>

            {selectedItems.length === 0 && (
              <p className="text-xs text-center text-gray-400">
                Chọn ít nhất 1 sản phẩm để đặt hàng
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function getSelectedShopId(selectedIds: Set<number>, items: CartItem[]): number | null {
  for (const item of items) {
    if (selectedIds.has(item.productId)) return item.shopId;
  }
  return null;
}
