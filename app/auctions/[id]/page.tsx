"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Gavel,
  Users,
  Zap,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Trophy,
  Bot,
  Crown,
  Share2,
  CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountdownTimer } from "@/components/auction/countdown-timer";
import { auctionsApi } from "@/lib/api/auctions";
import { useAuctionWebSocket } from "@/lib/hooks/use-auction-ws";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatDateTime, getErrorMessage, formatCompact } from "@/lib/utils";
import type { Auction, AuctionBidEvent } from "@/types";

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [bidAmount, setBidAmount] = useState(0);
  const [maxAutoBid, setMaxAutoBid] = useState(0);
  const [showBids, setShowBids] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: auction?.product?.name, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const { data: auction, isLoading } = useQuery({
    queryKey: ["auction", auctionId],
    queryFn: () => auctionsApi.getById(auctionId),
    refetchInterval: 30000, // poll every 30s as fallback
  });

  // WebSocket for realtime updates
  const handleWsEvent = useCallback(
    (event: AuctionBidEvent) => {
      queryClient.setQueryData(
        ["auction", auctionId],
        (old: Auction | undefined) => {
          if (!old) return old;
          return {
            ...old,
            currentPrice: event.currentPrice,
            bidCount: event.bidCount,
            totalBids: event.bidCount,
            highestBidder: event.highestBidder ?? old.highestBidder,
            endTime: event.endTime || old.endTime,
            status: event.type === "AUCTION_ENDED" ? "ENDED" : old.status,
          };
        }
      );
      if (event.type === "AUCTION_ENDED") {
        toast.success(
          event.winner
            ? `Đấu giá kết thúc! Người chiến thắng: ${event.winner.username}`
            : "Đấu giá đã kết thúc"
        );
      }
    },
    [auctionId, queryClient]
  );

  const { connected } = useAuctionWebSocket(
    auction?.status === "ACTIVE" ? auctionId : null,
    handleWsEvent
  );

  // Auto-fill bid suggestion
  useEffect(() => {
    if (auction) {
      const minBid = auction.currentPrice + auction.bidIncrement;
      setBidAmount(minBid);
    }
  }, [auction]);

  const bidMutation = useMutation({
    mutationFn: ({ amount, maxAuto }: { amount: number; maxAuto?: number }) =>
      auctionsApi.bid(auctionId, { bidAmount: amount, maxAutoBid: maxAuto }),
    onMutate: async ({ amount }) => {
      // Optimistic update: hiển thị giá mới ngay lập tức, không chờ API
      await queryClient.cancelQueries({ queryKey: ["auction", auctionId] });
      const previous = queryClient.getQueryData<Auction>(["auction", auctionId]);
      queryClient.setQueryData(["auction", auctionId], (old: Auction | undefined) => {
        if (!old) return old;
        return {
          ...old,
          currentPrice: amount,
          bidCount: (old.bidCount ?? 0) + 1,
          totalBids: (old.totalBids ?? 0) + 1,
        };
      });
      return { previous };
    },
    onSuccess: (data) => {
      // Đè bằng data thực từ server — chính xác nhất
      queryClient.setQueryData(["auction", auctionId], data);
      toast.success("Đặt bid thành công!");
      setBidAmount(data.currentPrice + data.bidIncrement);
      setMaxAutoBid(0);
    },
    onError: (err, _, context) => {
      // Revert về giá cũ nếu API thất bại
      if (context?.previous) {
        queryClient.setQueryData(["auction", auctionId], context.previous);
      }
      toast.error(getErrorMessage(err));
    },
  });

  const handleBid = () => {
    if (!isAuthenticated) { toast.error("Vui lòng đăng nhập"); return; }
    const amount = bidAmount;
    if (!amount || amount <= 0) { toast.error("Nhập số tiền bid hợp lệ"); return; }
    bidMutation.mutate({ amount, maxAuto: maxAutoBid > 0 ? maxAutoBid : undefined });
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) { toast.error("Vui lòng đăng nhập"); return; }
    if (auction?.buyNowPrice) {
      bidMutation.mutate({ amount: auction.buyNowPrice });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500">
        Đang tải...
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="container mx-auto px-4 py-8 text-center text-gray-500">
        Không tìm thấy phiên đấu giá
      </div>
    );
  }

  const minNextBid = auction.currentPrice + auction.bidIncrement;

  // Collect all images from all possible sources
  const allImages: string[] = (() => {
    const p = auction.product;
    const fromImages = p?.images?.map((img) => img.imageUrl).filter(Boolean) ?? [];
    const fromUrls = (p?.imageUrls ?? []).filter(Boolean) as string[];
    const fromPrimary = p?.primaryImage ? [p.primaryImage] : [];
    const merged = fromImages.length > 0 ? fromImages : fromUrls.length > 0 ? fromUrls : fromPrimary;
    return merged.filter((url, i) => merged.indexOf(url) === i);
  })();

  const mainImage = allImages[activeImage] ?? allImages[0] ?? "/placeholder-car.jpg";

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-carnest-blue">Trang chủ</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/auctions" className="hover:text-carnest-blue">Đấu giá</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-900 truncate max-w-[200px]">{auction.product?.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Product image gallery */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={mainImage}
              alt={auction.product?.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
            {auction.status === "ACTIVE" && (
              <div className="absolute top-3 left-3">
                <Badge variant="success" className="animate-pulse">
                  🔴 Đang đấu giá
                </Badge>
              </div>
            )}
            {auction.status === "ENDED" && (
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-gray-800/80 text-gray-200 border-gray-700">
                  Đã kết thúc
                </Badge>
              </div>
            )}
            {allImages.length > 1 && (
              <div className="absolute bottom-3 right-3 bg-black/50 text-white text-xs rounded-full px-2 py-0.5">
                {activeImage + 1} / {allImages.length}
              </div>
            )}
          </div>

          {/* Thumbnail strip */}
          {allImages.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {allImages.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === idx
                      ? "border-carnest-blue ring-1 ring-carnest-blue"
                      : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="64px" />
                </button>
              ))}
            </div>
          )}

          <Link
            href={`/products/${auction.product?.slug}`}
            className="text-sm text-carnest-blue hover:underline"
          >
            Xem chi tiết sản phẩm →
          </Link>
        </div>

        {/* Auction info */}
        <div className="space-y-5">
          <div>
            <div className="flex items-start gap-2">
              <h1 className="text-2xl font-bold text-gray-900 flex-1">
                {auction.product?.name}
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
            <p className="text-sm text-gray-500 mt-1">
              {auction.product?.carBrand} · {auction.product?.scale} ·{" "}
              {auction.product?.condition}
            </p>
          </div>

          {/* Current price */}
          <div className="p-5 rounded-xl bg-orange-50 border border-orange-200">
            <p className="text-sm text-gray-500 mb-1">Giá hiện tại</p>
            <p className="text-4xl font-bold text-carnest-orange">
              {formatCurrency(auction.currentPrice)}
            </p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {formatCompact(auction.totalBids ?? auction.bidCount)} lượt đặt
              </span>
            </div>
            {connected && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Đang cập nhật realtime
              </p>
            )}

            {/* Highest bidder — fallback to recentBids[0] nếu API không trả highestBidder */}
            {(() => {
              const leader = auction.highestBidder ?? (auction.recentBids?.[0] ? {
                username: auction.recentBids[0].bidderUsername,
                fullName: auction.recentBids[0].bidderUsername,
                avatarUrl: auction.recentBids[0].bidderAvatar ?? null,
              } : null);
              if (!leader) return null;
              return (
                <div className="mt-3 pt-3 border-t border-orange-200 flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-carnest-orange to-orange-400 flex items-center justify-center text-sm font-bold text-white overflow-hidden">
                      {leader.avatarUrl ? (
                        <img src={leader.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        leader.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-yellow-400 border border-white flex items-center justify-center">
                      <Crown className="h-2.5 w-2.5 text-yellow-800" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">Người đang dẫn đầu</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {leader.fullName || leader.username}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Countdown */}
          {auction.status === "ACTIVE" && (
            <div className="p-4 rounded-xl border bg-white">
              <p className="text-sm text-gray-500 mb-2 font-medium">
                Thời gian còn lại
              </p>
              <CountdownTimer endTime={auction.endTime} />
            </div>
          )}

          {auction.status === "UPCOMING" && (
            <div className="p-4 rounded-xl border bg-white">
              <p className="text-sm text-gray-500 mb-2">Bắt đầu sau</p>
              <CountdownTimer endTime={auction.startTime} />
            </div>
          )}

          {/* Ended banner */}
          {auction.status === "ENDED" && (
            <div className="p-5 rounded-xl border border-gray-200 bg-gray-50 space-y-2">
              <div className="flex items-center gap-2 text-gray-700 font-semibold">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Phiên đấu giá đã kết thúc
              </div>
              {(auction.highestBidder ?? auction.recentBids?.[0]) && (
                <p className="text-sm text-gray-500">
                  Người chiến thắng:{" "}
                  <strong className="text-gray-900">
                    {auction.highestBidder?.fullName ||
                      auction.highestBidder?.username ||
                      auction.recentBids?.[0]?.bidderUsername}
                  </strong>
                  {" "}với giá{" "}
                  <strong className="text-carnest-orange">
                    {formatCurrency(auction.currentPrice)}
                  </strong>
                </p>
              )}
            </div>
          )}

          {/* Bid form */}
          {auction.status === "ACTIVE" && (
            <div className="p-5 rounded-xl border bg-white space-y-4">
              <h3 className="font-semibold text-gray-900">Đặt đấu giá</h3>
              <p className="text-xs text-gray-500">
                Bid tối thiểu:{" "}
                <strong className="text-carnest-blue">
                  {formatCurrency(minNextBid)}
                </strong>
                {" "}(+{formatCurrency(auction.bidIncrement)} mỗi bước)
              </p>

              <div>
                <Label>Số tiền bid (VNĐ)</Label>
                <FormattedNumberInput
                  value={bidAmount}
                  onChange={setBidAmount}
                  className="mt-1"
                  min={minNextBid}
                />
              </div>

              <div>
                <Label>
                  Auto-bid tối đa (tùy chọn)
                </Label>
                <FormattedNumberInput
                  value={maxAutoBid}
                  onChange={setMaxAutoBid}
                  className="mt-1"
                  placeholder="Tự động bid đến mức này"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Hệ thống sẽ tự động bid thay bạn đến mức này
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="lg"
                  className="w-full bg-carnest-orange hover:bg-carnest-orange-dark text-white"
                  onClick={handleBid}
                  disabled={bidMutation.isPending}
                >
                  <Gavel className="mr-2 h-5 w-5" />
                  {bidMutation.isPending ? "Đang đặt bid..." : "Đặt đấu giá"}
                </Button>

                {auction.buyNowPrice && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full border-carnest-blue text-carnest-blue hover:bg-carnest-blue hover:text-white"
                    onClick={handleBuyNow}
                    disabled={bidMutation.isPending}
                  >
                    <Zap className="mr-2 h-5 w-5" />
                    Mua ngay {formatCurrency(auction.buyNowPrice)}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Auction details */}
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Chi tiết phiên đấu giá</h3>
            <Separator />
            {[
              { label: "Giá khởi điểm", value: formatCurrency(auction.startingPrice) },
              { label: "Bước nhảy", value: formatCurrency(auction.bidIncrement) },
              ...(auction.reservePrice
                ? [{ label: "Giá sàn", value: formatCurrency(auction.reservePrice) }]
                : []),
              { label: "Bắt đầu", value: formatDateTime(auction.startTime) },
              { label: "Kết thúc", value: formatDateTime(auction.endTime) },
              {
                label: "Anti-snipe",
                value: `Gia hạn ${auction.autoExtendMinutes} phút nếu bid trong ${auction.snipeThresholdMin} phút cuối`,
              },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium text-gray-900 text-right ml-2">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Bid history */}
          {((auction.recentBids && auction.recentBids.length > 0) || (auction.totalBids ?? auction.bidCount) > 0) && (
            <div className="rounded-xl border bg-white overflow-hidden">
              <button
                onClick={() => setShowBids((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <TrendingUp className="h-4 w-4 text-carnest-orange" />
                  Lịch sử đặt giá
                  <span className="rounded-full bg-carnest-orange/10 text-carnest-orange text-xs font-medium px-2 py-0.5">
                    {formatCompact(auction.totalBids ?? auction.bidCount)} lượt
                  </span>
                </div>
                {showBids
                  ? <ChevronUp className="h-4 w-4 text-gray-400" />
                  : <ChevronDown className="h-4 w-4 text-gray-400" />
                }
              </button>

              {showBids && (
                <>
                  <Separator />
                  {!auction.recentBids?.length ? (
                    <p className="px-4 py-4 text-sm text-center text-gray-400">Chưa có lượt đặt nào</p>
                  ) : (
                    <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                      {auction.recentBids.map((bid, idx) => (
                        <div key={bid.id} className="flex items-center gap-3 px-4 py-2.5">
                          <span className={`w-5 text-xs font-bold shrink-0 text-center ${idx === 0 ? "text-yellow-500" : "text-gray-300"}`}>
                            {idx === 0 ? <Trophy className="h-3.5 w-3.5 inline" /> : `#${idx + 1}`}
                          </span>
                          <div className="h-7 w-7 rounded-full bg-carnest-blue/10 border border-gray-100 flex items-center justify-center text-[11px] font-bold text-carnest-blue shrink-0 overflow-hidden">
                            {bid.bidderAvatar
                              ? <img src={bid.bidderAvatar} alt={bid.bidderUsername} className="h-full w-full object-cover" />
                              : bid.bidderUsername.charAt(0).toUpperCase()
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-medium text-gray-900 truncate">{bid.bidderUsername}</span>
                              {bid.isWinning && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-400 bg-gray-100 rounded px-1 shrink-0">
                                  <Bot className="h-2 w-2" />Đang thắng
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400">{formatDateTime(bid.createdAt)}</p>
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${idx === 0 ? "text-carnest-orange" : "text-gray-600"}`}>
                            {formatCurrency(bid.bidAmount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Trust badges */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <ShieldCheck className="h-4 w-4 text-green-500" />
            <span>Giao dịch được bảo vệ bởi CarNest</span>
          </div>
        </div>
      </div>
    </div>
  );
}
