"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { categoriesApi } from "@/lib/api/categories";
import { getErrorMessage } from "@/lib/utils";
import type { Category } from "@/types";
import { Plus, Pencil, Trash2, ChevronRight, Tag } from "lucide-react";

const schema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  parentId: z.number().nullable().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories-tree"],
    queryFn: categoriesApi.tree,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormData) =>
      categoriesApi.create(data as Omit<Category, "id" | "children">),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-tree"] });
      toast.success("Tạo danh mục thành công");
      setDialogOpen(false);
      reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: categoriesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories-tree"] });
      toast.success("Đã xóa danh mục");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const renderCategory = (cat: Category, depth = 0) => (
    <div key={cat.id}>
      <div
        className={`flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 ${
          depth > 0 ? "ml-6 border-l-2 border-gray-200 pl-4" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          {depth > 0 && <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
          <Tag className="h-4 w-4 text-carnest-blue" />
          <div>
            <p className="font-medium text-sm text-gray-900">{cat.name}</p>
            <p className="text-xs text-gray-500">/{cat.slug}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => { /* TODO: edit */ toast.info("Edit coming soon") }}
            className="p-1.5 text-gray-400 hover:text-carnest-blue rounded"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              if (confirm(`Xóa danh mục "${cat.name}"?`)) deleteMutation.mutate(cat.id);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 rounded"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {cat.children?.map((child) => renderCategory(child, depth + 1))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục</h1>
        <Button onClick={() => setDialogOpen(true)} className="bg-carnest-blue text-white">
          <Plus className="mr-1.5 h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      <div className="rounded-xl border bg-white divide-y">
        {isLoading ? (
          <div className="p-6 text-center text-gray-500">Đang tải...</div>
        ) : (
          categories?.map((cat) => renderCategory(cat))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm danh mục</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="space-y-4">
            <div>
              <Label>Tên danh mục *</Label>
              <Input {...register("name")} className="mt-1" />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input {...register("slug")} className="mt-1" placeholder="ten-danh-muc" />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input {...register("description")} className="mt-1" />
            </div>
            <div>
              <Label>URL Ảnh</Label>
              <Input {...register("imageUrl")} className="mt-1" />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-carnest-blue text-white">
                {createMutation.isPending ? "Đang tạo..." : "Tạo danh mục"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
