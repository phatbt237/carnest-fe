"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { offersApi } from "@/lib/api/offers";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import type { Product } from "@/types";

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
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      offerPrice: product.minOfferPrice || Math.floor(product.price * 0.9),
    },
  });

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Đề xuất giá</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <p className="text-sm text-gray-600 mb-1 truncate font-medium">
            {product.name}
          </p>
          <p className="text-sm text-gray-500">
            Giá niêm yết:{" "}
            <span className="font-semibold text-carnest-orange">
              {formatCurrency(product.price)}
            </span>
          </p>
          {product.minOfferPrice && (
            <p className="text-xs text-gray-500 mt-0.5">
              Giá đề xuất tối thiểu:{" "}
              <span className="font-medium">
                {formatCurrency(product.minOfferPrice)}
              </span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <Label htmlFor="offerPrice">Giá đề xuất (VNĐ)</Label>
            <Input
              id="offerPrice"
              type="number"
              {...register("offerPrice", { valueAsNumber: true })}
              className="mt-1"
              placeholder="Nhập giá bạn muốn trả"
            />
            {errors.offerPrice && (
              <p className="text-xs text-red-500 mt-1">
                {errors.offerPrice.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="message">Lời nhắn (tùy chọn)</Label>
            <textarea
              id="message"
              {...register("message")}
              rows={3}
              className="w-full mt-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              placeholder="Nhập lý do hoặc lời nhắn cho người bán..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="bg-carnest-orange hover:bg-carnest-orange-dark text-white"
            >
              {mutation.isPending ? "Đang gửi..." : "Gửi đề xuất"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
