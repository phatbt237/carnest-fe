"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShoppingCart,
  Truck,
  Shield,
  MessageSquare,
  Star,
  ChevronRight,
  Package,
  Tag,
  Info,
  MessageCircle,
  ArrowLeftRight,
  BadgeCheck,
  Users,
  UserPlus,
  UserMinus,
  Share2,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/product/product-gallery";
import { OfferDialog } from "@/components/product/offer-dialog";
import { TradeDialog } from "@/components/product/trade-dialog";
import { ContactDialog } from "@/components/chat/contact-dialog";
import { ReportModal } from "@/components/report/report-modal";
import { formatCurrency, getDiscountPercent, getErrorMessage, formatCompact } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { cartApi } from "@/lib/api/cart";
import { shopsApi } from "@/lib/api/shops";
import { useAuth } from "@/lib/context/auth-context";
import type { Product } from "@/types";
import { CONDITION_LABELS } from "@/types";

function getProductImages(product: Product): string[] {
  if (product.images?.length) return product.images.map((img) => img.imageUrl).filter(Boolean);
  if (product.imageUrls?.length) return product.imageUrls.filter(Boolean) as string[];
  if (product.primaryImage) return [product.primaryImage];
  return [];
}

interface Props {
  product: Product;
}

export function ProductDetailClient({ product }: Props) {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [offerOpen, setOfferOpen] = useState(false);
  const [tradeOpen, setTradeOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOwnProduct = user?.id === product.shop?.owner?.id;

  // Shop follow state
  const [shopFollowing, setShopFollowing] = useState(product.shop?.isFollowing ?? false);
  const [shopFollowerCount, setShopFollowerCount] = useState(product.shop?.followerCount ?? 0);

  const followMutation = useMutation({
    mutationFn: () =>
      shopFollowing
        ? shopsApi.unfollow(product.shop!.id)
        : shopsApi.follow(product.shop!.id),
    onSuccess: () => {
      setShopFollowerCount((c) => shopFollowing ? c - 1 : c + 1);
      setShopFollowing((f) => !f);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const discount = product.originalPrice
    ? getDiscountPercent(product.price, product.originalPrice)
    : 0;

  const addToCartMutation = useMutation({
    mutationFn: () => cartApi.add(product.id, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast.success("Đã thêm vào giỏ hàng!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      return;
    }
    addToCartMutation.mutate();
  };

  const specs = [
    { label: "Hãng xe", value: product.carBrand },
    { label: "Mẫu xe", value: product.carModel },
    { label: "Năm", value: product.yearMade },
    { label: "Màu sắc", value: product.color },
    { label: "Chất liệu", value: product.material },
    { label: "Tỉ lệ", value: product.scale },
    { label: "Tình trạng", value: CONDITION_LABELS[product.condition] },
    { label: "Danh mục", value: product.category?.name },
    { label: "Thương hiệu", value: product.brand?.name },
  ];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-carnest-blue">
          Trang chủ
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/products" className="hover:text-carnest-blue">
          Sản phẩm
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Gallery */}
        <ProductGallery images={getProductImages(product)} name={product.name} />

        {/* Product Info */}
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-xs">
              {product.scale}
            </Badge>
            <Badge
              variant={
                product.condition === "SEALED"
                  ? "success"
                  : product.condition === "CUSTOM"
                  ? "orange"
                  : "secondary"
              }
              className="text-xs"
            >
              {CONDITION_LABELS[product.condition]}
            </Badge>
            {product.freeShipping && (
              <Badge variant="success" className="text-xs flex items-center gap-1">
                <Truck className="h-3 w-3" />
                Miễn phí vận chuyển
              </Badge>
            )}
          </div>

          <div className="flex items-start gap-2">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight flex-1">
              {product.name}
            </h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="shrink-0 text-gray-400 hover:text-gray-600 h-8 w-8"
              title={copied ? "Đã sao chép link!" : "Chia sẻ"}
            >
              {copied ? <CheckCheck className="h-4 w-4 text-green-500" /> : <Share2 className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-3 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              Đã bán: {formatCompact(product.soldCount)}
            </span>
            <span>·</span>
            <span>Còn lại: {product.quantity}</span>
            {product.ratingAvg != null && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {product.ratingAvg.toFixed(1)}
                </span>
              </>
            )}
            {product.followerCount > 0 && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {formatCompact(product.followerCount)} quan tâm
                </span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-bold text-carnest-orange">
                {formatCurrency(product.price)}
              </span>
              {product.originalPrice &&
                product.originalPrice > product.price && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      {formatCurrency(product.originalPrice)}
                    </span>
                    <Badge variant="destructive">-{discount}%</Badge>
                  </>
                )}
            </div>
            {product.bulkDiscountMin && product.bulkDiscountPct && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Mua từ {product.bulkDiscountMin} sản phẩm giảm thêm{" "}
                {product.bulkDiscountPct}%
              </p>
            )}
          </div>

          {/* Quantity selector */}
          {product.quantity > 0 && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Số lượng:</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="h-9 w-9 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-medium"
                >
                  −
                </button>
                <span className="h-9 w-12 flex items-center justify-center text-sm font-medium border-x">
                  {quantity}
                </span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.quantity, q + 1))
                  }
                  className="h-9 w-9 flex items-center justify-center hover:bg-gray-100 text-gray-600 font-medium"
                >
                  +
                </button>
              </div>
              <span className="text-xs text-gray-500">
                (Còn {product.quantity})
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            {/* Primary CTA — full width */}
            <Button
              size="lg"
              className="w-full bg-carnest-orange hover:bg-carnest-orange-dark text-white"
              disabled={product.quantity === 0 || addToCartMutation.isPending}
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {product.quantity === 0 ? "Hết hàng" : "Thêm vào giỏ hàng"}
            </Button>

            {/* Secondary actions — side by side */}
            {(product.allowOffer && product.quantity > 0) ||
            (!isOwnProduct && product.quantity > 0 && isAuthenticated) ? (
              <div className="flex gap-2">
                {product.allowOffer && product.quantity > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 border-carnest-blue text-carnest-blue hover:bg-carnest-blue hover:text-white"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Vui lòng đăng nhập");
                        return;
                      }
                      setOfferOpen(true);
                    }}
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    Đề xuất giá
                  </Button>
                )}
                {!isOwnProduct && product.quantity > 0 && isAuthenticated && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 border-carnest-gold text-carnest-gold hover:bg-carnest-gold hover:text-carnest-navy"
                    onClick={() => setTradeOpen(true)}
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5 shrink-0" />
                    Đổi xe
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          {product.allowOffer && product.minOfferPrice && (
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="h-3 w-3" />
              Đề xuất tối thiểu:{" "}
              <span className="font-medium text-carnest-blue">
                {formatCurrency(product.minOfferPrice)}
              </span>
            </p>
          )}

          {/* Shipping & Security */}
          <div className="space-y-1.5 pt-1">
            {product.freeShipping && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Truck className="h-4 w-4 shrink-0" />
                <span>Miễn phí vận chuyển</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Shield className="h-4 w-4 shrink-0 text-carnest-blue" />
              <span>Giao dịch được bảo vệ bởi CarNest</span>
            </div>
          </div>

          {/* Shop card */}
          {product.shop && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              {/* Row: avatar + info */}
              <div className="flex items-center gap-3">
                <Link href={`/shops/${product.shop.slug}`} className="shrink-0">
                  <div className="h-11 w-11 rounded-full overflow-hidden bg-white border-2 border-white shadow relative">
                    {product.shop.logoUrl ? (
                      <Image
                        src={product.shop.logoUrl}
                        alt={product.shop.shopName}
                        fill
                        className="object-cover"
                        sizes="44px"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center font-bold text-carnest-blue text-base bg-carnest-blue/10">
                        {product.shop.shopName.charAt(0)}
                      </div>
                    )}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <Link href={`/shops/${product.shop.slug}`} className="group min-w-0">
                      <p className="font-semibold text-sm text-gray-900 flex items-center gap-1 group-hover:text-carnest-blue transition-colors">
                        <span className="truncate">{product.shop.shopName}</span>
                        {product.shop.isVerified && (
                          <BadgeCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                      </p>
                    </Link>
                    <ReportModal targetType="PRODUCT" targetId={product.id} />
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                      <span className="font-medium text-gray-700">{product.shop.rating?.toFixed(1) || "—"}</span>
                      {product.shop.reviewCount > 0 && (
                        <span className="text-gray-400">({formatCompact(product.shop.reviewCount)})</span>
                      )}
                    </span>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Users className="h-2.5 w-2.5" />
                      {shopFollowerCount} followers
                    </span>
                  </div>
                </div>
              </div>

              {/* Row: action buttons */}
              <div className="flex gap-2 mt-3">
                {!isOwnProduct && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 h-8 text-xs bg-white border-carnest-blue text-carnest-blue hover:bg-carnest-blue hover:text-white transition-colors"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Vui lòng đăng nhập");
                        return;
                      }
                      setContactOpen(true);
                    }}
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Nhắn tin
                  </Button>
                )}

                {!isOwnProduct && (
                  <Button
                    size="sm"
                    disabled={followMutation.isPending}
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error("Vui lòng đăng nhập");
                        return;
                      }
                      followMutation.mutate();
                    }}
                    className={cn(
                      "flex-1 gap-1.5 h-8 text-xs transition-colors",
                      shopFollowing
                        ? "bg-white border border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500"
                        : "bg-carnest-blue text-white hover:bg-carnest-blue-dark"
                    )}
                  >
                    {shopFollowing ? (
                      <><UserMinus className="h-3.5 w-3.5" />Đang theo dõi</>
                    ) : (
                      <><UserPlus className="h-3.5 w-3.5" />Theo dõi</>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Description & Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Mô tả sản phẩm
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
              {product.description}
            </div>
            {product.conditionNote && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 mb-1">
                  Ghi chú tình trạng:
                </p>
                <p className="text-sm text-amber-800">{product.conditionNote}</p>
              </div>
            )}
          </div>
        </div>

        {/* Specs */}
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Thông số kỹ thuật
          </h2>
          <div className="space-y-3">
            {specs
              .filter((s) => s.value)
              .map((spec) => (
                <div key={spec.label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{spec.label}</span>
                  <span className="font-medium text-gray-900 text-right ml-2">
                    {String(spec.value)}
                  </span>
                </div>
              ))}
            <Separator />
            {product.weightGram && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trọng lượng</span>
                <span className="font-medium">{product.weightGram}g</span>
              </div>
            )}
            {product.isCombo && product.comboQuantity && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Số lượng combo</span>
                <span className="font-medium">{product.comboQuantity}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer dialog */}
      <OfferDialog
        open={offerOpen}
        onOpenChange={setOfferOpen}
        product={product}
      />

      {/* Trade dialog */}
      <TradeDialog
        open={tradeOpen}
        onOpenChange={setTradeOpen}
        targetProduct={product}
      />

      {/* Contact seller dialog */}
      {product.shop?.owner?.id && (
        <ContactDialog
          open={contactOpen}
          onOpenChange={setContactOpen}
          receiverId={product.shop.owner.id}
          tagType="PRODUCT"
          tagId={product.id}
          tagTitle={product.name}
        />
      )}
    </div>
  );
}

