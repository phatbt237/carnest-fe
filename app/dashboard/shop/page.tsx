"use client";

import { useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { shopsApi } from "@/lib/api/shops";
import type { CreateShopRequest } from "@/types";
import { productsApi } from "@/lib/api/products";
import { ordersApi } from "@/lib/api/orders";
import { categoriesApi } from "@/lib/api/categories";
import { brandsApi } from "@/lib/api/brands";
import { formatCurrency, formatDateTime, getErrorMessage } from "@/lib/utils";
import { CONDITION_LABELS, ORDER_STATUS_LABELS, type OrderStatus } from "@/types";
import { Store, Plus, Package, Truck, CheckCircle, Pencil, Trash2 } from "lucide-react";

// ─── Create/Edit Shop ────────────────────────────────────────────────────────
const shopSchema = z.object({
  shopName: z.string().min(2),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  returnPolicy: z.string().optional(),
  shippingInfo: z.string().optional(),
});

type ShopForm = z.infer<typeof shopSchema>;

// ─── Create Product ───────────────────────────────────────────────────────────
const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.number().min(1),
  brandId: z.number().min(1),
  scale: z.enum(["1:64", "1:43", "1:24", "1:18"]),
  carBrand: z.string().min(1),
  carModel: z.string().min(1),
  color: z.string().min(1),
  material: z.string().min(1),
  condition: z.enum(["SEALED", "OPENED", "LOOSE", "DAMAGED_BOX", "CUSTOM"]),
  price: z.number().min(1000),
  quantity: z.number().min(1),
  freeShipping: z.boolean(),
  isCombo: z.boolean(),
  allowOffer: z.boolean(),
  imageUrls: z.string(), // comma-separated
});

type ProductForm = z.infer<typeof productSchema>;

