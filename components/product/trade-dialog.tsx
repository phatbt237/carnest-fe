"use client";

import { useState } from "react";
import Image from "next/image";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeftRight, Car, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
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
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashDir, setCashDir] = useState<"pay" | "receive">("pay");
  const [message, setMessage] = useState("");

  const myShopQuery = useQuery({
    queryKey: ["my-shop"],
    queryFn: shopsApi.getMyShop,
    enabled: open,
    retry: false,
  });

  const myProductsQuery = useQuery({
    queryKey: ["my-shop-products", myShopQuery.data?.id],
    queryFn: () => productsApi.getByShop(myShopQuery.data!.id, { size: 50 }),
    enabled: !!myShopQuery.data?.id,
  });

  const myProducts = myProductsQuery.data?.items ?? [];

  const cashOffset = cashAmount > 0 ? (cashDir === "pay" ? cashAmount : -cashAmount) : 0;

  const mutation = useMutation({
    mutationFn: () =>
      tradesApi.create({
        targetProductId: targetProduct.id,
        offerProductIds: selectedIds,
        cashOffset,
        message: message || undefined,
      }),
    onSuccess: () => {
      toast.success("Đã gửi đề xuất đổi xe!");
      onOpenChange(false);
      setSelectedIds([]);
      setCashAmount(0);
      setMessage("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const toggleProduct = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const targetImg =
    targetProduct.primaryImage ||
    targetProduct.images?.[0]?.imageUrl ||
    targetProduct.imageUrls?.[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-hide w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-4 w-4 text-gray-700" />
            </div>
            Đề xuất đổi xe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Target product */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Xe bạn muốn nhận</p>
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 border border-gray-100 p-3">
              <div className="relative h-14 w-14 rounded-lg overflow-hidden bg-gray-200 shrink-0">
                {targetImg ? (
                  <Image src={targetImg} alt={targetProduct.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Car className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                  {targetProduct.name}
                </p>
                <p className="text-sm font-bold text-gray-700 mt-1">
                  {formatCurrency(targetProduct.price)}
                </p>
              </div>
            </div>
          </div>

          {/* Divider with icon */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <div className="h-7 w-7 rounded-full bg-gray-900 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* My products */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Xe bạn đưa ra <span className="text-red-400">*</span>
            </p>

            {myShopQuery.isLoading || myProductsQuery.isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[62px] rounded-xl" />)}
              </div>
            ) : myShopQuery.isError ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                <Car className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Bạn cần có shop để đề xuất đổi xe</p>
              </div>
            ) : myProducts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center">
                <Car className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Shop của bạn chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto scrollbar-hide">
                {myProducts.map((p) => {
                  const checked = selectedIds.includes(p.id);
                  const img = p.primaryImage || p.images?.[0]?.imageUrl || p.imageUrls?.[0];
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProduct(p.id)}
                      className={`w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                        checked
                          ? "border-gray-900 bg-gray-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className={`h-4.5 w-4.5 h-[18px] w-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        checked ? "bg-gray-900 border-gray-900" : "border-gray-300"
                      }`}>
                        {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                      </div>

                      {/* Image */}
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {img ? (
                          <Image src={img} alt={p.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <Car className="h-4 w-4 text-gray-300" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-500 font-semibold mt-0.5">{formatCurrency(p.price)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedIds.length > 0 && (
              <p className="text-xs text-gray-500 text-right">
                Đã chọn <span className="font-semibold text-gray-900">{selectedIds.length}</span> xe
              </p>
            )}
          </div>

          {/* Cash offset */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Tiền bù <span className="text-gray-300 font-normal normal-case tracking-normal">(tùy chọn)</span>
            </p>

            {/* Segmented control */}
            <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50 w-fit">
              <button
                type="button"
                onClick={() => setCashDir("pay")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  cashDir === "pay"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Bạn bù tiền
              </button>
              <button
                type="button"
                onClick={() => setCashDir("receive")}
                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  cashDir === "receive"
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Nhận bù tiền
              </button>
            </div>

            {/* Amount input */}
            <div className="relative">
              <FormattedNumberInput
                value={cashAmount}
                onChange={setCashAmount}
                placeholder="0"
                className="text-sm font-semibold pr-12 h-10"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">VNĐ</span>
            </div>

            {cashAmount > 0 && (
              <p className="text-xs text-gray-500">
                {cashDir === "pay"
                  ? `Bạn bù thêm ${formatCurrency(cashAmount)} cho người bán`
                  : `Người bán bù thêm ${formatCurrency(cashAmount)} cho bạn`}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Lời nhắn <span className="text-gray-300 font-normal normal-case tracking-normal">(tùy chọn)</span>
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Thêm lời nhắn cho người nhận đề xuất..."
              className="w-full px-3 py-2.5 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none placeholder:text-gray-300"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 text-gray-600 border-gray-200"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={selectedIds.length === 0 || mutation.isPending}
              className="flex-1 h-10 bg-gray-900 hover:bg-gray-800 text-white font-semibold gap-1.5"
            >
              <ArrowLeftRight className="h-4 w-4" />
              {mutation.isPending ? "Đang gửi..." : "Gửi đề xuất"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
