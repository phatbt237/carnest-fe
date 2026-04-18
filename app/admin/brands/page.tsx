"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { brandsApi } from "@/lib/api/brands";
import { getErrorMessage } from "@/lib/utils";
import type { Brand } from "@/types";
import { Plus, Pencil, Trash2 } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const { data: brands, isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: brandsApi.list,
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => brandsApi.create(data as Omit<Brand, "id">),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Tạo hãng thành công");
      setDialogOpen(false);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Brand> }) =>
      brandsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Cập nhật thành công");
      setDialogOpen(false);
      setEditingBrand(null);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: brandsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast.success("Đã xóa hãng");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const openCreate = () => {
    setEditingBrand(null);
    reset();
    setDialogOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setValue("name", brand.name);
    setValue("slug", brand.slug);
    setValue("description", brand.description);
    setValue("logoUrl", brand.logoUrl || "");
    setDialogOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Hãng xe</h1>
        <Button onClick={openCreate} className="bg-carnest-blue text-white">
          <Plus className="mr-1.5 h-4 w-4" />
          Thêm hãng
        </Button>
      </div>

      <div className="rounded-xl border bg-white divide-y">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Đang tải...</div>
        ) : brands?.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Chưa có hãng xe nào</div>
        ) : (
          brands?.map((brand) => (
            <div key={brand.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                {brand.logoUrl ? (
                  <div className="relative h-10 w-10 rounded-lg overflow-hidden bg-gray-100">
                    <Image src={brand.logoUrl} alt={brand.name} fill className="object-contain" sizes="40px" />
                  </div>
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">
                    {brand.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm text-gray-900">{brand.name}</p>
                  <p className="text-xs text-gray-500">/{brand.slug}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openEdit(brand)}
                  className="p-1.5 text-gray-400 hover:text-carnest-blue rounded"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Xóa hãng "${brand.name}"?`)) deleteMutation.mutate(brand.id);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditingBrand(null); reset(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBrand ? "Sửa hãng" : "Thêm hãng xe"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((d) => {
              if (editingBrand) {
                updateMutation.mutate({ id: editingBrand.id, data: d });
              } else {
                createMutation.mutate(d);
              }
            })}
            className="space-y-4"
          >
            <div>
              <Label>Tên hãng *</Label>
              <Input {...register("name")} className="mt-1" />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input {...register("slug")} className="mt-1" placeholder="hot-wheels" />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input {...register("description")} className="mt-1" />
            </div>
            <div>
              <Label>URL Logo</Label>
              <Input {...register("logoUrl")} className="mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-carnest-blue text-white"
              >
                {createMutation.isPending || updateMutation.isPending ? "Đang lưu..." : editingBrand ? "Cập nhật" : "Tạo hãng"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
