import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CountdownTimer } from "./countdown-timer";
import { formatCurrency } from "@/lib/utils";
import type { Auction } from "@/types";
import { Users, Gavel } from "lucide-react";

const STATUS_BADGES: Record<string, { label: string; variant: "default" | "success" | "secondary" | "warning" | "destructive" | "outline" | "orange" }> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "secondary" },
  ACTIVE: { label: "Đang diễn ra", variant: "success" },
  ENDING_SOON: { label: "Sắp kết thúc", variant: "warning" },
  ENDED: { label: "Đã kết thúc", variant: "outline" },
  SOLD: { label: "Đã bán", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "destructive" },
};

interface AuctionCardProps {
  auction: Auction;
}

export function AuctionCard({ auction }: AuctionCardProps) {
  const image = auction.product?.imageUrls?.[0] || "/placeholder-car.jpg";
  const badge = STATUS_BADGES[auction.status] || STATUS_BADGES.ENDED;

  return (
    <Link href={`/auctions/${auction.id}`} className="group block">
      <div className="rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          <Image
            src={image}
            alt={auction.product?.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute top-2 left-2">
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 space-y-2">
          <h3 className="font-semibold text-sm line-clamp-2 text-gray-900">
            {auction.product?.name}
          </h3>

          {/* Current price */}
          <div>
            <p className="text-xs text-gray-500">Giá hiện tại</p>
            <p className="text-lg font-bold text-carnest-orange">
              {formatCurrency(auction.currentPrice)}
            </p>
            {auction.buyNowPrice && (
              <p className="text-xs text-gray-500">
                Mua ngay:{" "}
                <span className="font-medium text-carnest-blue">
                  {formatCurrency(auction.buyNowPrice)}
                </span>
              </p>
            )}
          </div>

          {/* Countdown */}
          {(auction.status === "ACTIVE") && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Gavel className="h-3 w-3 shrink-0" />
              <CountdownTimer endTime={auction.endTime} compact className="text-red-600 font-mono" />
            </div>
          )}
          {auction.status === "UPCOMING" && (
            <div className="text-xs text-gray-500">
              Bắt đầu: <CountdownTimer endTime={auction.startTime} compact className="text-carnest-blue" />
            </div>
          )}

          {/* Bids */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Users className="h-3 w-3" />
              <span>{auction.totalBids ?? auction.bidCount} lượt đặt</span>
            </div>
            {auction.recentBids && auction.recentBids.length > 0 && (
              <div className="flex -space-x-1.5">
                {auction.recentBids.slice(0, 3).map((bid) => (
                  <div
                    key={bid.id}
                    title={bid.bidderUsername}
                    className="h-5 w-5 rounded-full bg-carnest-blue/10 border border-white flex items-center justify-center text-[9px] font-bold text-carnest-blue overflow-hidden"
                  >
                    {bid.bidderAvatar ? (
                      <img src={bid.bidderAvatar} alt={bid.bidderUsername} className="h-full w-full object-cover" />
                    ) : (
                      bid.bidderUsername.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
                {(auction.totalBids ?? auction.bidCount) > 3 && (
                  <div className="h-5 w-5 rounded-full bg-gray-100 border border-white flex items-center justify-center text-[9px] font-medium text-gray-500">
                    +{(auction.totalBids ?? auction.bidCount) - 3}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
