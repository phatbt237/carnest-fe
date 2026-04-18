"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Heart, Eye, Car, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { showcasesApi } from "@/lib/api/showcases";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ShowcasePage() {
  const { id } = useParams<{ id: string }>();
  const showcaseId = Number(id);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: showcase, isLoading } = useQuery({
    queryKey: ["showcase", showcaseId],
    queryFn: () => showcasesApi.getById(showcaseId),
  });

  const likeMutation = useMutation({
    mutationFn: () => showcasesApi.toggleLike(showcaseId),
    onSuccess: () => {
      queryClient.setQueryData<typeof showcase>(["showcase", showcaseId], (old) =>
        old
          ? {
              ...old,
              isLiked: !old.isLiked,
              likeCount: old.isLiked ? old.likeCount - 1 : old.likeCount + 1,
            }
          : old
      );
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    likeMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-4">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-8 w-1/3" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!showcase) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Không tìm thấy bộ sưu tập
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Cover */}
      <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-carnest-blue/20 to-carnest-gold/20 mb-6">
        {showcase.coverImageUrl && (
          <Image
            src={showcase.coverImageUrl}
            alt={showcase.name}
            fill
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <h1 className="text-2xl font-bold text-white">{showcase.name}</h1>
          <p className="text-white/70 text-sm mt-1">của @{showcase.ownerUsername}</p>
        </div>
      </div>

      {/* Stats & actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-5 text-sm text-gray-500">
          <span className="flex items-center gap-1.5">
            <Car className="h-4 w-4" />
            {showcase.itemCount} xe
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            {showcase.viewCount} lượt xem
          </span>
        </div>
        <Button
          variant={showcase.isLiked ? "default" : "outline"}
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className={cn(
            "gap-2",
            showcase.isLiked
              ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
              : "border-gray-300"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              showcase.isLiked && "fill-white"
            )}
          />
          {showcase.likeCount}
        </Button>
      </div>

      {/* Description */}
      {showcase.description && (
        <p className="text-gray-600 mb-8 leading-relaxed">{showcase.description}</p>
      )}

      {/* Items grid */}
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Package className="h-5 w-5" />
        Xe trong bộ sưu tập
      </h2>

      {!showcase.items?.length ? (
        <div className="text-center py-12 text-gray-400">
          <Car className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p>Chưa có xe nào trong bộ sưu tập</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {showcase.items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow group"
            >
              <div className="relative h-40 bg-gray-100 overflow-hidden">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, 33vw"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <Car className="h-10 w-10 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {item.brand} · {item.scale}
                </p>
                {item.purchasePrice && (
                  <p className="text-xs text-carnest-gold font-medium mt-1">
                    {formatCurrency(item.purchasePrice)}
                  </p>
                )}
                {item.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
