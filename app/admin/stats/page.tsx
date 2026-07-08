"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Package,
  ShoppingCart,
  TrendingUp,
  Gavel,
  Flag,
  Star,
  Store,
  Eye,
  ShoppingBag,
  BarChart3,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adminReportsApi } from "@/lib/api/admin-reports";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatCompact, formatNumber } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";

// ─── Shared UI ────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "gold",
  loading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  color?: "gold" | "blue" | "green" | "red" | "purple";
  loading?: boolean;
}) {
  const colors = {
    gold:   "bg-carnest-gold/8   text-carnest-gold  border-carnest-gold/15",
    blue:   "bg-blue-50          text-blue-600      border-blue-100",
    green:  "bg-emerald-50       text-emerald-600   border-emerald-100",
    red:    "bg-red-50           text-red-500       border-red-100",
    purple: "bg-purple-50        text-purple-600    border-purple-100",
  };
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
        <div className={`h-9 w-9 rounded-xl border flex items-center justify-center ${colors[color]}`}>
          <Icon className="h-[18px] w-[18px]" />
        </div>
      </div>
      {loading ? (
        <Skeleton className="h-8 w-28 mb-1" />
      ) : (
        <p className="text-2xl font-bold text-gray-900 font-heading">{value}</p>
      )}
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function MiniBar({ value, max, color = "gold" }: { value: number; max: number; color?: "gold" | "blue" | "green" }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const bg = { gold: "bg-carnest-gold", blue: "bg-blue-500", green: "bg-emerald-500" }[color];
  return (
    <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${bg} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-6">
      <h3 className="font-semibold text-gray-900 font-heading mb-5">{title}</h3>
      {children}
    </div>
  );
}

function EmptyState() {
  return <p className="text-center py-10 text-sm text-gray-400">Không có dữ liệu</p>;
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 rounded-xl" />)}
    </div>
  );
}

// ─── TAB 1: Tổng quan ─────────────────────────────────────────────────────────

function TabOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: adminReportsApi.getOverview,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={Users}     label="Người dùng"       value={data ? formatNumber(data.totalUsers)    : "—"} sub={data ? `+${data.newUsersToday} hôm nay`              : undefined} color="blue"   loading={isLoading} />
        <StatCard icon={Package}   label="Sản phẩm"         value={data ? formatNumber(data.totalProducts) : "—"} sub={data ? `${formatNumber(data.activeProducts)} đang bán` : undefined} color="purple" loading={isLoading} />
        <StatCard icon={ShoppingCart} label="Đơn hàng"      value={data ? formatNumber(data.totalOrders)   : "—"} sub={data ? `${data.pendingOrders} chờ xử lý`             : undefined} color="gold"   loading={isLoading} />
        <StatCard icon={TrendingUp} label="Doanh thu"       value={data ? formatCurrency(data.totalRevenue): "—"} sub={data ? `Hôm nay: ${formatCurrency(data.revenueToday)}`  : undefined} color="green"  loading={isLoading} />
        <StatCard icon={Gavel}     label="Đấu giá đang diễn" value={data ? formatNumber(data.activeAuctions): "—"}                                                               color="gold"   loading={isLoading} />
        <StatCard icon={Flag}      label="Báo cáo chờ"      value={data ? formatNumber(data.pendingReports): "—"}                                                               color="red"    loading={isLoading} />
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/categories", label: "Quản lý danh mục", icon: Package },
          { href: "/admin/brands",     label: "Quản lý thương hiệu", icon: Store },
          { href: "/admin/reports",    label: "Xử lý báo cáo", icon: Flag },
        ].map((item) => (
          <Link key={item.href} href={item.href}
            className="flex items-center justify-between gap-2 rounded-xl border bg-white px-4 py-3 hover:shadow-sm hover:border-carnest-gold/30 transition-all group"
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4 text-gray-400 group-hover:text-carnest-gold transition-colors" />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{item.label}</span>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 text-gray-300 group-hover:text-carnest-gold transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── TAB 2: Doanh thu ─────────────────────────────────────────────────────────

function TabRevenue() {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");
  const { data: revenue = [], isLoading: loadRev } = useQuery({
    queryKey: ["admin-revenue", groupBy],
    queryFn: () => adminReportsApi.getRevenue({ groupBy }),
    staleTime: 60_000,
  });
  const { data: orders } = useQuery({
    queryKey: ["admin-order-stats"],
    queryFn: adminReportsApi.getOrderStats,
    staleTime: 60_000,
  });

  const maxRev = Math.max(...revenue.map((d) => d.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Order stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Tổng đơn"    value={orders ? formatNumber(orders.total)     : "—"} color="gold" />
        <StatCard icon={ShoppingCart} label="Chờ xử lý"   value={orders ? formatNumber(orders.pending)   : "—"} color="gold" />
        <StatCard icon={ShoppingCart} label="Hoàn thành"  value={orders ? formatNumber(orders.completed) : "—"} color="green" />
        <StatCard icon={ShoppingCart} label="Đã hủy"      value={orders ? formatNumber(orders.cancelled) : "—"} color="red" />
      </div>

      {/* Revenue chart */}
      <SectionCard title="Doanh thu theo thời gian">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            Tổng: <span className="font-semibold text-gray-900">{formatCurrency(revenue.reduce((s, d) => s + d.revenue, 0))}</span>
          </p>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Theo ngày</SelectItem>
              <SelectItem value="week">Theo tuần</SelectItem>
              <SelectItem value="month">Theo tháng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loadRev ? <ListSkeleton /> : revenue.length === 0 ? <EmptyState /> : (
          <div className="space-y-3">
            {revenue.slice(-15).map((point) => (
              <div key={point.period} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">{point.period}</span>
                <div className="flex-1"><MiniBar value={point.revenue} max={maxRev} color="gold" /></div>
                <span className="text-xs font-semibold text-gray-700 w-28 text-right shrink-0">{formatCurrency(point.revenue)}</span>
                <span className="text-[11px] text-gray-400 w-14 text-right shrink-0">{point.orderCount} đơn</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── TAB 3: Người dùng ───────────────────────────────────────────────────────

function TabUsers() {
  const [groupBy, setGroupBy] = useState<"day" | "week" | "month">("month");
  const { data: growth = [], isLoading: loadGrowth } = useQuery({
    queryKey: ["admin-users-growth", groupBy],
    queryFn: () => adminReportsApi.getUsers({ groupBy }),
    staleTime: 60_000,
  });
  const { data: buyers = [], isLoading: loadBuyers } = useQuery({
    queryKey: ["admin-top-buyers"],
    queryFn: () => adminReportsApi.getTopBuyers(10),
    staleTime: 60_000,
  });

  const maxGrowth = Math.max(...growth.map((d) => d.newUsers), 1);
  const maxSpent  = Math.max(...buyers.map((b) => b.totalSpent), 1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Growth chart */}
      <SectionCard title="Tăng trưởng người dùng">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">
            Mới: <span className="font-semibold text-gray-900">+{formatNumber(growth.reduce((s, d) => s + d.newUsers, 0))}</span>
          </p>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as typeof groupBy)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Theo ngày</SelectItem>
              <SelectItem value="week">Theo tuần</SelectItem>
              <SelectItem value="month">Theo tháng</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {loadGrowth ? <ListSkeleton /> : growth.length === 0 ? <EmptyState /> : (
          <div className="space-y-3">
            {growth.slice(-12).map((point) => (
              <div key={point.period} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">{point.period}</span>
                <div className="flex-1"><MiniBar value={point.newUsers} max={maxGrowth} color="blue" /></div>
                <span className="text-xs font-semibold text-gray-700 w-20 text-right shrink-0">+{formatNumber(point.newUsers)}</span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Top buyers */}
      <SectionCard title="Top người mua nhiều nhất">
        {loadBuyers ? <ListSkeleton /> : buyers.length === 0 ? <EmptyState /> : (
          <div className="space-y-3">
            {buyers.map((buyer, i) => (
              <div key={buyer.userId} className="flex items-center gap-3">
                <span className={`text-xs font-bold w-5 shrink-0 ${i < 3 ? "text-carnest-gold" : "text-gray-300"}`}>#{i + 1}</span>
                <div className="h-8 w-8 rounded-full bg-gray-100 overflow-hidden shrink-0 relative">
                  {buyer.avatarUrl
                    ? <Image src={buyer.avatarUrl} alt={buyer.username} fill className="object-cover" sizes="32px" />
                    : <div className="h-full w-full flex items-center justify-center text-xs font-bold text-carnest-navy">{buyer.username.charAt(0).toUpperCase()}</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">@{buyer.username}</p>
                  <MiniBar value={buyer.totalSpent} max={maxSpent} color="gold" />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-gray-800">{formatCurrency(buyer.totalSpent)}</p>
                  <p className="text-[11px] text-gray-400">{buyer.orderCount} đơn</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── TAB 4: Sản phẩm & Shop ──────────────────────────────────────────────────

function TabProducts() {
  const { data: products } = useQuery({ queryKey: ["admin-product-stats"], queryFn: adminReportsApi.getProductStats, staleTime: 60_000 });
  const { data: sold    = [], isLoading: loadSold }   = useQuery({ queryKey: ["admin-top-sold"],   queryFn: () => adminReportsApi.getTopProductsSold(10),   staleTime: 60_000 });
  const { data: viewed  = [], isLoading: loadViewed } = useQuery({ queryKey: ["admin-top-viewed"], queryFn: () => adminReportsApi.getTopProductsViewed(10), staleTime: 60_000 });
  const { data: shops   = [], isLoading: loadShops }  = useQuery({ queryKey: ["admin-top-shops"],  queryFn: () => adminReportsApi.getTopShops(10),          staleTime: 60_000 });

  const maxSold   = Math.max(...sold.map((p) => p.count), 1);
  const maxViewed = Math.max(...viewed.map((p) => p.count), 1);
  const maxShop   = Math.max(...shops.map((s) => s.revenue), 1);

  return (
    <div className="space-y-6">
      {/* Product summary */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={Package} label="Tổng sản phẩm"  value={products ? formatNumber(products.total)    : "—"} color="purple" />
        <StatCard icon={Package} label="Đang bán"        value={products ? formatNumber(products.active)   : "—"} color="green" />
        <StatCard icon={Package} label="Ẩn / Ngừng bán" value={products ? formatNumber(products.inactive) : "—"} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top sold */}
        <SectionCard title="Sản phẩm bán chạy nhất">
          {loadSold ? <ListSkeleton /> : sold.length === 0 ? <EmptyState /> : (
            <div className="space-y-3">
              {sold.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 shrink-0 ${i < 3 ? "text-carnest-gold" : "text-gray-300"}`}>#{i + 1}</span>
                  <div className="h-8 w-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                    {p.primaryImage ? <Image src={p.primaryImage} alt={p.name} fill className="object-cover" sizes="32px" /> : <div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${p.slug}`} className="text-sm font-medium text-gray-900 hover:text-carnest-gold truncate block">{p.name}</Link>
                    <MiniBar value={p.count} max={maxSold} color="gold" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 shrink-0">{formatCompact(p.count)} đã bán</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Top viewed */}
        <SectionCard title="Sản phẩm xem nhiều nhất">
          {loadViewed ? <ListSkeleton /> : viewed.length === 0 ? <EmptyState /> : (
            <div className="space-y-3">
              {viewed.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 shrink-0 ${i < 3 ? "text-carnest-gold" : "text-gray-300"}`}>#{i + 1}</span>
                  <div className="h-8 w-8 rounded-lg bg-gray-100 overflow-hidden shrink-0 relative">
                    {p.primaryImage ? <Image src={p.primaryImage} alt={p.name} fill className="object-cover" sizes="32px" /> : <div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${p.slug}`} className="text-sm font-medium text-gray-900 hover:text-carnest-gold truncate block">{p.name}</Link>
                    <MiniBar value={p.count} max={maxViewed} color="blue" />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 shrink-0">{formatCompact(p.count)} lượt xem</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Top shops */}
      <SectionCard title="Shop doanh thu cao nhất">
        {loadShops ? <ListSkeleton /> : shops.length === 0 ? <EmptyState /> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {shops.map((shop, i) => (
              <div key={shop.shopId} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-carnest-gold/20 transition-colors">
                <span className={`text-xs font-bold w-5 shrink-0 ${i < 3 ? "text-carnest-gold" : "text-gray-300"}`}>#{i + 1}</span>
                <div className="h-9 w-9 rounded-full bg-gray-100 overflow-hidden shrink-0 relative">
                  {shop.logoUrl ? <Image src={shop.logoUrl} alt={shop.shopName} fill className="object-cover" sizes="36px" /> : <div className="h-full w-full flex items-center justify-center text-xs font-bold text-carnest-navy">{shop.shopName.charAt(0)}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/shops/${shop.slug}`} className="text-sm font-medium text-gray-900 hover:text-carnest-gold truncate block">{shop.shopName}</Link>
                  <MiniBar value={shop.revenue} max={maxShop} color="gold" />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-semibold text-gray-800">{formatCurrency(shop.revenue)}</p>
                  <p className="text-[11px] text-gray-400">{shop.orderCount} đơn</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ─── TAB 5: Đấu giá ──────────────────────────────────────────────────────────

function TabAuctions() {
  const { data: auctions } = useQuery({ queryKey: ["admin-auction-stats"], queryFn: adminReportsApi.getAuctionStats, staleTime: 60_000 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Gavel} label="Tổng phiên"     value={auctions ? formatNumber(auctions.total)    : "—"} color="gold" />
        <StatCard icon={Gavel} label="Đang diễn ra"   value={auctions ? formatNumber(auctions.active)   : "—"} color="blue" />
        <StatCard icon={Gavel} label="Đã kết thúc"    value={auctions ? formatNumber(auctions.ended)    : "—"} color="purple" />
        <StatCard icon={Gavel} label="Bán thành công" value={auctions ? formatNumber(auctions.sold)     : "—"} color="green" />
      </div>

      {auctions && (
        <SectionCard title="Tỉ lệ kết quả đấu giá">
          <div className="space-y-4">
            {[
              { label: "Bán thành công", value: auctions.sold,     max: auctions.total, color: "green" as const },
              { label: "Đang diễn ra",   value: auctions.active,   max: auctions.total, color: "blue" as const },
              { label: "Kết thúc",       value: auctions.ended,    max: auctions.total, color: "gold" as const },
              { label: "Đã hủy",         value: auctions.cancelled ?? 0, max: auctions.total, color: "gold" as const },
            ].map((row) => (
              <div key={row.label} className="flex items-center gap-4">
                <span className="text-sm text-gray-600 w-36 shrink-0">{row.label}</span>
                <div className="flex-1"><MiniBar value={row.value} max={row.max} color={row.color} /></div>
                <span className="text-sm font-semibold text-gray-800 w-20 text-right shrink-0">
                  {formatNumber(row.value)} ({auctions.total > 0 ? Math.round((row.value / auctions.total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// ─── TAB 6: Đánh giá & Vi phạm ───────────────────────────────────────────────

function TabModeration() {
  const { data: reviews }    = useQuery({ queryKey: ["admin-review-stats"],    queryFn: adminReportsApi.getReviewStats,    staleTime: 60_000 });
  const { data: violations } = useQuery({ queryKey: ["admin-violation-stats"], queryFn: adminReportsApi.getViolationStats, staleTime: 60_000 });

  return (
    <div className="space-y-6">
      {/* Review cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard icon={Star} label="Tổng đánh giá" value={reviews ? formatNumber(reviews.total)      : "—"} color="gold" />
        <StatCard icon={Star} label="Điểm trung bình" value={reviews?.averageRating != null ? `${Number(reviews.averageRating).toFixed(1)} ⭐` : "—"} color="gold" />
        <StatCard icon={Flag} label="Báo cáo vi phạm" value={violations ? formatNumber(violations.total) : "—"} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review breakdown */}
        {reviews && (
          <SectionCard title="Phân bố đánh giá theo sao">
            <div className="space-y-3">
              {[
                { label: "5 sao ⭐⭐⭐⭐⭐", value: reviews.fiveStars  ?? 0 },
                { label: "4 sao ⭐⭐⭐⭐",   value: reviews.fourStars  ?? 0 },
                { label: "3 sao ⭐⭐⭐",     value: reviews.threeStars ?? 0 },
                { label: "2 sao ⭐⭐",       value: reviews.twoStars   ?? 0 },
                { label: "1 sao ⭐",         value: reviews.oneStar    ?? 0 },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-36 shrink-0">{row.label}</span>
                  <div className="flex-1"><MiniBar value={row.value} max={reviews.total || 1} color="gold" /></div>
                  <span className="text-sm font-semibold text-gray-700 w-16 text-right shrink-0">{formatNumber(row.value)}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Violation breakdown */}
        {violations && (
          <SectionCard title="Báo cáo vi phạm">
            <div className="space-y-4">
              {[
                { label: "Chờ xử lý",  value: violations.pending,   color: "blue"  as const, badge: "bg-red-100 text-red-600" },
                { label: "Đã xử lý",   value: violations.resolved,  color: "green" as const, badge: "bg-green-100 text-green-700" },
                { label: "Đã bỏ qua",  value: violations.dismissed, color: "gold"  as const, badge: "bg-gray-100 text-gray-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-28 shrink-0">{row.label}</span>
                  <div className="flex-1"><MiniBar value={row.value} max={violations.total || 1} color={row.color} /></div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.badge}`}>{formatNumber(row.value)}</span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-100">
                <Link href="/admin/reports">
                  <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs">
                    <Flag className="h-3.5 w-3.5" />
                    Xử lý báo cáo vi phạm
                  </Button>
                </Link>
              </div>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminStatsPage() {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Không có quyền truy cập
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold text-gray-900 font-heading flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-carnest-gold" />
            Báo cáo & Thống kê
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Tổng quan hiệu suất hệ thống CarNest</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => window.location.reload()}>
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="mb-6 h-10 bg-white border border-gray-200 rounded-xl p-1 gap-0.5">
          <TabsTrigger value="overview"   className="rounded-lg text-xs px-3 data-[state=active]:bg-carnest-navy data-[state=active]:text-white">Tổng quan</TabsTrigger>
          <TabsTrigger value="revenue"    className="rounded-lg text-xs px-3 data-[state=active]:bg-carnest-navy data-[state=active]:text-white">Doanh thu</TabsTrigger>
          <TabsTrigger value="users"      className="rounded-lg text-xs px-3 data-[state=active]:bg-carnest-navy data-[state=active]:text-white">Người dùng</TabsTrigger>
          <TabsTrigger value="products"   className="rounded-lg text-xs px-3 data-[state=active]:bg-carnest-navy data-[state=active]:text-white">Sản phẩm & Shop</TabsTrigger>
          <TabsTrigger value="auctions"   className="rounded-lg text-xs px-3 data-[state=active]:bg-carnest-navy data-[state=active]:text-white">Đấu giá</TabsTrigger>
          <TabsTrigger value="moderation" className="rounded-lg text-xs px-3 data-[state=active]:bg-carnest-navy data-[state=active]:text-white">Đánh giá & Vi phạm</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">   <TabOverview />    </TabsContent>
        <TabsContent value="revenue">    <TabRevenue />     </TabsContent>
        <TabsContent value="users">      <TabUsers />       </TabsContent>
        <TabsContent value="products">   <TabProducts />    </TabsContent>
        <TabsContent value="auctions">   <TabAuctions />    </TabsContent>
        <TabsContent value="moderation"> <TabModeration />  </TabsContent>
      </Tabs>
    </div>
  );
}
