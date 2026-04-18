"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Car,
  Eye,
  Heart,
  Lock,
  Globe,
  Package,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { showcasesApi } from "@/lib/api/showcases";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage } from "@/lib/utils";
import type { CreateShowcaseItemRequest, CreateShowcaseRequest } from "@/types";

function CreateShowcaseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<CreateShowcaseRequest>({
    name: "",
    description: "",
    coverImageUrl: "",
    isPublic: true,
  });

  const mutation = useMutation({
    mutationFn: () =>
      showcasesApi.create({
        ...form,
        coverImageUrl: form.coverImageUrl || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-showcases"] });
      toast.success("Đã tạo bộ sưu tập!");
      onClose();
      setForm({ name: "", description: "", coverImageUrl: "", isPublic: true });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo bộ sưu tập mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Tên bộ sưu tập</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="VD: Bộ sưu tập Hot Wheels 2024"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Mô tả về bộ sưu tập của bạn..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label>URL ảnh bìa</Label>
            <Input
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-3">
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
              {form.isPublic ? "Công khai" : "Riêng tư"}
            </button>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.name || mutation.isPending}
              className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold"
            >
              {mutation.isPending ? "Đang tạo..." : "Tạo bộ sưu tập"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AddItemModal({
  showcaseId,
  open,
  onClose,
}: {
  showcaseId: number;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateShowcaseItemRequest>({
    name: "",
    brand: "",
    scale: "",
    imageUrl: "",
    description: "",
    purchasePrice: undefined,
  });

  const mutation = useMutation({
    mutationFn: () =>
      showcasesApi.addItem(showcaseId, {
        ...form,
        imageUrl: form.imageUrl || undefined,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["showcase", showcaseId] });
      queryClient.invalidateQueries({ queryKey: ["my-showcases"] });
      toast.success("Đã thêm xe vào bộ sưu tập!");
      onClose();
      setForm({ name: "", brand: "", scale: "", imageUrl: "", description: "" });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm xe vào bộ sưu tập</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {[
            { label: "Tên xe", key: "name", placeholder: "VD: Hot Wheels 2023 Ferrari" },
            { label: "Hãng xe", key: "brand", placeholder: "VD: Hot Wheels" },
            { label: "Tỉ lệ", key: "scale", placeholder: "VD: 1:64" },
            { label: "URL ảnh", key: "imageUrl", placeholder: "https://..." },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label>{label}{key === "name" || key === "brand" || key === "scale" ? " *" : ""}</Label>
              <Input
                value={(form as unknown as Record<string, string | number | undefined>)[key] as string ?? ""}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                placeholder={placeholder}
              />
            </div>
          ))}
          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Tình trạng, ghi chú..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>Giá mua (VND)</Label>
            <Input
              type="number"
              value={form.purchasePrice ?? ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  purchasePrice: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!form.name || !form.brand || !form.scale || mutation.isPending}
              className="bg-carnest-blue hover:bg-carnest-blue-dark text-white"
            >
              {mutation.isPending ? "Đang thêm..." : "Thêm xe"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function MyShowcasesPage() {
  const { user, isAuthenticated } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [addItemTarget, setAddItemTarget] = useState<number | null>(null);

  const { data: showcases, isLoading } = useQuery({
    queryKey: ["my-showcases"],
    queryFn: () => showcasesApi.getByUser(user!.id),
    enabled: isAuthenticated && !!user,
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Vui lòng đăng nhập
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Bộ sưu tập của tôi</h1>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Tạo mới
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : !showcases?.length ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Chưa có bộ sưu tập nào</p>
          <p className="text-sm mt-1">Tạo bộ sưu tập đầu tiên của bạn</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {showcases.map((sc) => (
            <div
              key={sc.id}
              className="rounded-xl border bg-white overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={`/showcases/${sc.id}`}>
                <div className="relative h-40 bg-gradient-to-br from-carnest-blue/10 to-carnest-gold/10 overflow-hidden">
                  {sc.coverImageUrl && (
                    <Image
                      src={sc.coverImageUrl}
                      alt={sc.name}
                      fill
                      className="object-cover"
                    />
                  )}
                  {!sc.isPublic && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="h-2.5 w-2.5" />
                      Riêng tư
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900">{sc.name}</h3>
                {sc.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {sc.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Car className="h-3 w-3" />
                      {sc.itemCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {sc.likeCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {sc.viewCount}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAddItemTarget(sc.id)}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="h-3 w-3" />
                    Thêm xe
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateShowcaseModal open={createOpen} onClose={() => setCreateOpen(false)} />
      {addItemTarget && (
        <AddItemModal
          showcaseId={addItemTarget}
          open={!!addItemTarget}
          onClose={() => setAddItemTarget(null)}
        />
      )}
    </div>
  );
}
