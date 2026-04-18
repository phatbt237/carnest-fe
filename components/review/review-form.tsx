"use client";

import { useState } from "react";
import { Star, X, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { reviewsApi } from "@/lib/api/reviews";
import { getErrorMessage } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "md";
}

function StarRating({ value, onChange, size = "md" }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "h-4 w-4" : "h-6 w-6";
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={`${sz} transition-colors ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface ReviewFormProps {
  orderId: number;
  onSuccess?: () => void;
}

export function ReviewForm({ orderId, onSuccess }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [ratingAccuracy, setRatingAccuracy] = useState(0);
  const [ratingShipping, setRatingShipping] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        orderId,
        rating,
        comment,
        ratingAccuracy: ratingAccuracy || undefined,
        ratingShipping: ratingShipping || undefined,
        ratingCommunication: ratingCommunication || undefined,
        imageUrls,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Đánh giá đã được gửi!");
      onSuccess?.();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const addUrl = () => {
    const trimmed = newUrl.trim();
    if (trimmed && !imageUrls.includes(trimmed)) {
      setImageUrls((prev) => [...prev, trimmed]);
      setNewUrl("");
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Đánh giá đơn hàng</h3>

      {/* Overall rating */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">
          Đánh giá tổng thể <span className="text-red-500">*</span>
        </Label>
        <StarRating value={rating} onChange={setRating} />
      </div>

      {/* Sub-criteria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Mô tả đúng thực tế", value: ratingAccuracy, setter: setRatingAccuracy },
          { label: "Đóng gói & vận chuyển", value: ratingShipping, setter: setRatingShipping },
          { label: "Giao tiếp", value: ratingCommunication, setter: setRatingCommunication },
        ].map(({ label, value, setter }) => (
          <div key={label} className="space-y-1">
            <span className="text-xs text-gray-500">{label}</span>
            <StarRating value={value} onChange={setter} size="sm" />
          </div>
        ))}
      </div>

      {/* Comment */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-gray-700">Nhận xét</Label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm và người bán..."
          className="resize-none"
          rows={3}
        />
      </div>

      {/* Image URLs */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">
          Ảnh đánh giá (URL)
        </Label>
        <div className="flex gap-2">
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addUrl())}
            placeholder="https://..."
            className="flex-1 h-9 text-sm rounded-md border border-input bg-background px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="button" size="sm" variant="outline" onClick={addUrl}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {imageUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imageUrls.map((url, i) => (
              <div key={i} className="relative group h-16 w-16 rounded-lg overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={rating === 0 || mutation.isPending}
        className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold w-full"
      >
        {mutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
      </Button>
    </div>
  );
}
