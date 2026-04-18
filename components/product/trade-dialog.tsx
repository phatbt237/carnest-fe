"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeftRight, Car } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { shopsApi } from "@/lib/api/shops";
import { productsApi } from "@/lib/api/products";
import { tradesApi } from "@/lib/api/trades";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import type { Product } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetProduct: Product;
}

export function TradeDialog({ open, onOpenChange, targetProduct }: Props) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [cashOffset, setCashOffset] = useState<string>("");
  const [message, setMessage] = useState("");

  const myShopQuery = useQuery({
    queryKey: ["my-shop"],
    queryFn: shopsApi.getMyShop,
    enabled: open,
    retry: false,
  });

  const myProductsQuery = useQuery({
    queryKey: ["my-shop-products", myShopQuery.data?.id],
    queryFn: () =>
      productsApi.getByShop(myShopQuery.data!.id, { size: 50 }),
    enabled: !!myShopQuery.data?.id,
  });

  const myProducts = myProductsQuery.data?.items ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      tradesApi.create({
        targetProductId: targetProduct.id,
        offerProductIds: selectedIds,
        cashOffset: cashOffset ? Number(cashOffset) : 0,
        message: message || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã gửi đề xuất đổi xe!");
      onOpenChange(false);
      setSelectedIds([]);
      setCashOffset("");
      setMessage("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowLeftRight className="h-5 w-5" />
            Đề xuất đổi xe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Target product */}
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wide">
              Xe bạn muốn đổi
            </Label>
            <div className="mt-2 flex items-center gap-3 rounded-xl border bg-carnest-blue/5 border-carnest-blue/20 p-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {targetProduct.imageUrls?.[0] ? (
                  <Image
                    src={targetProduct.imageUrls[0]}
                    alt={targetProduct.name}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Car className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                  {targetProduct.name}
                </p>
                <p className="text-sm text-carnest-orange font-bold mt-0.5">
                  {formatCurrency(targetProduct.price)}
                </p>
              </div>
            </div>
          </div>

          {/* My products */}
          <div>
            <Label className="text-xs text-gray-500 uppercase tracking-wide">
              Xe bạn đưa ra đổi{" "}
              <span className="text-red-500">*</span>
            </Label>

            {myShopQuery.isLoading || myProductsQuery.isLoading ? (
              <div className="mt-2 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
            ) : myShopQuery.isError ? (
              <div className="mt-2 rounded-xl border border-dashed p-4 text-center text-sm text-gray-400">
                Bạn cần có shop để đề xuất đổi xe
              </div>
            ) : myProducts.length === 0 ? (
              <div className="mt-2 rounded-xl border border-dashed p-4 text-center text-sm text-gray-400">
                Shop của bạn chưa có sản phẩm nào
              </div>
            ) : (
              <div className="mt-2 space-y-2 max-h-52 overflow-y-auto pr-1">
                {myProducts.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        checked
                          ? "border-carnest-blue bg-carnest-blue/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div
                        className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? "bg-carnest-blue border-carnest-blue"
                            : "border-gray-300"
                        }`}
                      >
                        {checked && (
                          <svg
                            className="h-2.5 w-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {p.imageUrls?.[0] ? (
                          <Image
                            src={p.imageUrls[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Car className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-xs text-carnest-orange">
                          {formatCurrency(p.price)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cash offset */}
          <div>
            <Label htmlFor="cashOffset" className="text-xs text-gray-500 uppercase tracking-wide">
              Tiền bù (VND, tùy chọn)
            </Label>
            <Input
              id="cashOffset"
              type="number"
              value={cashOffset}
              onChange={(e) => setCashOffset(e.target.value)}
              placeholder="0 (nhập số âm nếu bên kia bù tiền)"
              className="mt-2"
            />
            <p className="text-xs text-gray-400 mt-1">
              Dương (+) = bạn bù thêm tiền · Âm (−) = đối phương bù tiền
            </p>
          </div>

          {/* Message */}
          <div>
            <Label htmlFor="tradeMsg" className="text-xs text-gray-500 uppercase tracking-wide">
              Lời nhắn (tùy chọn)
            </Label>
            <textarea
              id="tradeMsg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Thêm lời nhắn cho người nhận đề xuất..."
              className="mt-2 w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={selectedIds.length === 0 || mutation.isPending}
            className="bg-carnest-blue hover:bg-carnest-blue-dark text-white gap-1.5"
          >
            <ArrowLeftRight className="h-4 w-4" />
            {mutation.isPending ? "Đang gửi..." : "Gửi đề xuất"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
