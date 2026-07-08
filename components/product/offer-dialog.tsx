"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { offersApi } from "@/lib/api/offers";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import type { Product } from "@/types";
import { Tag, TrendingDown } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: Product;
}

const schema = z.object({
  offerPrice: z.number().min(1000, "Giá tối thiểu 1.000đ"),
  message: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function OfferDialog({ open, onOpenChange, product }: Props) {
  const defaultPrice = product.minOfferPrice || Math.floor(product.price * 0.9);

  const {
    control,
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { offerPrice: defaultPrice },
  });

  const offerPrice = watch("offerPrice") || 0;
  const discount =
    offerPrice > 0 && offerPrice < product.price
      ? Math.round(((product.price - offerPrice) / product.price) * 100)
      : 0;

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      offersApi.create({
        productId: product.id,
        offerPrice: data.offerPrice,
        message: data.message,
      }),
    onSuccess: () => {
      toast.success("Đã gửi đề xuất giá!");
      onOpenChange(false);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <Tag className="h-4 w-4 text-gray-700" />
            </div>
            Đề xuất giá
          </DialogTitle>
        </DialogHeader>

        {/* Product info */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
          <p className="text-sm font-medium text-gray-800 line-clamp-1 mb-2">{product.name}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-400 mb-0.5">Giá niêm yết</p>
              <p className="text-base font-bold text-gray-900">{formatCurrency(product.price)}</p>
            </div>
            {product.minOfferPrice && (
              <div className="text-right">
                <p className="text-[11px] text-gray-400 mb-0.5">Giá tối thiểu</p>
                <p className="text-sm font-semibold text-gray-700">{formatCurrency(product.minOfferPrice)}</p>
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {/* Offer price */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Giá bạn muốn trả</label>
            <div className="relative">
              <Controller
                control={control}
                name="offerPrice"
                render={({ field }) => (
                  <FormattedNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="0"
                    className="pr-12 h-11 text-base font-semibold text-gray-900"
                  />
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
                VNĐ
              </span>
            </div>
            {errors.offerPrice && (
              <p className="text-xs text-red-500">{errors.offerPrice.message}</p>
            )}
            {discount > 0 && (
              <div className="flex items-center gap-1.5 text-emerald-600">
                <TrendingDown className="h-3.5 w-3.5 shrink-0" />
                <span className="text-xs font-medium">Thấp hơn {discount}% so với giá niêm yết</span>
              </div>
            )}
            {offerPrice > product.price && (
              <p className="text-xs text-amber-600 font-medium">Giá đề xuất cao hơn giá niêm yết</p>
            )}
          </div>

          {/* Message */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">
              Lời nhắn <span className="text-gray-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              {...register("message")}
              rows={3}
              className="w-full px-3 py-2.5 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none placeholder:text-gray-300"
              placeholder="Lý do hoặc lời nhắn cho người bán..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 text-gray-600 border-gray-200"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 bg-gray-900 hover:bg-gray-800 text-white font-semibold"
            >
              {mutation.isPending ? "Đang gửi..." : "Gửi đề xuất"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
