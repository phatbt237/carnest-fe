"use client";

import { useState } from "react";
import Image from "next/image";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, X, Globe, Lock, Pencil, Loader2, Upload, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { wantlistApi } from "@/lib/api/wantlist";
import { uploadApi } from "@/lib/api/upload";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";
import type { CreateWantListRequest, WantList } from "@/types";

const STATUS_LABELS: Record<WantList["status"], string> = {
  ACTIVE: "Đang tìm",
  CANCELLED: "Đã hủy",
  FULFILLED: "Đã tìm được",
};

const STATUS_VARIANT: Record<
  WantList["status"],
  "default" | "success" | "destructive" | "secondary"
> = {
  ACTIVE: "default",
  CANCELLED: "destructive",
  FULFILLED: "success",
};

const EMPTY_FORM: CreateWantListRequest = {
  title: "",
  description: "",
  scale: "",
  carBrand: "",
  carModel: "",
  maxPrice: undefined,
  isPublic: true,
  imageUrl: undefined,
};

function WantListFormDialog({
  open,
  onClose,
  editItem,
}: {
  open: boolean;
  onClose: () => void;
  editItem?: WantList;
}) {
  const isEdit = !!editItem;
  const queryClient = useQueryClient();

  const [form, setForm] = useState<CreateWantListRequest>(
    isEdit
      ? {
          title: editItem.title,
          description: editItem.description,
          scale: editItem.scale ?? "",
          carBrand: editItem.carBrand ?? "",
          carModel: editItem.carModel ?? "",
          maxPrice: editItem.maxPrice ?? undefined,
          isPublic: editItem.isPublic,
          imageUrl: editItem.imageUrl ?? undefined,
        }
      : EMPTY_FORM
  );
  const [isUploading, setIsUploading] = useState(false);

  // Reset form khi dialog mở với item khác
  const [lastEditId, setLastEditId] = useState<number | undefined>(editItem?.id);
  if (editItem?.id !== lastEditId) {
    setLastEditId(editItem?.id);
    setForm(
      editItem
        ? {
            title: editItem.title,
            description: editItem.description,
            scale: editItem.scale ?? "",
            carBrand: editItem.carBrand ?? "",
            carModel: editItem.carModel ?? "",
            maxPrice: editItem.maxPrice ?? undefined,
            isPublic: editItem.isPublic,
            imageUrl: editItem.imageUrl ?? undefined,
          }
        : EMPTY_FORM
    );
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const [url] = await uploadApi.uploadImages([file], "wantlist");
      setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        scale: form.scale || undefined,
        carBrand: form.carBrand || undefined,
        carModel: form.carModel || undefined,
      };
      return isEdit
        ? wantlistApi.update(editItem.id, payload)
        : wantlistApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-wantlist"] });
      toast.success(isEdit ? "Đã cập nhật yêu cầu!" : "Đã tạo yêu cầu tìm kiếm!");
      onClose();
      if (!isEdit) setForm(EMPTY_FORM);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Cập nhật yêu cầu tìm xe" : "Tạo yêu cầu tìm xe"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Tìm Hot Wheels Ferrari F40"
            />
          </div>

          <div className="space-y-1.5">
            <Label>
              Mô tả <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả chi tiết xe bạn đang tìm..."
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Hãng xe</Label>
              <Input
                value={form.carBrand ?? ""}
                onChange={(e) => setForm({ ...form, carBrand: e.target.value })}
                placeholder="Ferrari, BMW..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Mẫu xe</Label>
              <Input
                value={form.carModel ?? ""}
                onChange={(e) => setForm({ ...form, carModel: e.target.value })}
                placeholder="F40, M3..."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tỉ lệ</Label>
              <Input
                value={form.scale ?? ""}
                onChange={(e) => setForm({ ...form, scale: e.target.value })}
                placeholder="1:64, 1:43..."
              />
            </div>
            <div className="space-y-1.5">
              <Label>Ngân sách tối đa</Label>
              <Input
                type="number"
                min={0}
                value={form.maxPrice ?? ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxPrice: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
                placeholder="VND"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Ảnh minh họa</Label>
            {form.imageUrl ? (
              <div className="relative h-40 w-full rounded-lg overflow-hidden border">
                <Image src={form.imageUrl} alt="" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, imageUrl: undefined })}
                  className="absolute top-2 right-2 bg-white border border-gray-200 rounded-full p-1 shadow hover:bg-red-50 hover:border-red-300 transition-colors"
                >
                  <X className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>
            ) : (
              <label className="flex h-40 w-full flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 text-gray-400 cursor-pointer hover:border-carnest-gold hover:text-carnest-gold hover:bg-carnest-gold/5 transition-colors">
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
                <span className="text-xs font-medium">
                  {isUploading ? "Đang tải lên..." : "Nhấn để chọn ảnh"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                  onChange={handleFileSelect}
                />
              </label>
            )}
          </div>

          <button
            type="button"
            onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              form.isPublic
                ? "border-carnest-gold/30 bg-carnest-gold/5 text-carnest-gold"
                : "border-gray-200 text-gray-500"
            }`}
          >
            {form.isPublic ? (
              <Globe className="h-4 w-4" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            {form.isPublic ? "Hiển thị công khai" : "Chỉ mình tôi"}
          </button>

          <div className="flex gap-2 justify-end pt-1">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.title || !form.description || mutation.isPending || isUploading}
              className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold"
            >
              {mutation.isPending
                ? isEdit
                  ? "Đang lưu..."
                  : "Đang tạo..."
                : isEdit
                ? "Lưu thay đổi"
                : "Tạo yêu cầu"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MyWantListPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<WantList | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["my-wantlist"],
      queryFn: ({ pageParam }) =>
        wantlistApi.getMy(pageParam as string | undefined, 20),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
      enabled: isAuthenticated,
    });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => wantlistApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-wantlist"] });
      toast.success("Đã hủy yêu cầu");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];

  const sentinelRef = useInfiniteScroll({
    hasMore: !!hasNextPage,
    isLoading: isFetchingNextPage,
    onLoadMore: fetchNextPage,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Vui lòng đăng nhập
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="h-5 w-5" />
            Yêu cầu tìm kiếm của tôi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý danh sách xe bạn đang tìm kiếm
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Tạo mới
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <Search className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chưa có yêu cầu nào</p>
          <p className="text-sm mt-1">
            Tạo yêu cầu tìm kiếm xe để người bán liên hệ bạn
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-xl border bg-white p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Title + badges */}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900">{item.title}</h3>
                    <Badge variant={STATUS_VARIANT[item.status]}>
                      {STATUS_LABELS[item.status]}
                    </Badge>
                    {!item.isPublic && (
                      <span className="text-xs text-gray-400 flex items-center gap-0.5">
                        <Lock className="h-3 w-3" /> Riêng tư
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="flex gap-5 mt-2">
                    {item.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setLightbox(item.imageUrl)}
                        className="relative aspect-[3/2] w-32 shrink-0 rounded-lg overflow-hidden border bg-gray-50 hover:opacity-90 transition-opacity"
                      >
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover" sizes="128px" />
                      </button>
                    )}

                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 text-xs text-gray-500">
                      {item.maxPrice && (
                        <span className="font-semibold text-green-700">
                          Ngân sách: {formatCurrency(item.maxPrice)}
                        </span>
                      )}
                      <span className="text-gray-400">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-500">
                    {item.carBrand && <span>Hãng: {item.carBrand}</span>}
                    {item.carModel && <span>· {item.carModel}</span>}
                    {item.scale && <span>· Tỉ lệ: {item.scale}</span>}
                  </div>

                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                    <MessageCircle className="h-3 w-3" />
                    {item.contactCount} lượt liên hệ
                  </div>
                </div>

                {/* Actions — chỉ hiện khi ACTIVE */}
                {item.status === "ACTIVE" && (
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditItem(item)}
                      className="h-8 w-8 text-gray-400 hover:text-carnest-gold"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => cancelMutation.mutate(item.id)}
                      disabled={cancelMutation.isPending}
                      className="h-8 w-8 text-gray-400 hover:text-red-500"
                      title="Hủy yêu cầu"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {hasNextPage && (
            <div ref={sentinelRef} className="flex justify-center py-2">
              {isFetchingNextPage && (
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Dialog tạo mới */}
      <WantListFormDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {/* Dialog chỉnh sửa */}
      <WantListFormDialog
        open={!!editItem}
        onClose={() => setEditItem(null)}
        editItem={editItem ?? undefined}
      />

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox}
            alt=""
            className="max-h-[80vh] max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
