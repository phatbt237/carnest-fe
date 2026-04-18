"use client";

import { useState } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, X, Globe, Lock } from "lucide-react";
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
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatDate, getErrorMessage } from "@/lib/utils";
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

function WantListForm({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateWantListRequest>({
    title: "",
    description: "",
    scale: "",
    carBrand: "",
    carModel: "",
    maxPrice: undefined,
    isPublic: true,
  });

  const mutation = useMutation({
    mutationFn: () =>
      wantlistApi.create({
        ...form,
        scale: form.scale || undefined,
        carBrand: form.carBrand || undefined,
        carModel: form.carModel || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-wantlist"] });
      toast.success("Đã tạo yêu cầu tìm kiếm!");
      onClose();
      setForm({
        title: "",
        description: "",
        scale: "",
        carBrand: "",
        carModel: "",
        maxPrice: undefined,
        isPublic: true,
      });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu tìm kiếm xe</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Tiêu đề <span className="text-red-500">*</span></Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="VD: Tìm Hot Wheels Ferrari F40"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả <span className="text-red-500">*</span></Label>
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
          <button
            type="button"
            onClick={() => setForm({ ...form, isPublic: !form.isPublic })}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
              form.isPublic
                ? "border-carnest-blue/30 bg-carnest-blue/5 text-carnest-blue"
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
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.title || !form.description || mutation.isPending}
              className="bg-carnest-blue hover:bg-carnest-blue-dark text-white"
            >
              {mutation.isPending ? "Đang tạo..." : "Tạo yêu cầu"}
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

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Vui lòng đăng nhập
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="h-5 w-5" />
          Yêu cầu tìm kiếm của tôi
        </h1>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-carnest-blue hover:bg-carnest-blue-dark text-white gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Tạo mới
        </Button>
      </div>

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
          <p className="text-sm mt-1">Tạo yêu cầu tìm kiếm xe để người bán liên hệ bạn</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
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
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-500">
                    {item.carBrand && <span>Hãng: {item.carBrand}</span>}
                    {item.carModel && <span>· {item.carModel}</span>}
                    {item.scale && <span>· Tỉ lệ: {item.scale}</span>}
                    {item.maxPrice && (
                      <span>· Ngân sách: {formatCurrency(item.maxPrice)}</span>
                    )}
                    <span>· {formatDate(item.createdAt)}</span>
                  </div>
                </div>
                {item.status === "ACTIVE" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => cancelMutation.mutate(item.id)}
                    disabled={cancelMutation.isPending}
                    className="text-gray-400 hover:text-red-500 shrink-0 h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          {hasNextPage && (
            <div className="text-center pt-2">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
              </Button>
            </div>
          )}
        </div>
      )}

      <WantListForm open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
