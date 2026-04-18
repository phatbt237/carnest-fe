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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CountdownTimer } from "@/components/auction/countdown-timer";
import { auctionsApi } from "@/lib/api/auctions";
import { useAuctionWebSocket } from "@/lib/hooks/use-auction-ws";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatDateTime, getErrorMessage } from "@/lib/utils";
import type { Auction, AuctionBidEvent } from "@/types";

export default function AuctionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const auctionId = Number(id);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [bidAmount, setBidAmount] = useState("");
  const [maxAutoBid, setMaxAutoBid] = useState("");
  const [showBids, setShowBids] = useState(false);

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
            highestBidder: event.highestBidder
              ? { ...old.highestBidder, ...event.highestBidder }
              : old.highestBidder,
            endTime: event.endTime || old.endTime,
            status: event.type === "AUCTION_ENDED" ? "ENDED" : old.status,
          };
        }
      );
      if (event.type === "NEW_BID") {
        toast.info(
          `Có bid mới: ${formatCurrency(event.currentPrice)} từ ${event.highestBidder?.username || "ẩn danh"}`
        );
      } else if (event.type === "AUCTION_ENDED") {
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
      setBidAmount(String(minBid));
    }
  }, [auction]);

  const bidMutation = useMutation({
    mutationFn: () =>
      auctionsApi.bid(auctionId, {
        bidAmount: Number(bidAmount),
        maxAutoBid: maxAutoBid ? Number(maxAutoBid) : undefined,
      }),
    onSuccess: () => {
      toast.success("Đặt bid thành công!");
      setBidAmount("");
      setMaxAutoBid("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleBid = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    if (!bidAmount || Number(bidAmount) <= 0) {
      toast.error("Nhập số tiền bid hợp lệ");
      return;
    }
    bidMutation.mutate();
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    if (auction?.buyNowPrice) {
      setBidAmount(String(auction.buyNowPrice));
      bidMutation.mutate();
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
  const image = auction.product?.imageUrls?.[0] || "/placeholder-car.jpg";

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
        {/* Product image */}
        <div className="space-y-3">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100">
            <Image
              src={image}
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
          </div>
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
            <h1 className="text-2xl font-bold text-gray-900">
              {auction.product?.name}
            </h1>
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
                {auction.totalBids ?? auction.bidCount} lượt đặt
              </span>
              {auction.highestBidder && (
                <span>
                  Cao nhất: <strong>{(auction.highestBidder as unknown as { username: string })?.username}</strong>
                </span>
              )}
            </div>
            {connected && (
              <p className="text-xs text-green-600 flex items-center gap-1 mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                Đang cập nhật realtime
              </p>
            )}
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

          {/* Bid form */}
          {auction.status === "ACTIVE" && (
            <div className="p-5 rounded-xl border bg-white space-y-4">
              <h3 className="font-semibold text-gray-900">Đặt bid</h3>
              <p className="text-xs text-gray-500">
                Bid tối thiểu:{" "}
                <strong className="text-carnest-blue">
                  {formatCurrency(minNextBid)}
                </strong>
                {" "}(+{formatCurrency(auction.bidIncrement)} mỗi bước)
              </p>

              <div>
                <Label>Số tiền bid (VNĐ)</Label>
                <Input
                  type="number"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  className="mt-1"
                  min={minNextBid}
                  step={auction.bidIncrement}
                />
              </div>

              <div>
                <Label>
                  Auto-bid tối đa (tùy chọn)
                </Label>
                <Input
                  type="number"
                  value={maxAutoBid}
                  onChange={(e) => setMaxAutoBid(e.target.value)}
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
                  {bidMutation.isPending ? "Đang đặt bid..." : "~"}
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
                    {auction.totalBids ?? auction.bidCount} lượt
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
                              {bid.isAutoBid && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-gray-400 bg-gray-100 rounded px-1 shrink-0">
                                  <Bot className="h-2 w-2" />Auto
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400">{formatDateTime(bid.createdAt)}</p>
                          </div>
                          <span className={`text-xs font-bold shrink-0 ${idx === 0 ? "text-carnest-orange" : "text-gray-600"}`}>
                            {formatCurrency(bid.amount)}
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
