"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Suspense } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AddressFormDialog } from "@/components/address/address-form-dialog";
import { AddressPickerDialog } from "@/components/address/address-picker-dialog";
import { cartApi } from "@/lib/api/cart";
import { ordersApi } from "@/lib/api/orders";
import { addressesApi } from "@/lib/api/addresses";
import { cn, formatCurrency, getErrorMessage } from "@/lib/utils";
import type { Address, PaymentMethod } from "@/types";
import { CreditCard, Truck, Smartphone, Building2, Wallet, AlertCircle, CheckCircle2, MapPin, ChevronRight, Star } from "lucide-react";

const schema = z.object({
  shippingName: z.string().min(2, "Vui lòng nhập họ tên"),
  shippingPhone: z
    .string()
    .regex(/^(0|\+84)[0-9]{8,9}$/, "SĐT không hợp lệ"),
  shippingAddress: z.string().min(10, "Vui lòng nhập địa chỉ đầy đủ"),
  paymentMethod: z.enum(["VNPAY", "MOMO", "COD", "BANK_TRANSFER", "WALLET"]),
  buyerNote: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const PAYMENT_METHODS: {
  value: PaymentMethod;
  label: string;
  icon: React.FC<{ className?: string }>;
  desc: string;
}[] = [
  { value: "WALLET", label: "Ví CarNest", icon: Wallet, desc: "Thanh toán từ ví nội bộ" },
  { value: "VNPAY", label: "VNPAY", icon: CreditCard, desc: "Thanh toán qua VNPAY" },
  { value: "MOMO", label: "MoMo", icon: Smartphone, desc: "Ví điện tử MoMo" },
  { value: "BANK_TRANSFER", label: "Chuyển khoản", icon: Building2, desc: "Chuyển khoản ngân hàng" },
  { value: "COD", label: "Tiền mặt (COD)", icon: Truck, desc: "Thanh toán khi nhận hàng" },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const productIds = searchParams
    .get("products")
    ?.split(",")
    .map(Number)
    .filter(Boolean) ?? [];

  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [didAutoSelect, setDidAutoSelect] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { paymentMethod: "WALLET" },
  });

  const paymentMethod = watch("paymentMethod");

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
  });

  const { data: wallet } = useQuery({
    queryKey: ["wallet"],
    queryFn: ordersApi.getWallet,
  });

  const { data: addresses } = useQuery({
    queryKey: ["addresses"],
    queryFn: addressesApi.getAll,
  });

  const applyAddress = (addr: Address) => {
    setSelectedAddressId(addr.id);
    setValue("shippingName", addr.receiverName);
    setValue("shippingPhone", addr.phone);
    setValue(
      "shippingAddress",
      `${addr.streetAddress}, ${addr.ward}, ${addr.district}, ${addr.province}`
    );
  };

  // Auto-select the default (or first) saved address once, on load
  useEffect(() => {
    if (didAutoSelect || !addresses || addresses.length === 0) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    applyAddress(def);
    setDidAutoSelect(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, didAutoSelect]);

  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId) ?? null;

  const selectedItems =
    cart?.items.filter((i) => productIds.includes(i.productId)) ?? [];
  const total = selectedItems.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 0), 0);
  const walletBalance = wallet?.balance ?? 0;
  const isWalletPayment = paymentMethod === "WALLET";
  const hasEnoughBalance = walletBalance >= total;

  const checkoutMutation = useMutation({
    mutationFn: (data: FormData) =>
      ordersApi.checkout({
        ...data,
        productIds,
      }),
    onSuccess: (orders) => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`Đặt hàng thành công! ${orders.length} đơn hàng được tạo`);
      router.push("/orders");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Đặt hàng</h1>

      <form
        onSubmit={handleSubmit((d) => checkoutMutation.mutate(d))}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping */}
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Địa chỉ giao hàng</h2>

            {selectedAddress ? (
              <button
                type="button"
                onClick={() => setPickerOpen(true)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:border-carnest-blue transition-colors text-left"
              >
                <MapPin className="h-4 w-4 text-carnest-blue shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2 flex-wrap">
                    {selectedAddress.receiverName} · {selectedAddress.phone}
                    {selectedAddress.isDefault && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-carnest-blue bg-carnest-blue/10 px-2 py-0.5 rounded-full">
                        <Star className="h-2.5 w-2.5 fill-carnest-blue" />
                        Mặc định
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedAddress.streetAddress}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (addresses && addresses.length > 0) {
                    setPickerOpen(true);
                  } else {
                    setEditingAddress(null);
                    setAddressDialogOpen(true);
                  }
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-lg border border-dashed border-gray-300 hover:border-carnest-blue text-left"
              >
                <span className="text-sm text-gray-500">Chọn địa chỉ giao hàng</span>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
              </button>
            )}
            {errors.shippingAddress && (
              <p className="text-xs text-red-500">{errors.shippingAddress.message}</p>
            )}

            <Separator />

            <div>
              <Label>Ghi chú (tùy chọn)</Label>
              <Input
                {...register("buyerNote")}
                className="mt-1"
                placeholder="Ghi chú thêm cho người bán..."
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="order-2 lg:order-none lg:col-start-3 lg:row-start-1 lg:row-span-2 rounded-xl border bg-white p-5 h-fit sticky top-20 space-y-4">
          <h2 className="font-semibold text-gray-900">Sản phẩm đặt hàng</h2>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {selectedItems.map((item) => (
              <div key={item.id} className="flex gap-2">
                <div className="relative h-12 w-12 rounded-md overflow-hidden bg-gray-100 shrink-0">
                  {item.productImage ? (
                    <Image
                      src={item.productImage}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-gray-300 text-xs">?</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 line-clamp-2">
                    {item.productName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.price)} x{item.quantity}
                  </p>
                </div>
                <p className="text-xs font-semibold text-carnest-orange shrink-0">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>
          <Separator />
          <div className="space-y-2">
            <div className="flex justify-between font-bold text-base">
              <span>Tổng tiền hàng</span>
              <span className="text-carnest-orange">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Số dư ví của bạn</span>
              <span className={cn("font-medium", hasEnoughBalance ? "text-green-600" : "text-red-500")}>
                {formatCurrency(walletBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="order-3 lg:order-none lg:col-span-2 space-y-6">
          {/* Payment */}
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <h2 className="font-semibold text-gray-900">Phương thức thanh toán</h2>
            <div className="space-y-2">
              {PAYMENT_METHODS.map((pm) => (
                <label
                  key={pm.value}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    paymentMethod === pm.value
                      ? "border-carnest-blue bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <input
                    type="radio"
                    value={pm.value}
                    {...register("paymentMethod")}
                    className="text-carnest-blue"
                  />
                  <pm.icon className="h-5 w-5 text-carnest-blue shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{pm.label}</p>
                    <p className="text-xs text-gray-500">{pm.desc}</p>
                  </div>
                  {pm.value === "WALLET" && (
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      hasEnoughBalance
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-600"
                    )}>
                      {formatCurrency(walletBalance)}
                    </span>
                  )}
                </label>
              ))}
            </div>

            {isWalletPayment && !hasEnoughBalance && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Số dư ví không đủ. Cần thêm{" "}
                  <strong>{formatCurrency(total - walletBalance)}</strong> để thanh toán.
                </span>
              </div>
            )}

            {isWalletPayment && hasEnoughBalance && total > 0 && (
              <div className="flex items-start gap-2 text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>
                  Số dư ví đủ để thanh toán. Còn lại sau khi thanh toán:{" "}
                  <strong>{formatCurrency(walletBalance - total)}</strong>
                </span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            size="xl"
            className="w-full bg-carnest-orange hover:bg-carnest-orange-dark text-white"
            disabled={checkoutMutation.isPending || selectedItems.length === 0 || (isWalletPayment && !hasEnoughBalance)}
          >
            {checkoutMutation.isPending ? "Đang đặt hàng..." : `Đặt hàng · ${formatCurrency(total)}`}
          </Button>
        </div>
      </form>

      <AddressPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        addresses={addresses ?? []}
        selectedId={selectedAddressId}
        onSelect={applyAddress}
        onEdit={(addr) => {
          setPickerOpen(false);
          setEditingAddress(addr);
          setAddressDialogOpen(true);
        }}
        onAddNew={() => {
          setPickerOpen(false);
          setEditingAddress(null);
          setAddressDialogOpen(true);
        }}
      />

      <AddressFormDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        address={editingAddress}
        onSaved={applyAddress}
      />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-center">Đang tải...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
