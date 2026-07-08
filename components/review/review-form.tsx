"use client";

import { useRef, useState } from "react";
import { Star, X, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { reviewsApi } from "@/lib/api/reviews";
import { uploadApi } from "@/lib/api/upload";
import { getErrorMessage } from "@/lib/utils";

interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
}

function StarRating({ value, onChange, size = "md", readOnly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sz = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-7 w-7" : "h-6 w-6";

  if (readOnly) {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sz} ${
              star <= Math.round(value)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange?.(star)}
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
  const [comment, setComment] = useState("");
  const [ratingAccuracy, setRatingAccuracy] = useState(0);
  const [ratingShipping, setRatingShipping] = useState(0);
  const [ratingCommunication, setRatingCommunication] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const allCriteriaRated = ratingAccuracy > 0 && ratingShipping > 0 && ratingCommunication > 0;
  const overallRating = allCriteriaRated
    ? Math.round(((ratingAccuracy + ratingShipping + ratingCommunication) / 3) * 10) / 10
    : 0;

  const mutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        orderId,
        rating: overallRating,
        comment,
        ratingAccuracy,
        ratingShipping,
        ratingCommunication,
        imageUrls: imageUrl ? [imageUrl] : [],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", orderId] });
      toast.success("Đánh giá đã được gửi!");
      onSuccess?.();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const [url] = await uploadApi.uploadImages([file], "review");
      setImageUrl(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-xl border bg-white p-5 space-y-4">
      <h3 className="font-semibold text-gray-900">Đánh giá đơn hàng</h3>

      {/* Sub-criteria */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Mô tả đúng thực tế", value: ratingAccuracy, setter: setRatingAccuracy },
          { label: "Đóng gói & vận chuyển", value: ratingShipping, setter: setRatingShipping },
          { label: "Giao tiếp", value: ratingCommunication, setter: setRatingCommunication },
        ].map(({ label, value, setter }) => (
          <div key={label} className="space-y-1">
            <span className="text-xs text-gray-500">
              {label} <span className="text-red-500">*</span>
            </span>
            <StarRating value={value} onChange={setter} size="sm" />
          </div>
        ))}
      </div>

      {/* Overall rating (auto-computed) */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
        <span className="text-sm font-medium text-gray-700">Đánh giá tổng thể</span>
        <div className="flex items-center gap-2">
          <StarRating value={overallRating} size="lg" readOnly />
          {allCriteriaRated && (
            <span className="text-sm font-semibold text-gray-900">{overallRating}</span>
          )}
        </div>
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

      {/* Image upload */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Ảnh đánh giá</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {imageUrl ? (
          <div className="relative group h-20 w-20 rounded-lg overflow-hidden border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <X className="h-4 w-4 text-white" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed text-gray-400 hover:border-carnest-gold hover:text-carnest-gold transition-colors disabled:opacity-50"
          >
            <Upload className="h-5 w-5" />
            <span className="text-[10px]">{isUploading ? "Đang tải..." : "Tải ảnh lên"}</span>
          </button>
        )}
      </div>

      <Button
        onClick={() => mutation.mutate()}
        disabled={!allCriteriaRated || mutation.isPending}
        className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold w-full"
      >
        {mutation.isPending ? "Đang gửi..." : "Gửi đánh giá"}
      </Button>
    </div>
  );
}
