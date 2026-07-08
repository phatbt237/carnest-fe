"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
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
import { formatCurrency, formatDateTime, getErrorMessage, formatCompact, cn } from "@/lib/utils";
import { CONDITION_LABELS, ORDER_STATUS_LABELS, type OrderStatus, type AuctionStatus } from "@/types";
import Link from "next/link";
import { Store, Plus, Package, Truck, CheckCircle, Pencil, Trash2, Upload, ImagePlus, X, Check, Images, Eye, TrendingUp, AlertCircle, Gavel, MoreHorizontal, ShieldCheck, CalendarDays, Users, Timer, Trophy, Ban, Loader2 } from "lucide-react";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import apiClient from "@/lib/api/client";
import { auctionsApi } from "@/lib/api/auctions";
import { useInfiniteScroll } from "@/lib/hooks/use-infinite-scroll";

const UPLOAD_BASE = "http://160.250.4.26:8080";

// Trích xuất mảng URL string từ bất kỳ response format nào của upload API
function extractUrls(raw: unknown): string[] {
  if (!raw) return [];
  // ["url1", "url2"]
  if (Array.isArray(raw)) return raw.filter((u): u is string => typeof u === "string");
  if (typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;
  // { data: ["url1", ...] }  ← chuẩn ApiResponse
  if (Array.isArray(obj.data)) {
    return (obj.data as unknown[])
      .map((item) =>
        typeof item === "string" ? item
        : typeof item === "object" && item !== null
          ? ((item as Record<string, unknown>).url as string)
            ?? ((item as Record<string, unknown>).imageUrl as string)
            ?? null
          : null
      )
      .filter((u): u is string => typeof u === "string");
  }
  // { data: { urls: [...] } }
  if (typeof obj.data === "object" && obj.data !== null) {
    const inner = obj.data as Record<string, unknown>;
    if (Array.isArray(inner.urls)) return inner.urls.filter((u): u is string => typeof u === "string");
    if (Array.isArray(inner.imageUrls)) return inner.imageUrls.filter((u): u is string => typeof u === "string");
  }
  // { data: "url1" }
  if (typeof obj.data === "string") return [obj.data];
  // { urls: [...] }
  if (Array.isArray(obj.urls)) return obj.urls.filter((u): u is string => typeof u === "string");
  return [];
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
const shopSchema = z.object({
  shopName: z.string().min(2),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  bannerUrl: z.string().optional(),
  returnPolicy: z.string().optional(),
  shippingInfo: z.string().optional(),
});

type ShopForm = z.infer<typeof shopSchema>;

const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),
  categoryId: z.number().min(1),
  brandId: z.number().min(1),
  scale: z.enum(["1:64", "1:43", "1:24", "1:18"]),
  carBrand: z.string().min(1),
  carModel: z.string().min(1),
  color: z.string().optional(),
  material: z.string().optional(),
  condition: z.enum(["SEALED", "OPENED", "LOOSE", "DAMAGED_BOX", "CUSTOM"]),
  price: z.number().min(1000),
  quantity: z.number().min(1),
  freeShipping: z.boolean(),
  isCombo: z.boolean(),
  allowOffer: z.boolean(),
  imageUrls: z.string().min(1, "Vui lòng tải ít nhất 1 ảnh"),
});

type ProductForm = z.infer<typeof productSchema>;

const auctionSchema = z.object({
  startingPrice: z.number().min(1000, "Giá khởi điểm tối thiểu 1,000đ"),
  bidIncrement: z.number().min(1000, "Bước giá tối thiểu 1,000đ"),
  startTime: z.string().min(1, "Vui lòng chọn thời gian bắt đầu"),
  endTime: z.string().min(1, "Vui lòng chọn thời gian kết thúc"),
}).refine((d) => new Date(d.endTime) > new Date(d.startTime), {
  message: "Thời gian kết thúc phải sau thời gian bắt đầu",
  path: ["endTime"],
});

type AuctionForm = z.infer<typeof auctionSchema>;

