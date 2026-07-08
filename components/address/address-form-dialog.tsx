"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { addressesApi } from "@/lib/api/addresses";
import { getProvinces, getDistricts, getWards, type VnProvince, type VnDistrict, type VnWard } from "@/lib/data/vn-address";
import { getErrorMessage } from "@/lib/utils";
import type { Address } from "@/types";
import { MapPin } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  address?: Address | null;
  onSaved?: (address: Address) => void;
}

const schema = z.object({
  receiverName: z.string().min(2, "Vui lòng nhập họ tên"),
  phone: z.string().regex(/^(0|\+84)[0-9]{8,9}$/, "SĐT không hợp lệ"),
  province: z.string().min(1, "Vui lòng chọn tỉnh/thành phố"),
  district: z.string().min(1, "Vui lòng chọn quận/huyện"),
  ward: z.string().min(1, "Vui lòng chọn phường/xã"),
  streetAddress: z.string().min(3, "Vui lòng nhập địa chỉ cụ thể"),
  isDefault: z.boolean(),
});

type FormData = z.infer<typeof schema>;

export function AddressFormDialog({ open, onOpenChange, address, onSaved }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!address;

  const [provinces, setProvinces] = useState<VnProvince[]>([]);
  const [districts, setDistricts] = useState<VnDistrict[]>([]);
  const [wards, setWards] = useState<VnWard[]>([]);
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");

  const {
    control,
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { isDefault: false },
  });

  // Load provinces once when dialog opens
  useEffect(() => {
    if (!open) return;
    getProvinces().then(setProvinces);
  }, [open]);

  // Prefill / reset form when dialog opens
  useEffect(() => {
    if (!open) return;
    if (address) {
      reset({
        receiverName: address.receiverName,
        phone: address.phone,
        province: address.province,
        district: address.district,
        ward: address.ward,
        streetAddress: address.streetAddress,
        isDefault: address.isDefault,
      });
    } else {
      reset({
        receiverName: "",
        phone: "",
        province: "",
        district: "",
        ward: "",
        streetAddress: "",
        isDefault: false,
      });
      setDistricts([]);
      setWards([]);
      setProvinceCode("");
      setDistrictCode("");
    }
  }, [open, address, reset]);

  // Resolve saved province/district names -> codes on edit, so cascading selects populate
  useEffect(() => {
    if (!open || !address || provinces.length === 0) return;
    const p = provinces.find((p) => p.name === address.province);
    if (!p) return;
    setProvinceCode(p.code);
    getDistricts(p.code).then((ds) => {
      setDistricts(ds);
      const d = ds.find((d) => d.name === address.district);
      if (d) {
        setDistrictCode(d.code);
        getWards(d.code).then(setWards);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, address, provinces]);

  const handleProvinceChange = async (code: string) => {
    const p = provinces.find((p) => p.code === code);
    setProvinceCode(code);
    setValue("province", p?.name ?? "");
    setValue("district", "");
    setValue("ward", "");
    setDistrictCode("");
    setWards([]);
    const ds = await getDistricts(code);
    setDistricts(ds);
  };

  const handleDistrictChange = async (code: string) => {
    const d = districts.find((d) => d.code === code);
    setDistrictCode(code);
    setValue("district", d?.name ?? "");
    setValue("ward", "");
    const ws = await getWards(code);
    setWards(ws);
  };

  const handleWardChange = (code: string) => {
    const w = wards.find((w) => w.code === code);
    setValue("ward", w?.name ?? "");
  };

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? addressesApi.update(address!.id, data) : addressesApi.create(data),
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success(isEdit ? "Đã cập nhật địa chỉ" : "Đã thêm địa chỉ mới");
      onOpenChange(false);
      onSaved?.(saved);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const wardValue = wards.find((w) => w.name === watch("ward"))?.code ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
              <MapPin className="h-4 w-4 text-gray-700" />
            </div>
            {isEdit ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label>Họ và tên người nhận</Label>
              <Input {...register("receiverName")} className="mt-1" placeholder="Nguyễn Văn A" />
              {errors.receiverName && (
                <p className="text-xs text-red-500 mt-1">{errors.receiverName.message}</p>
              )}
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label>Số điện thoại</Label>
              <Input {...register("phone")} className="mt-1" placeholder="0912345678" />
              {errors.phone && (
                <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label>Tỉnh/Thành phố</Label>
              <Select value={provinceCode} onValueChange={handleProvinceChange}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn tỉnh/thành phố" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.province && (
                <p className="text-xs text-red-500 mt-1">{errors.province.message}</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label>Quận/Huyện</Label>
              <Select
                value={districtCode}
                onValueChange={handleDistrictChange}
                disabled={!provinceCode}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn quận/huyện" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((d) => (
                    <SelectItem key={d.code} value={d.code}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.district && (
                <p className="text-xs text-red-500 mt-1">{errors.district.message}</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label>Phường/Xã</Label>
              <Select value={wardValue} onValueChange={handleWardChange} disabled={!districtCode}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Chọn phường/xã" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((w) => (
                    <SelectItem key={w.code} value={w.code}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.ward && <p className="text-xs text-red-500 mt-1">{errors.ward.message}</p>}
            </div>

            <div className="col-span-2">
              <Label>Địa chỉ cụ thể</Label>
              <Input
                {...register("streetAddress")}
                className="mt-1"
                placeholder="Số nhà, tên đường..."
              />
              {errors.streetAddress && (
                <p className="text-xs text-red-500 mt-1">{errors.streetAddress.message}</p>
              )}
            </div>
          </div>

          <Controller
            control={control}
            name="isDefault"
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-carnest-blue focus:ring-carnest-blue"
                />
                Đặt làm địa chỉ mặc định
              </label>
            )}
          />

          <div className="flex gap-2.5 pt-1">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 text-gray-600 border-gray-200"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={mutation.isPending}
              className="flex-1 h-10 bg-carnest-blue hover:bg-carnest-blue-dark text-white font-semibold"
            >
              {mutation.isPending ? "Đang lưu..." : "Lưu địa chỉ"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