export default function DashboardShopPage() {
  const queryClient = useQueryClient();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | "">("");
  const [shipDialog, setShipDialog] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");

  // Shop data
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["my-shop"],
    queryFn: shopsApi.getMyShop,
  });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: brandsApi.list });

  // Products
  const productsQuery = useInfiniteQuery({
    queryKey: ["my-shop-products", shop?.id],
    queryFn: ({ pageParam }) =>
      productsApi.getByShop(shop!.id, { cursor: pageParam as string | undefined, size: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    enabled: !!shop,
  });

  // Shop orders
  const ordersQuery = useInfiniteQuery({
    queryKey: ["shop-orders", orderStatus],
    queryFn: ({ pageParam }) =>
      ordersApi.shopOrders({ status: orderStatus || undefined, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    enabled: !!shop,
  });

  const products = productsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const orders = ordersQuery.data?.pages.flatMap((p) => p.items) ?? [];

  // Shop form
  const shopForm = useForm<ShopForm>({
    resolver: zodResolver(shopSchema),
    defaultValues: shop
      ? {
          shopName: shop.shopName,
          description: shop.description ?? undefined,
          logoUrl: shop.logoUrl ?? undefined,
          bannerUrl: shop.bannerUrl ?? undefined,
          returnPolicy: shop.returnPolicy ?? undefined,
          shippingInfo: shop.shippingInfo ?? undefined,
        }
      : {},
  });

  const createShopMutation = useMutation({
    mutationFn: shopsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop"] });
      toast.success("Tạo shop thành công!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateShopMutation = useMutation({
    mutationFn: shopsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop"] });
      toast.success("Cập nhật shop thành công!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Product form
  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      freeShipping: false,
      isCombo: false,
      allowOffer: false,
      scale: "1:64",
      condition: "SEALED",
    },
  });

  const createProductMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      productsApi.create({
        ...data,
        imageUrls: data.imageUrls.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop-products"] });
      toast.success("Đăng sản phẩm thành công!");
      setProductDialogOpen(false);
      productForm.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const deleteProductMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop-products"] });
      toast.success("Đã xóa sản phẩm");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Order actions
  const confirmMutation = useMutation({
    mutationFn: ordersApi.confirm,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["shop-orders"] }); toast.success("Đã xác nhận đơn hàng"); },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const shipMutation = useMutation({
    mutationFn: ({ orderId, trackingNumber }: { orderId: number; trackingNumber: string }) =>
      ordersApi.ship(orderId, { trackingNumber, shippingMethod: "Giao hàng nhanh" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
      toast.success("Đã gửi hàng!");
      setShipDialog(null);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (shopLoading) {
    return <div className="container mx-auto px-4 py-8 text-center text-gray-500">Đang tải...</div>;
  }

  // No shop yet
  if (!shop) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Store className="h-6 w-6" /> Tạo Shop
        </h1>
        <div className="rounded-xl border bg-white p-6">
          <form
            onSubmit={shopForm.handleSubmit((d) => createShopMutation.mutate(d as unknown as CreateShopRequest))}
            className="space-y-4"
          >
            {["shopName", "description", "logoUrl", "bannerUrl", "returnPolicy", "shippingInfo"].map(
              (field) => (
                <div key={field}>
                  <Label>{field}</Label>
                  <Input {...shopForm.register(field as keyof ShopForm)} className="mt-1" />
                </div>
              )
            )}
            <Button
              type="submit"
              disabled={createShopMutation.isPending}
              className="w-full bg-carnest-blue text-white"
            >
              {createShopMutation.isPending ? "Đang tạo..." : "Tạo Shop"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  const STATUS_ORDERS = ["", "PENDING", "CONFIRMED", "SHIPPING", "COMPLETED", "CANCELLED"] as (OrderStatus | "")[];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="h-6 w-6 text-carnest-blue" />
          {shop.shopName}
        </h1>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Đơn hàng</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt shop</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {STATUS_ORDERS.map((s) => (
              <button
                key={s}
                onClick={() => setOrderStatus(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  orderStatus === s
                    ? "bg-carnest-blue text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {s ? ORDER_STATUS_LABELS[s] : "Tất cả"}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-xl border bg-white p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">#{order.orderCode}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Người mua: {order.buyer?.fullName}</p>
                  </div>
                  <Badge>{ORDER_STATUS_LABELS[order.status]}</Badge>
                </div>
                {/* Product items */}
                {order.items && order.items.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2.5">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {((item as any).productImage ?? item.product?.imageUrls?.[0]) ? (
                            <Image
                              src={(item as any).productImage ?? item.product!.imageUrls[0]}
                              alt={(item as any).productName ?? item.product?.name ?? ""}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-gray-300">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {(item as any).productName ?? item.product?.name ?? ""}
                          </p>
                          <p className="text-xs text-gray-500">
                            x{item.quantity} · {formatCurrency(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-3">
                  {order.shippingName} · {order.shippingPhone} · {order.shippingAddress}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-carnest-orange">{formatCurrency(order.totalAmount ?? order.totalPrice)}</span>
                  <div className="flex gap-2">
                    {order.status === "PENDING" && (
                      <Button size="sm" className="bg-carnest-blue text-white" onClick={() => confirmMutation.mutate(order.id)}>
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Xác nhận
                      </Button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <Button size="sm" className="bg-carnest-orange text-white" onClick={() => setShipDialog(order.id)}>
                        <Truck className="mr-1 h-3.5 w-3.5" /> Giao hàng
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>Không có đơn hàng nào</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex justify-end mb-4">
            <Button
              onClick={() => setProductDialogOpen(true)}
              className="bg-carnest-blue text-white"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Đăng sản phẩm
            </Button>
          </div>
          <div className="space-y-3">
            {products.map((product) => (
              <div key={product.id} className="flex gap-3 p-4 rounded-xl border bg-white">
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                  <Image src={product.imageUrls?.[0] || "/placeholder-car.jpg"} alt={product.name} fill className="object-cover" sizes="64px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.scale} · {CONDITION_LABELS[product.condition]}</p>
                  <p className="text-sm font-bold text-carnest-orange mt-1">{formatCurrency(product.price)}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Badge variant="outline" className="text-xs">{product.quantity} còn</Badge>
                  <button
                    onClick={() => { if (confirm("Xóa sản phẩm này?")) deleteProductMutation.mutate(product.id); }}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="max-w-lg">
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold mb-4">Thông tin shop</h2>
              <form
                onSubmit={shopForm.handleSubmit((d) => updateShopMutation.mutate(d))}
                className="space-y-4"
              >
                {[
                  { key: "shopName", label: "Tên shop" },
                  { key: "description", label: "Mô tả" },
                  { key: "logoUrl", label: "URL Logo" },
                  { key: "bannerUrl", label: "URL Banner" },
                  { key: "returnPolicy", label: "Chính sách hoàn trả" },
                  { key: "shippingInfo", label: "Thông tin vận chuyển" },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <Label>{label}</Label>
                    <Input {...shopForm.register(key as keyof ShopForm)} className="mt-1" defaultValue={(shop as unknown as Record<string, string | undefined>)[key] || ""} />
                  </div>
                ))}
                <Button type="submit" disabled={updateShopMutation.isPending} className="bg-carnest-blue text-white">
                  {updateShopMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Product Dialog */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đăng sản phẩm mới</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={productForm.handleSubmit((d) => createProductMutation.mutate(d))}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tên sản phẩm *</Label>
                <Input {...productForm.register("name")} className="mt-1" />
                {productForm.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Mô tả *</Label>
                <textarea
                  {...productForm.register("description")}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <Label>Danh mục *</Label>
                <Select onValueChange={(v) => productForm.setValue("categoryId", Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thương hiệu *</Label>
                <Select onValueChange={(v) => productForm.setValue("brandId", Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn hãng" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands?.map((b) => <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hãng xe *</Label>
                <Input {...productForm.register("carBrand")} className="mt-1" placeholder="Hot Wheels" />
              </div>
              <div>
                <Label>Mẫu xe *</Label>
                <Input {...productForm.register("carModel")} className="mt-1" placeholder="'67 Camaro" />
              </div>
              <div>
                <Label>Tỉ lệ *</Label>
                <Select defaultValue="1:64" onValueChange={(v) => productForm.setValue("scale", v as "1:64" | "1:43" | "1:24" | "1:18")}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1:64", "1:43", "1:24", "1:18"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tình trạng *</Label>
                <Select defaultValue="SEALED" onValueChange={(v) => productForm.setValue("condition", v as keyof typeof CONDITION_LABELS)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Màu sắc *</Label>
                <Input {...productForm.register("color")} className="mt-1" placeholder="Đỏ" />
              </div>
              <div>
                <Label>Chất liệu *</Label>
                <Input {...productForm.register("material")} className="mt-1" placeholder="Diecast" />
              </div>
              <div>
                <Label>Giá bán (VNĐ) *</Label>
                <Input type="number" {...productForm.register("price", { valueAsNumber: true })} className="mt-1" />
                {productForm.formState.errors.price && (
                  <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.price.message}</p>
                )}
              </div>
              <div>
                <Label>Số lượng *</Label>
                <Input type="number" {...productForm.register("quantity", { valueAsNumber: true })} className="mt-1" min={1} />
              </div>
              <div className="col-span-2">
                <Label>URLs ảnh (cách nhau bằng dấu phẩy) *</Label>
                <Input {...productForm.register("imageUrls")} className="mt-1" placeholder="https://img1.jpg, https://img2.jpg" />
              </div>
              <div className="col-span-2 flex gap-4">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...productForm.register("freeShipping")} className="rounded" />
                  Miễn phí vận chuyển
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...productForm.register("allowOffer")} className="rounded" />
                  Cho phép đề xuất giá
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" {...productForm.register("isCombo")} className="rounded" />
                  Combo
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setProductDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createProductMutation.isPending} className="bg-carnest-orange text-white">
                {createProductMutation.isPending ? "Đang đăng..." : "Đăng sản phẩm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ship dialog */}
      <Dialog open={!!shipDialog} onOpenChange={() => setShipDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Giao hàng</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Mã vận đơn</Label>
              <Input
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                className="mt-1"
                placeholder="Nhập mã tracking"
              />
            </div>
            <Button
              className="w-full bg-carnest-orange text-white"
              disabled={!trackingNumber || shipMutation.isPending}
              onClick={() => shipDialog && shipMutation.mutate({ orderId: shipDialog, trackingNumber })}
            >
              {shipMutation.isPending ? "Đang xử lý..." : "Xác nhận giao hàng"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