// ─── Single Image Upload Field ────────────────────────────────────────────────
function SingleImageUpload({
  currentUrl,
  label,
  onUploaded,
  shape = "square",
}: {
  currentUrl?: string;
  label: string;
  onUploaded: (url: string) => void;
  shape?: "square" | "circle";
}) {
  const [pending, setPending] = useState<{ file: File; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (pending) URL.revokeObjectURL(pending.preview);
    setPending({ file, preview: URL.createObjectURL(file) });
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!pending) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", pending.file);
      const res = await apiClient.post(
        `${UPLOAD_BASE}/api/upload/image?folder=general`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const raw = res.data;
      console.log("[upload/image] response:", raw);
      // Dùng extractUrls để đồng nhất cách parse, lấy phần tử đầu tiên
      const urls = extractUrls(raw);
      const url = urls[0] ?? null;
      if (url) {
        onUploaded(url);
        URL.revokeObjectURL(pending.preview);
        setPending(null);
        toast.success(`${label} đã được tải lên`);
      } else {
        console.warn("[upload/image] Không parse được URL, raw:", raw);
        toast.error("Không thể lấy URL ảnh từ server");
      }
    } catch (err) {
      console.error("[upload/image] error:", err);
      toast.error(`Lỗi tải ${label}`);
    } finally {
      setUploading(false);
    }
  };

  const displayUrl = pending?.preview ?? currentUrl;

  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-1 flex items-center gap-3">
        {displayUrl && (
          <div
            className={cn(
              "relative h-16 w-16 overflow-hidden bg-gray-100 shrink-0",
              shape === "circle" ? "rounded-full border-2 border-carnest-blue" : "rounded-lg border"
            )}
          >
            <Image src={displayUrl} alt={label} fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md cursor-pointer hover:bg-gray-50 w-fit">
            <ImagePlus className="h-3.5 w-3.5" />
            {pending ? "Đổi ảnh" : currentUrl ? "Thay ảnh" : "Chọn ảnh"}
            <input type="file" accept="image/*" className="hidden" onChange={handleSelect} />
          </label>
          {pending && (
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={handleUpload}
              className="bg-carnest-blue text-white text-xs h-7"
            >
              <Upload className="mr-1 h-3 w-3" />
              {uploading ? "Đang tải..." : "Tải ảnh lên"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Action Dropdown ──────────────────────────────────────────────────
function ProductActions({
  slug,
  onEdit,
  onEditImages,
  onAuction,
  onDelete,
}: {
  slug: string;
  onEdit: () => void;
  onEditImages: () => void;
  onAuction: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full mb-1.5 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-30 overflow-hidden py-1">
          <Link
            href={`/products/${slug}`}
            target="_blank"
            onClick={close}
            className="flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Eye className="h-4 w-4 text-gray-400" />
            Xem sản phẩm
          </Link>
          <button
            onClick={() => { onEdit(); close(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Sửa thông tin
          </button>
          <button
            onClick={() => { onEditImages(); close(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:bg-purple-50 hover:text-purple-600 transition-colors"
          >
            <Images className="h-4 w-4" />
            Sửa ảnh
          </button>
          <button
            onClick={() => { onAuction(); close(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 hover:bg-amber-50 hover:text-amber-600 transition-colors"
          >
            <Gavel className="h-4 w-4" />
            Tạo đấu giá
          </button>
          <div className="h-px bg-gray-100 my-1" />
          <button
            onClick={() => { onDelete(); close(); }}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Xóa sản phẩm
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardShopPage() {
  const queryClient = useQueryClient();
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | "">("");
  const [shipDialog, setShipDialog] = useState<number | null>(null);
  const [trackingNumber, setTrackingNumber] = useState("");
  const [auctionDialogProduct, setAuctionDialogProduct] = useState<{ id: number; name: string } | null>(null);
  const [myAuctionStatus, setMyAuctionStatus] = useState<AuctionStatus | "">("");

  // Product multi-image upload state (create dialog)
  const [pendingFiles, setPendingFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  // Edit images dialog state
  const [editImagesProduct, setEditImagesProduct] = useState<{ id: number; name: string } | null>(null);
  const [editPending, setEditPending] = useState<{ file: File; preview: string }[]>([]);
  const [editUploaded, setEditUploaded] = useState<string[]>([]);
  const [editUploading, setEditUploading] = useState(false);

  // Shop data
  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: ["my-shop"],
    queryFn: shopsApi.getMyShop,
  });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: categoriesApi.list });
  const { data: brands } = useQuery({ queryKey: ["brands"], queryFn: brandsApi.list });

  const productsQuery = useInfiniteQuery({
    queryKey: ["my-shop-products", shop?.id],
    queryFn: ({ pageParam }) =>
      productsApi.getByShop(shop!.id, { cursor: pageParam as string | undefined, size: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    enabled: !!shop,
  });

  const ordersQuery = useInfiniteQuery({
    queryKey: ["shop-orders", orderStatus],
    queryFn: ({ pageParam }) =>
      ordersApi.shopOrders({ status: orderStatus || undefined, cursor: pageParam as string | undefined }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    // no longer gates on shop — fetches in parallel with shop query
  });

  const myAuctionsQuery = useInfiniteQuery({
    queryKey: ["my-auctions", myAuctionStatus],
    queryFn: ({ pageParam }) =>
      auctionsApi.myAuctions({ status: myAuctionStatus || undefined, cursor: pageParam as string | undefined, size: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? p.nextCursor ?? undefined : undefined),
    // no longer gates on shop — fetches in parallel with shop query
  });

  const products = productsQuery.data?.pages.flatMap((p) => p.items ?? []) ?? [];
  const orders = ordersQuery.data?.pages.flatMap((p) => p.items ?? []) ?? [];
  const myAuctions = myAuctionsQuery.data?.pages.flatMap((p) => p.items ?? []) ?? [];

  const myAuctionsSentinelRef = useInfiniteScroll({
    hasMore: !!myAuctionsQuery.hasNextPage,
    isLoading: myAuctionsQuery.isFetchingNextPage,
    onLoadMore: myAuctionsQuery.fetchNextPage,
  });

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

  // Product form
  const productForm = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      freeShipping: false,
      isCombo: false,
      allowOffer: false,
      scale: "1:64",
      condition: "SEALED",
      imageUrls: "",
      quantity: 1,
    },
  });

  // Sync uploaded URLs into the form field
  useEffect(() => {
    productForm.setValue("imageUrls", uploadedUrls.join(","), {
      shouldValidate: uploadedUrls.length > 0,
    });
  }, [uploadedUrls, productForm]);

  const closeProductDialog = useCallback(() => {
    setProductDialogOpen(false);
    setEditingProductId(null);
    productForm.reset();
    setPendingFiles((curr) => {
      curr.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
    setUploadedUrls([]);
  }, [productForm]);

  const openEditProductDialog = (product: (typeof products)[0]) => {
    setEditingProductId(product.id);
    const existingImages =
      product.images?.map((img) => img.imageUrl).filter(Boolean) ??
      (product.imageUrls?.filter(Boolean) as string[] ?? []);
    setUploadedUrls(existingImages);
    setPendingFiles([]);
    productForm.reset({
      name: product.name,
      description: product.description ?? "",
      categoryId: product.category?.id ?? 0,
      brandId: product.brand?.id ?? 0,
      scale: (product.scale ?? "1:64") as "1:64" | "1:43" | "1:24" | "1:18",
      carBrand: product.carBrand ?? "",
      carModel: product.carModel ?? "",
      color: product.color ?? "",
      material: product.material ?? "",
      condition: product.condition as "SEALED" | "OPENED" | "LOOSE" | "DAMAGED_BOX" | "CUSTOM",
      price: product.price,
      quantity: product.quantity,
      freeShipping: product.freeShipping ?? false,
      isCombo: product.isCombo ?? false,
      allowOffer: product.allowOffer ?? false,
      imageUrls: existingImages.join(","),
    });
    setProductDialogOpen(true);
  };

  // Mutations
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

  const createProductMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      productsApi.create({
        ...data,
        color: data.color ?? "",
        material: data.material ?? "",
        imageUrls: data.imageUrls.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop-products"] });
      toast.success("Đăng sản phẩm thành công!");
      closeProductDialog();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const updateProductMutation = useMutation({
    mutationFn: (data: ProductForm) =>
      productsApi.update(editingProductId!, {
        ...data,
        color: data.color ?? "",
        material: data.material ?? "",
        imageUrls: data.imageUrls.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop-products"] });
      toast.success("Cập nhật sản phẩm thành công!");
      closeProductDialog();
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

  const updateImagesMutation = useMutation({
    mutationFn: ({ id, imageUrls }: { id: number; imageUrls: string[] }) =>
      productsApi.update(id, { imageUrls }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shop-products"] });
      toast.success("Đã cập nhật ảnh sản phẩm!");
      closeEditImagesDialog();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const confirmMutation = useMutation({
    mutationFn: ordersApi.confirm,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-orders"] });
      toast.success("Đã xác nhận đơn hàng");
    },
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

  const auctionForm = useForm<AuctionForm>({
    resolver: zodResolver(auctionSchema),
    defaultValues: { startingPrice: 0, bidIncrement: 0, startTime: "", endTime: "" },
  });

  const createAuctionMutation = useMutation({
    mutationFn: (data: AuctionForm & { productId: number }) =>
      auctionsApi.create({
        productId: data.productId,
        startingPrice: data.startingPrice,
        bidIncrement: data.bidIncrement,
        startTime: data.startTime + ":00",
        endTime: data.endTime + ":00",
      }),
    onSuccess: () => {
      toast.success("Tạo đấu giá thành công!");
      setAuctionDialogProduct(null);
      auctionForm.reset();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cancelAuctionMutation = useMutation({
    mutationFn: auctionsApi.cancel,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-auctions"] });
      toast.success("Đã hủy đấu giá");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // ─── Product image handlers ──────────────────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalCurrent = pendingFiles.length + uploadedUrls.length;
    const remaining = 10 - totalCurrent;
    if (remaining <= 0) {
      toast.error("Đã đạt tối đa 10 ảnh");
      e.target.value = "";
      return;
    }
    const toAdd = files.slice(0, remaining);
    const newPending = toAdd.map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    e.target.value = "";
  };

  const removePending = (index: number) => {
    setPendingFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const removeUploaded = (index: number) => {
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadProductImages = async () => {
    if (!pendingFiles.length || isUploading) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      pendingFiles.forEach(({ file }) => fd.append("files", file));
      const res = await apiClient.post(
        `${UPLOAD_BASE}/api/upload/images?folder=general`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const raw = res.data;
      console.log("[upload/images] response:", raw);

      const urls = extractUrls(raw);

      if (urls.length === 0) {
        console.warn("[upload/images] Không parse được URL từ response:", raw);
        toast.error("Server không trả về URL ảnh, kiểm tra console để biết thêm chi tiết");
        return;
      }

      setUploadedUrls((prev) => [...prev, ...urls]);
      setPendingFiles((curr) => {
        curr.forEach((f) => URL.revokeObjectURL(f.preview));
        return [];
      });
      toast.success(`Đã tải lên ${urls.length} ảnh thành công`);
    } catch (err) {
      console.error("[upload/images] error:", err);
      toast.error("Lỗi tải ảnh lên, vui lòng thử lại");
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Edit images handlers ────────────────────────────────────────────────────
  const openEditImagesDialog = (product: { id: number; name: string; imageUrls?: string[] | null; images?: { imageUrl: string }[] | null; primaryImage?: string | null }) => {
    setEditImagesProduct({ id: product.id, name: product.name });
    const existing =
      product.images?.map((img) => img.imageUrl).filter(Boolean) ??
      (product.imageUrls ?? []).filter(Boolean) as string[];
    setEditUploaded(existing);
    setEditPending([]);
  };

  const closeEditImagesDialog = () => {
    setEditImagesProduct(null);
    setEditPending((curr) => {
      curr.forEach((f) => URL.revokeObjectURL(f.preview));
      return [];
    });
    setEditUploaded([]);
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 10 - editPending.length - editUploaded.length;
    if (remaining <= 0) { toast.error("Tối đa 10 ảnh"); e.target.value = ""; return; }
    const newPending = files.slice(0, remaining).map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    setEditPending((prev) => [...prev, ...newPending]);
    e.target.value = "";
  };

  const removeEditPending = (i: number) => {
    setEditPending((prev) => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const uploadEditImages = async () => {
    if (!editPending.length || editUploading) return;
    setEditUploading(true);
    try {
      const fd = new FormData();
      editPending.forEach(({ file }) => fd.append("files", file));
      const res = await apiClient.post(
        `${UPLOAD_BASE}/api/upload/images?folder=general`,
        fd,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      const urls = extractUrls(res.data);
      if (urls.length === 0) { toast.error("Server không trả về URL ảnh"); return; }
      setEditUploaded((prev) => [...prev, ...urls]);
      setEditPending((curr) => { curr.forEach((f) => URL.revokeObjectURL(f.preview)); return []; });
      toast.success(`Đã tải lên ${urls.length} ảnh`);
    } catch {
      toast.error("Lỗi tải ảnh, vui lòng thử lại");
    } finally {
      setEditUploading(false);
    }
  };

  if (shopLoading) {
    return <div className="container mx-auto px-4 py-8 text-center text-gray-500">Đang tải...</div>;
  }

  // ─── No shop yet ─────────────────────────────────────────────────────────────
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
            <div>
              <Label>Tên shop</Label>
              <Input {...shopForm.register("shopName")} className="mt-1" />
            </div>
            <div>
              <Label>Mô tả</Label>
              <Input {...shopForm.register("description")} className="mt-1" />
            </div>
            <SingleImageUpload
              label="Logo shop"
              currentUrl={shopForm.watch("logoUrl")}
              onUploaded={(url) => shopForm.setValue("logoUrl", url)}
              shape="circle"
            />
            <SingleImageUpload
              label="Banner shop"
              currentUrl={shopForm.watch("bannerUrl")}
              onUploaded={(url) => shopForm.setValue("bannerUrl", url)}
            />
            <div>
              <Label>Chính sách hoàn trả</Label>
              <Input {...shopForm.register("returnPolicy")} className="mt-1" />
            </div>
            <div>
              <Label>Thông tin vận chuyển</Label>
              <Input {...shopForm.register("shippingInfo")} className="mt-1" />
            </div>
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
  const AUCTION_STATUSES: { value: AuctionStatus | ""; label: string }[] = [
    { value: "", label: "Tất cả" },
    { value: "UPCOMING", label: "Sắp diễn ra" },
    { value: "ACTIVE", label: "Đang đấu giá" },
    { value: "ENDED", label: "Đã kết thúc" },
    { value: "SOLD", label: "Đã bán" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];
  const totalImages = pendingFiles.length + uploadedUrls.length;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="h-6 w-6 text-carnest-blue" />
          {shop.shopName}
        </h1>
      </div>

      <Tabs defaultValue="orders">
        <TabsList className="mb-6 w-full">
          <TabsTrigger value="orders" className="flex-1">Đơn hàng</TabsTrigger>
          <TabsTrigger value="products" className="flex-1">Sản phẩm</TabsTrigger>
          <TabsTrigger value="auctions" className="flex-1">Đấu giá</TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 text-xs">Cài đặt</TabsTrigger>
        </TabsList>

        {/* ── Orders Tab ── */}
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
                {order.items && order.items.length > 0 && (
                  <div className="flex flex-col gap-2 mb-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-2.5">
                        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                          {item.productImage ? (
                            <Image
                              src={item.productImage}
                              alt={item.productName}
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
                            {item.productName}
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
                  <span className="font-bold text-carnest-orange">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <div className="flex gap-2">
                    {order.status === "PENDING" && (
                      <Button
                        size="sm"
                        className="bg-carnest-blue text-white"
                        onClick={() => confirmMutation.mutate(order.id)}
                      >
                        <CheckCircle className="mr-1 h-3.5 w-3.5" /> Xác nhận
                      </Button>
                    )}
                    {order.status === "CONFIRMED" && (
                      <Button
                        size="sm"
                        className="bg-carnest-orange text-white"
                        onClick={() => setShipDialog(order.id)}
                      >
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

        {/* ── Products Tab ── */}
        <TabsContent value="products">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{products.length} sản phẩm</p>
            <button
              onClick={() => setProductDialogOpen(true)}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-carnest-blue to-blue-400 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(59,130,246,0.35)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(59,130,246,0.45)] active:translate-y-0"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              Đăng sản phẩm
            </button>
          </div>

          <div className="space-y-3">
            {products.map((product) => {
              const mainImage = product.primaryImage || product.images?.[0]?.imageUrl || product.imageUrls?.[0];
              const isOutOfStock = product.quantity === 0;
              const isLowStock = product.quantity > 0 && product.quantity <= 3;

              return (
                <div key={product.id} className={`relative rounded-xl border shadow-sm hover:shadow-md transition-shadow ${product.isVerified ? "border-emerald-200 bg-emerald-50" : "bg-white"}`}>
                  {product.isVerified && (
                    <div className="absolute top-0 left-0 w-9 h-9 bg-emerald-500 flex items-center justify-center rounded-tl-xl rounded-br-2xl z-10">
                      <ShieldCheck className="h-5 w-5 text-white drop-shadow" />
                    </div>
                  )}
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="relative h-[88px] w-[88px] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {mainImage ? (
                        <Image src={mainImage} alt={product.name} fill className="object-cover" sizes="88px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300" />
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-[10px] font-semibold tracking-wide">Hết hàng</span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
                        <Badge
                          variant={isOutOfStock ? "destructive" : isLowStock ? "warning" : "success"}
                          className="shrink-0 text-[10px] px-1.5 py-0"
                        >
                          {isOutOfStock ? "Hết hàng" : isLowStock ? "Sắp hết" : "Đang bán"}
                        </Badge>
                      </div>

                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {product.carBrand} · {product.scale} · {CONDITION_LABELS[product.condition]}
                      </p>

                      {/* Price */}
                      <div className="mt-2">
                        <p className="text-[10px] text-gray-400 mb-0.5">Giá bán</p>
                        <p className="text-sm font-bold text-carnest-orange">{formatCurrency(product.price)}</p>
                      </div>

                      {/* Stat chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[11px] text-blue-600 whitespace-nowrap">
                          <Eye className="h-3 w-3 shrink-0" />
                          {formatCompact(product.viewCount ?? 0)} lượt xem
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-600 whitespace-nowrap">
                          <TrendingUp className="h-3 w-3 shrink-0" />
                          Đã bán {formatCompact(product.soldCount ?? 0)}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap ${isOutOfStock ? "bg-red-50 text-red-600" : isLowStock ? "bg-amber-50 text-amber-600" : "bg-gray-100 text-gray-600"}`}>
                          <Package className="h-3 w-3 shrink-0" />
                          Còn {product.quantity}
                          {isLowStock && <AlertCircle className="h-3 w-3 ml-0.5 shrink-0" />}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action bar */}
                  <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {new Date(product.createdAt).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {product.freeShipping && (
                        <span className="flex items-center gap-0.5 text-blue-500 font-medium">
                          <Truck className="h-3 w-3" />
                          Free ship
                        </span>
                      )}
                    </div>
                    <ProductActions
                      slug={product.slug}
                      onEdit={() => openEditProductDialog(product)}
                      onEditImages={() => openEditImagesDialog(product)}
                      onAuction={() => { auctionForm.reset({ startingPrice: 0, bidIncrement: 0, startTime: "", endTime: "" }); setAuctionDialogProduct({ id: product.id, name: product.name }); }}
                      onDelete={() => { if (confirm("Xóa sản phẩm này?")) deleteProductMutation.mutate(product.id); }}
                    />
                  </div>
                </div>
              );
            })}

            {products.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có sản phẩm nào</p>
                <p className="text-xs mt-1">Bấm &quot;Đăng sản phẩm&quot; để bắt đầu bán hàng</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Auctions Tab ── */}
        <TabsContent value="auctions">
          {/* Status filter */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 mb-4">
            {AUCTION_STATUSES.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setMyAuctionStatus(value)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  myAuctionStatus === value
                    ? "bg-amber-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {myAuctionsQuery.isLoading && (
              <div className="text-center py-12 text-gray-400 text-sm">Đang tải...</div>
            )}

            {!myAuctionsQuery.isLoading && myAuctions.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Gavel className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có phiên đấu giá nào</p>
                <p className="text-xs mt-1">Tạo đấu giá từ tab Sản phẩm</p>
              </div>
            )}

            {myAuctions.map((auction) => {
              const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
                UPCOMING:  { label: "Sắp diễn ra",   className: "bg-blue-50 text-blue-600",     icon: <Timer className="h-3 w-3" /> },
                ACTIVE:    { label: "Đang đấu giá",  className: "bg-green-50 text-green-600",   icon: <TrendingUp className="h-3 w-3" /> },
                ENDED:     { label: "Đã kết thúc",   className: "bg-gray-100 text-gray-500",    icon: <CheckCircle className="h-3 w-3" /> },
                SOLD:      { label: "Đã bán",         className: "bg-emerald-50 text-emerald-600", icon: <Trophy className="h-3 w-3" /> },
                CANCELLED: { label: "Đã hủy",         className: "bg-red-50 text-red-500",       icon: <Ban className="h-3 w-3" /> },
              };
              const st = statusConfig[auction.status] ?? statusConfig.ENDED;

              return (
                <div key={auction.id} className="rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <Link
                    href={`/auctions/${auction.id}`}
                    target="_blank"
                    className="flex gap-3 p-4 group"
                  >
                    {/* Image */}
                    <div className="relative h-[72px] w-[72px] rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {auction.productImage ? (
                        <Image src={auction.productImage} alt={auction.productName} fill className="object-cover group-hover:scale-105 transition-transform duration-200" sizes="72px" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-7 w-7 text-gray-300" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Title + badge trên cùng 1 hàng, tên truncate */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-carnest-blue transition-colors flex-1 min-w-0">
                          {auction.productName}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${st.className}`}>
                          {st.icon}
                          {st.label}
                        </span>
                      </div>

                      {/* Giá — flex tự nhiên, không stretch full width */}
                      <div className="flex items-start gap-4 flex-wrap mb-2">
                        <div>
                          <p className="text-[10px] text-gray-400">Giá hiện tại</p>
                          <p className="text-sm font-bold text-amber-600">{formatCurrency(auction.currentPrice)}</p>
                        </div>
                        <div className="w-px h-7 bg-gray-100 shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-400">Khởi điểm</p>
                          <p className="text-xs text-gray-600">{formatCurrency(auction.startingPrice)}</p>
                        </div>
                        {auction.reservePrice && (
                          <>
                            <div className="w-px h-7 bg-gray-100 shrink-0" />
                            <div>
                              <p className="text-[10px] text-gray-400">Bảo lưu</p>
                              <p className={`text-xs font-medium ${auction.reserveMet ? "text-emerald-600" : "text-gray-500"}`}>
                                {formatCurrency(auction.reservePrice)}{auction.reserveMet && " ✓"}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Stats chips */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[11px] text-gray-600 whitespace-nowrap">
                          <Users className="h-3 w-3 shrink-0" />
                          {auction.totalBids} lượt đặt
                        </span>
                        {auction.extendedCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-[11px] text-blue-600 whitespace-nowrap">
                            <Timer className="h-3 w-3 shrink-0" />
                            Gia hạn {auction.extendedCount}x
                          </span>
                        )}
                        {auction.winnerUsername && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-[11px] text-emerald-700 min-w-0">
                            <Trophy className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[120px]">{auction.winnerUsername}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Footer — stack trên mobile, ngang trên sm+ */}
                  <div className="border-t bg-gray-50 px-4 py-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-0.5 text-[11px] text-gray-400 min-w-0">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 shrink-0" />
                        Bắt đầu: {formatDateTime(auction.startTime)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="h-3 w-3 shrink-0" />
                        Kết thúc: {formatDateTime(auction.endTime)}
                      </span>
                    </div>
                    {auction.status === "UPCOMING" && (
                      <button
                        onClick={() => {
                          if (confirm("Bạn có chắc muốn hủy phiên đấu giá này?")) {
                            cancelAuctionMutation.mutate(auction.id);
                          }
                        }}
                        disabled={cancelAuctionMutation.isPending}
                        className="self-end sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs border border-red-200 rounded-md text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Ban className="h-3 w-3" />
                        Hủy đấu giá
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {myAuctionsQuery.hasNextPage && (
              <div ref={myAuctionsSentinelRef} className="flex justify-center py-4">
                {myAuctionsQuery.isFetchingNextPage && (
                  <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Settings Tab ── */}
        <TabsContent value="settings">
          <div className="max-w-lg">
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold mb-4">Thông tin shop</h2>
              <form
                onSubmit={shopForm.handleSubmit((d) => updateShopMutation.mutate(d))}
                className="space-y-4"
              >
                <div>
                  <Label>Tên shop</Label>
                  <Input
                    {...shopForm.register("shopName")}
                    className="mt-1"
                    defaultValue={shop.shopName}
                  />
                </div>
                <div>
                  <Label>Mô tả</Label>
                  <Input
                    {...shopForm.register("description")}
                    className="mt-1"
                    defaultValue={shop.description ?? ""}
                  />
                </div>
                <SingleImageUpload
                  label="Logo shop"
                  currentUrl={shopForm.watch("logoUrl") ?? shop.logoUrl ?? undefined}
                  onUploaded={(url) => shopForm.setValue("logoUrl", url)}
                  shape="circle"
                />
                <SingleImageUpload
                  label="Banner shop"
                  currentUrl={shopForm.watch("bannerUrl") ?? shop.bannerUrl ?? undefined}
                  onUploaded={(url) => shopForm.setValue("bannerUrl", url)}
                />
                <div>
                  <Label>Chính sách hoàn trả</Label>
                  <Input
                    {...shopForm.register("returnPolicy")}
                    className="mt-1"
                    defaultValue={shop.returnPolicy ?? ""}
                  />
                </div>
                <div>
                  <Label>Thông tin vận chuyển</Label>
                  <Input
                    {...shopForm.register("shippingInfo")}
                    className="mt-1"
                    defaultValue={shop.shippingInfo ?? ""}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={updateShopMutation.isPending}
                  className="bg-carnest-blue text-white"
                >
                  {updateShopMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Create Product Dialog ── */}
      <Dialog open={productDialogOpen} onOpenChange={(open) => { if (!open) closeProductDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProductId ? "Chỉnh sửa sản phẩm" : "Đăng sản phẩm mới"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={productForm.handleSubmit((d) =>
              editingProductId ? updateProductMutation.mutate(d) : createProductMutation.mutate(d)
            )}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Tên sản phẩm <span className="text-red-500">*</span></Label>
                <Input {...productForm.register("name")} className="mt-1" />
                {productForm.formState.errors.name && (
                  <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.name.message}</p>
                )}
              </div>
              <div className="col-span-2">
                <Label>Mô tả <span className="text-red-500">*</span></Label>
                <textarea
                  {...productForm.register("description")}
                  rows={3}
                  className="w-full mt-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                />
              </div>
              <div>
                <Label>Danh mục <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => productForm.setValue("categoryId", Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Thương hiệu <span className="text-red-500">*</span></Label>
                <Select onValueChange={(v) => productForm.setValue("brandId", Number(v))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn hãng" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Hãng xe <span className="text-red-500">*</span></Label>
                <Input {...productForm.register("carBrand")} className="mt-1" placeholder="Hot Wheels" />
              </div>
              <div>
                <Label>Mẫu xe <span className="text-red-500">*</span></Label>
                <Input {...productForm.register("carModel")} className="mt-1" placeholder="'67 Camaro" />
              </div>
              <div>
                <Label>Tỉ lệ <span className="text-red-500">*</span></Label>
                <Select
                  defaultValue="1:64"
                  onValueChange={(v) => productForm.setValue("scale", v as "1:64" | "1:43" | "1:24" | "1:18")}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["1:64", "1:43", "1:24", "1:18"].map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tình trạng <span className="text-red-500">*</span></Label>
                <Select
                  defaultValue="SEALED"
                  onValueChange={(v) => productForm.setValue("condition", v as keyof typeof CONDITION_LABELS)}
                >
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CONDITION_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Màu sắc</Label>
                <Input {...productForm.register("color")} className="mt-1" placeholder="Đỏ" />
              </div>
              <div>
                <Label>Chất liệu</Label>
                <Input {...productForm.register("material")} className="mt-1" placeholder="Diecast" />
              </div>
              <div>
                <Label>Giá bán (VNĐ) <span className="text-red-500">*</span></Label>
                <Controller
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormattedNumberInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="100.000"
                      className="mt-1"
                    />
                  )}
                />
                {productForm.formState.errors.price && (
                  <p className="text-xs text-red-500 mt-1">{productForm.formState.errors.price.message}</p>
                )}
              </div>
              <div>
                <Label>Số lượng <span className="text-red-500">*</span></Label>
                <Controller
                  control={productForm.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormattedNumberInput
                      value={field.value}
                      onChange={field.onChange}
                      min={1}
                      placeholder="1"
                      className="mt-1"
                    />
                  )}
                />
              </div>

              {/* ── Image Upload Section ── */}
              <div className="col-span-2 rounded-lg border border-dashed border-gray-200 p-3 bg-gray-50/50">
                <div className="flex items-center justify-between mb-2.5">
                  <Label className="text-sm">
                    Ảnh sản phẩm <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(tối đa 10)</span>
                  </Label>
                  {totalImages > 0 && (
                    <span className="text-xs text-gray-400 tabular-nums">{totalImages}/10</span>
                  )}
                </div>

                {/* Thumbnail strip */}
                {totalImages > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {uploadedUrls.map((url, i) => (
                      <div
                        key={`up-${i}`}
                        className="relative h-14 w-14 shrink-0 rounded-md overflow-visible"
                      >
                        <div className="h-14 w-14 rounded-md overflow-hidden border-2 border-green-400 ring-1 ring-green-100">
                          <Image
                            src={url}
                            alt=""
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        {/* Uploaded badge */}
                        <span className="absolute -bottom-1.5 -left-1.5 bg-green-500 rounded-full p-0.5 shadow">
                          <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                        </span>
                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => removeUploaded(i)}
                          className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <X className="h-2.5 w-2.5 text-gray-500 hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                    {pendingFiles.map(({ preview }, i) => (
                      <div
                        key={`pend-${i}`}
                        className="relative h-14 w-14 shrink-0 rounded-md overflow-visible"
                      >
                        <div className="h-14 w-14 rounded-md overflow-hidden border-2 border-dashed border-gray-300 opacity-70">
                          <Image
                            src={preview}
                            alt=""
                            width={56}
                            height={56}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removePending(i)}
                          className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow hover:bg-red-50 hover:border-red-300 transition-colors"
                        >
                          <X className="h-2.5 w-2.5 text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Controls row */}
                <div className="flex items-center gap-2">
                  {totalImages < 10 && (
                    <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border bg-white rounded-md cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                      <ImagePlus className="h-3.5 w-3.5 text-gray-500" />
                      Chọn ảnh
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </label>
                  )}
                  {pendingFiles.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={isUploading}
                      onClick={uploadProductImages}
                      className="bg-carnest-blue text-white h-7 text-xs px-3"
                    >
                      <Upload className="mr-1 h-3.5 w-3.5" />
                      {isUploading ? "Đang tải..." : `Tải lên ${pendingFiles.length} ảnh`}
                    </Button>
                  )}
                  {totalImages === 0 && pendingFiles.length === 0 && (
                    <p className="text-xs text-gray-400">Chưa có ảnh nào được chọn</p>
                  )}
                </div>

                {productForm.formState.errors.imageUrls && (
                  <p className="text-xs text-red-500 mt-1.5">
                    {productForm.formState.errors.imageUrls.message}
                  </p>
                )}
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
              <Button type="button" variant="outline" onClick={closeProductDialog}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
                className="bg-carnest-orange text-white"
              >
                {editingProductId
                  ? (updateProductMutation.isPending ? "Đang lưu..." : "Lưu thay đổi")
                  : (createProductMutation.isPending ? "Đang đăng..." : "Đăng sản phẩm")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Images Dialog ── */}
      <Dialog open={!!editImagesProduct} onOpenChange={(open) => { if (!open) closeEditImagesDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa ảnh sản phẩm</DialogTitle>
            {editImagesProduct && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{editImagesProduct.name}</p>
            )}
          </DialogHeader>

          <div className="space-y-4">
            {/* Image grid */}
            <div className="rounded-lg border border-dashed border-gray-200 p-3 bg-gray-50/50">
              <div className="flex items-center justify-between mb-2.5">
                <Label className="text-sm">
                  Ảnh sản phẩm
                  <span className="text-gray-400 font-normal ml-1">(tối đa 10)</span>
                </Label>
                <span className="text-xs text-gray-400 tabular-nums">
                  {editUploaded.length + editPending.length}/10
                </span>
              </div>

              {/* Thumbnail strip */}
              {(editUploaded.length > 0 || editPending.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-2.5">
                  {editUploaded.map((url, i) => (
                    <div key={`eu-${i}`} className="relative h-16 w-16 shrink-0 rounded-md overflow-visible">
                      <div className="h-16 w-16 rounded-md overflow-hidden border-2 border-green-400 ring-1 ring-green-100">
                        <Image src={url} alt="" width={64} height={64} className="object-cover w-full h-full" />
                      </div>
                      <span className="absolute -bottom-1.5 -left-1.5 bg-green-500 rounded-full p-0.5 shadow">
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditUploaded((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow hover:bg-red-50 hover:border-red-300 transition-colors"
                      >
                        <X className="h-2.5 w-2.5 text-gray-500" />
                      </button>
                    </div>
                  ))}
                  {editPending.map(({ preview }, i) => (
                    <div key={`ep-${i}`} className="relative h-16 w-16 shrink-0 rounded-md overflow-visible">
                      <div className="h-16 w-16 rounded-md overflow-hidden border-2 border-dashed border-gray-300 opacity-70">
                        <Image src={preview} alt="" width={64} height={64} className="object-cover w-full h-full" />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEditPending(i)}
                        className="absolute -top-1.5 -right-1.5 bg-white border border-gray-200 rounded-full p-0.5 shadow hover:bg-red-50 transition-colors"
                      >
                        <X className="h-2.5 w-2.5 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Controls */}
              <div className="flex items-center gap-2">
                {(editUploaded.length + editPending.length) < 10 && (
                  <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs border bg-white rounded-md cursor-pointer hover:bg-gray-50 transition-colors shadow-sm">
                    <ImagePlus className="h-3.5 w-3.5 text-gray-500" />
                    Chọn ảnh
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleEditFileSelect} />
                  </label>
                )}
                {editPending.length > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={editUploading}
                    onClick={uploadEditImages}
                    className="bg-carnest-blue text-white h-7 text-xs px-3"
                  >
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    {editUploading ? "Đang tải..." : `Tải lên ${editPending.length} ảnh`}
                  </Button>
                )}
                {editUploaded.length === 0 && editPending.length === 0 && (
                  <p className="text-xs text-gray-400">Chưa có ảnh nào</p>
                )}
              </div>
            </div>

            {/* Save */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={closeEditImagesDialog}>Hủy</Button>
              <Button
                disabled={updateImagesMutation.isPending || editPending.length > 0}
                onClick={() => editImagesProduct && updateImagesMutation.mutate({ id: editImagesProduct.id, imageUrls: editUploaded })}
                className="bg-carnest-orange text-white"
              >
                {updateImagesMutation.isPending ? "Đang lưu..." : "Lưu ảnh"}
              </Button>
            </div>
            {editPending.length > 0 && (
              <p className="text-xs text-amber-600 text-right -mt-2">
                Hãy tải ảnh lên trước khi lưu
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Create Auction Dialog ── */}
      <Dialog open={!!auctionDialogProduct} onOpenChange={(open) => { if (!open) { setAuctionDialogProduct(null); auctionForm.reset(); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gavel className="h-4 w-4 text-amber-500" />
              Tạo đấu giá
            </DialogTitle>
            {auctionDialogProduct && (
              <p className="text-sm text-gray-500 mt-0.5 truncate">{auctionDialogProduct.name}</p>
            )}
          </DialogHeader>
          <form
            onSubmit={auctionForm.handleSubmit((d) =>
              auctionDialogProduct && createAuctionMutation.mutate({ ...d, productId: auctionDialogProduct.id })
            )}
            className="space-y-4"
          >
            <div>
              <Label>Giá khởi điểm (VNĐ) <span className="text-red-500">*</span></Label>
              <Controller
                control={auctionForm.control}
                name="startingPrice"
                render={({ field }) => (
                  <FormattedNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    min={1000}
                    placeholder="100.000"
                    className="mt-1"
                  />
                )}
              />
              {auctionForm.formState.errors.startingPrice && (
                <p className="text-xs text-red-500 mt-1">{auctionForm.formState.errors.startingPrice.message}</p>
              )}
            </div>
            <div>
              <Label>Bước giá (VNĐ) <span className="text-red-500">*</span></Label>
              <Controller
                control={auctionForm.control}
                name="bidIncrement"
                render={({ field }) => (
                  <FormattedNumberInput
                    value={field.value}
                    onChange={field.onChange}
                    min={1000}
                    placeholder="10.000"
                    className="mt-1"
                  />
                )}
              />
              {auctionForm.formState.errors.bidIncrement && (
                <p className="text-xs text-red-500 mt-1">{auctionForm.formState.errors.bidIncrement.message}</p>
              )}
            </div>
            <div>
              <Label>Thời gian bắt đầu *</Label>
              <Input
                type="datetime-local"
                {...auctionForm.register("startTime")}
                className="mt-1"
              />
              {auctionForm.formState.errors.startTime && (
                <p className="text-xs text-red-500 mt-1">{auctionForm.formState.errors.startTime.message}</p>
              )}
            </div>
            <div>
              <Label>Thời gian kết thúc *</Label>
              <Input
                type="datetime-local"
                {...auctionForm.register("endTime")}
                className="mt-1"
              />
              {auctionForm.formState.errors.endTime && (
                <p className="text-xs text-red-500 mt-1">{auctionForm.formState.errors.endTime.message}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => { setAuctionDialogProduct(null); auctionForm.reset(); }}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createAuctionMutation.isPending}
                className="bg-amber-500 hover:bg-amber-600 text-white"
              >
                {createAuctionMutation.isPending ? "Đang tạo..." : "Tạo đấu giá"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Ship Dialog ── */}
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
              onClick={() =>
                shipDialog && shipMutation.mutate({ orderId: shipDialog, trackingNumber })
              }
            >
              {shipMutation.isPending ? "Đang xử lý..." : "Xác nhận giao hàng"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
