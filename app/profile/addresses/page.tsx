"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, MapPin, Pencil, Trash2, Plus, Star, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressFormDialog } from "@/components/address/address-form-dialog";
import { addressesApi } from "@/lib/api/addresses";
import { getErrorMessage } from "@/lib/utils";
import type { Address } from "@/types";

export default function AddressesPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressesApi.getAll,
  });

  const removeMutation = useMutation({
    mutationFn: addressesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Đã xóa địa chỉ");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const setDefaultMutation = useMutation({
    mutationFn: addressesApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Đã đặt làm địa chỉ mặc định");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="p-1 -ml-1">
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Địa chỉ của tôi</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
          <MapPin className="h-10 w-10 text-gray-300 mb-3" />
          <p className="text-sm text-gray-500 mb-4">Bạn chưa có địa chỉ nào</p>
          <Button
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="bg-carnest-blue hover:bg-carnest-blue-dark text-white gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Thêm địa chỉ
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{addr.receiverName}</p>
                    <span className="inline-flex items-center gap-1 text-sm text-gray-500">
                      <Phone className="h-3 w-3 text-gray-400" />
                      {addr.phone}
                    </span>
                    {addr.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-carnest-blue bg-carnest-blue/10 px-2 py-0.5 rounded-full">
                        <Star className="h-2.5 w-2.5 fill-carnest-blue" />
                        Mặc định
                      </span>
                    )}
                  </div>
                  <p className="flex items-start gap-1.5 text-sm text-gray-600 mt-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                    <span>
                      {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                {!addr.isDefault && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDefaultMutation.mutate(addr.id)}
                    disabled={setDefaultMutation.isPending}
                    className="text-xs h-8"
                  >
                    Đặt mặc định
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(addr);
                    setDialogOpen(true);
                  }}
                  className="text-xs h-8 gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Sửa
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm("Xóa địa chỉ này?")) removeMutation.mutate(addr.id);
                  }}
                  disabled={removeMutation.isPending}
                  className="text-xs h-8 gap-1 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                  Xóa
                </Button>
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={() => {
              setEditing(null);
              setDialogOpen(true);
            }}
            className="w-full gap-1.5 border-dashed"
          >
            <Plus className="h-4 w-4" />
            Thêm địa chỉ mới
          </Button>
        </div>
      )}

      <AddressFormDialog open={dialogOpen} onOpenChange={setDialogOpen} address={editing} />
    </div>
  );
}
