"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Address } from "@/types";
import { MapPin, Pencil, Plus, Star } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  addresses: Address[];
  selectedId: number | null;
  onSelect: (addr: Address) => void;
  onEdit: (addr: Address) => void;
  onAddNew: () => void;
}

export function AddressPickerDialog({
  open,
  onOpenChange,
  addresses,
  selectedId,
  onSelect,
  onEdit,
  onAddNew,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-gray-700" />
            </div>
            Chọn địa chỉ giao hàng
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 -mx-1 px-1">
          {addresses.map((addr) => (
            <label
              key={addr.id}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                selectedId === addr.id
                  ? "border-carnest-blue bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              )}
            >
              <input
                type="radio"
                className="mt-1 text-carnest-blue shrink-0"
                checked={selectedId === addr.id}
                onChange={() => {
                  onSelect(addr);
                  onOpenChange(false);
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                  {addr.receiverName} · {addr.phone}
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-carnest-blue bg-carnest-blue/10 px-2 py-0.5 rounded-full">
                      <Star className="h-2.5 w-2.5 fill-carnest-blue" />
                      Mặc định
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {addr.streetAddress}, {addr.ward}, {addr.district}, {addr.province}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onEdit(addr);
                }}
                className="p-1 text-gray-400 hover:text-carnest-blue shrink-0"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </label>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onAddNew}
          className="w-full gap-1.5 border-dashed shrink-0"
        >
          <Plus className="h-4 w-4" />
          Thêm địa chỉ mới
        </Button>
      </DialogContent>
    </Dialog>
  );
}
