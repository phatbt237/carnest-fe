import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { auctionsApi } from "@/lib/api/auctions";
import { showcasesApi } from "@/lib/api/showcases";
import { wantlistApi } from "@/lib/api/wantlist";
import { NewProductsSection } from "@/components/home/new-products-section";
import { WantlistContactButton } from "@/components/home/wantlist-contact-button";
import { WantlistImageThumb } from "@/components/home/wantlist-image-thumb";
import { AuctionCard } from "@/components/auction/auction-card";
import { FeaturedShopsSection } from "@/components/home/featured-shops-section";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";
import {
  ArrowRight,
  Gavel,
  Store,
  Package,
  Shield,
  Zap,
  ChevronRight,
  Heart,
  Eye,
  LayoutGrid,
  Search,
  Tag,
  User,
  PlusCircle,
  Ruler,
  MessageCircle,
} from "lucide-react";
import { formatCompact, formatCurrency, formatRelativeDate } from "@/lib/utils";
import Image from "next/image";

export const metadata: Metadata = {
  title: "CarNest — Marketplace Xe Mô Hình Diecast",
  description:
    "Mua bán xe mô hình diecast uy tín. Hot Wheels, Tomica, Matchbox, Majorette. Đấu giá hàng hiếm, giá tốt nhất.",
};

export const revalidate = 300;


async function ActiveAuctionsSection() {
  let items: Awaited<ReturnType<typeof auctionsApi.list>>["items"] = [];
  try {
    const data = await auctionsApi.list({ filter: "active", size: 4 });
    items = data.items;
  } catch {}
  return (
    <section className="py-16">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader
          label="Đấu giá trực tiếp"
          title="Đang diễn ra"
          subtitle="Đặt bid ngay để sở hữu hàng hiếm"
          href="/auctions"
          linkLabel="Xem tất cả"
          icon={<Gavel className="h-4 w-4 text-carnest-gold" />}
        />
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {items.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
            <div className="h-14 w-14 rounded-2xl bg-carnest-gold/8 border border-carnest-gold/15 flex items-center justify-center mb-4">
              <Gavel className="h-7 w-7 text-carnest-gold/50" />
            </div>
            <p className="font-semibold text-gray-500 font-heading text-sm">Chưa có phiên đấu giá nào đang diễn ra</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">Quay lại sau để không bỏ lỡ hàng hiếm</p>
            <Link href="/auctions">
              <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs">
                Xem tất cả đấu giá <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

async function ShowcasesSection() {
  try {
    const data = await showcasesApi.list({ sortBy: "newest", size: 12 });
    if (!data.items.length) return null;
    return (
      <section className="py-16 bg-carnest-surface border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Cộng đồng"
            title="Bộ sưu tập nổi bật"
            subtitle="Khám phá bộ sưu tập của các collector khác"
            href="/showcases"
            linkLabel="Xem tất cả"
            icon={<LayoutGrid className="h-4 w-4 text-carnest-gold" />}
          />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data.items.map((showcase) => (
              <Link
                key={showcase.id}
                href={`/showcases/${showcase.id}`}
                className="group rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Cover image */}
                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                  {showcase.coverImageUrl ? (
                    <Image
                      src={showcase.coverImageUrl}
                      alt={showcase.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-carnest-navy/8 to-carnest-gold/8">
                      <LayoutGrid className="h-10 w-10 text-carnest-gold/30" />
                    </div>
                  )}
                  {/* Item count badge */}
                  <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold rounded-full px-2 py-0.5">
                    {showcase.itemCount} xe
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-carnest-gold transition-colors font-heading">
                    {showcase.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    @{showcase.ownerUsername}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatCompact(showcase.likeCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatCompact(showcase.viewCount)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Mobile "view all" */}
          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/showcases">
              <Button variant="outline" size="sm" className="gap-1 rounded-xl">
                Xem tất cả bộ sưu tập <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

async function WantListSection() {
  let items: Awaited<ReturnType<typeof wantlistApi.getPublic>>["items"] = [];
  try {
    const data = await wantlistApi.getPublic(undefined, 6);
    items = data.items;
  } catch {}
  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 md:px-6">
        <SectionHeader
          label="Cộng đồng"
          title="Đang tìm kiếm"
          subtitle="Các collector đang cần tìm — bạn có thể là người giúp họ"
          href="/wantlist"
          linkLabel="Xem tất cả"
          icon={<Search className="h-4 w-4 text-carnest-gold" />}
        />

        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 bg-carnest-surface hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-carnest-gold transition-colors font-heading leading-snug line-clamp-2 flex-1">
                    {item.title}
                  </p>
                  <span className="shrink-0 text-[11px] text-gray-400 whitespace-nowrap">
                    {formatRelativeDate(item.createdAt)}
                  </span>
                </div>

                {/* Tags row */}
                <div className="flex flex-wrap gap-1.5">
                  {item.carBrand && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-carnest-navy/6 px-2 py-0.5 text-[11px] font-medium text-carnest-navy">
                      {item.carBrand}
                    </span>
                  )}
                  {item.carModel && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                      {item.carModel}
                    </span>
                  )}
                  {item.scale && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600">
                      <Ruler className="h-2.5 w-2.5" />
                      {item.scale}
                    </span>
                  )}
                </div>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                )}

                {/* Image + username/budget */}
                <div className="flex gap-5">
                  {item.imageUrl && (
                    <WantlistImageThumb
                      src={item.imageUrl}
                      alt={item.title}
                      className="aspect-[3/2] w-24 rounded-lg border border-gray-200 bg-white"
                      sizes="96px"
                    />
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 min-w-0">
                      <User className="h-3 w-3 shrink-0" />
                      <span className="font-medium text-gray-600 truncate">@{item.username}</span>
                    </div>
                    {item.maxPrice ? (
                      <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 min-w-0">
                        <Tag className="h-3 w-3 shrink-0" />
                        <span className="truncate">Tối đa {formatCurrency(item.maxPrice)}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Giá thương lượng</span>
                    )}
                  </div>
                </div>

                {/* Footer row */}
                <div className="mt-auto pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <MessageCircle className="h-3 w-3" />
                      {item.contactCount} lượt liên hệ
                    </span>
                    <WantlistContactButton wantlistId={item.id} userId={item.userId} username={item.username} title={item.title} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50">
            <div className="h-14 w-14 rounded-2xl bg-carnest-gold/8 border border-carnest-gold/15 flex items-center justify-center mb-4">
              <Search className="h-7 w-7 text-carnest-gold/50" />
            </div>
            <p className="font-semibold text-gray-500 font-heading text-sm">Chưa có ai đăng nhu cầu tìm xe</p>
            <p className="text-xs text-gray-400 mt-1 mb-5">Hãy là người đầu tiên — đăng nhu cầu để seller tìm cho bạn</p>
            <Link href="/wantlist/new">
              <Button size="sm" className="gap-1.5 rounded-xl text-xs bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold">
                <PlusCircle className="h-3.5 w-3.5" />
                Đăng nhu cầu ngay
              </Button>
            </Link>
          </div>
        )}

        {/* CTA strip */}
        <div className="mt-10 rounded-2xl bg-gradient-to-r from-carnest-navy to-carnest-navy/90 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-white font-heading text-base">
              Bạn đang tìm một mẫu xe cụ thể?
            </p>
            <p className="text-white/55 text-sm mt-0.5">
              Đăng nhu cầu — các seller sẽ liên hệ khi có hàng
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/wantlist">
              <Button
                variant="outline"
                size="sm"
                className="border-white/25 text-carnest-navy hover:bg-white/10 hover:border-white/40 rounded-xl"
              >
                Xem tất cả
              </Button>
            </Link>
            <Link href="/wantlist/new">
              <Button
                size="sm"
                className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold rounded-xl gap-1.5 shadow-[0_0_16px_rgba(201,168,76,0.3)]"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Đăng nhu cầu
              </Button>
            </Link>
          </div>
        </div>

        {/* Mobile "view all" */}
        <div className="mt-6 flex justify-center md:hidden">
          <Link href="/wantlist">
            <Button variant="outline" size="sm" className="gap-1 rounded-xl">
              Xem tất cả nhu cầu <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Reusable section header
function SectionHeader({
  label,
  title,
  subtitle,
  href,
  linkLabel,
  icon,
}: {
  label: string;
  title: string;
  subtitle?: string;
  href: string;
  linkLabel: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-8">
      <div>
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <span className="text-[11px] font-semibold uppercase tracking-widest text-carnest-gold">
            {label}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-heading leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <Link href={href}>
        <button className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-carnest-gold transition-colors group">
          {linkLabel}
          <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </Link>
    </div>
  );
}

const FEATURES = [
  {
    icon: Shield,
    title: "An toàn & Uy tín",
    desc: "Người bán được xác minh, giao dịch được bảo vệ",
  },
  {
    icon: Gavel,
    title: "Đấu giá Realtime",
    desc: "Tìm hàng hiếm qua đấu giá trực tiếp, chống snipe",
  },
  {
    icon: Zap,
    title: "Thanh toán nhanh",
    desc: "Ví nội bộ, VNPAY, MoMo — trả ngay trong vài giây",
  },
  {
    icon: Package,
    title: "Đa dạng scale",
    desc: "1:64, 1:43, 1:24, 1:18 — đủ mọi loại xe mô hình",
  },
];

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-carnest-surface">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-carnest-navy overflow-hidden">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-carnest-gold/6 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-blue-600/8 blur-[80px] pointer-events-none" />


        <div className="relative container mx-auto px-4 md:px-6 py-20 md:py-28">
          <div className="max-w-2xl animate-slide-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-carnest-gold/30 bg-carnest-gold/10 px-3.5 py-1.5 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-carnest-gold animate-pulse" />
              <span className="text-xs font-semibold text-carnest-gold tracking-wide">
                Marketplace #1 xe mô hình Việt Nam
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-heading text-white leading-[1.1] tracking-tight mb-5">
              Thiên đường{" "}
              <span className="relative">
                <span className="text-carnest-gold">xe mô hình</span>
                <span className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-carnest-gold/60 to-transparent" />
              </span>
              <br />
              dành cho collector
            </h1>

            <p className="text-white/55 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
              Mua bán, đấu giá xe diecast Hot Wheels, Tomica, Matchbox và hàng
              ngàn mẫu xe hiếm từ các seller uy tín trên toàn quốc.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button
                  size="lg"
                  className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold rounded-xl px-6 transition-all duration-200 shadow-[0_0_24px_rgba(201,168,76,0.25)] hover:shadow-[0_0_32px_rgba(201,168,76,0.35)]"
                >
                  Khám phá ngay
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/auctions">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-carnest-navy font-semibold hover:bg-white/8 hover:border-white/35 rounded-xl px-6 transition-all duration-200"
                >
                  <Gavel className="mr-1.5 h-4 w-4" />
                  Xem đấu giá
                </Button>
              </Link>
            </div>

            {/* Stats strip */}
            <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-white/8">
              {[
                { value: "10,000+", label: "Sản phẩm" },
                { value: "500+", label: "Sellers uy tín" },
                { value: "50,000+", label: "Khách hàng" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-xl font-bold text-white font-heading">
                    {stat.value}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Features strip ───────────────────────────────────── */}
      <section className="border-b border-gray-100 bg-white">
        <div className="container mx-auto px-4 md:px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3 group">
                <div className="h-10 w-10 rounded-xl bg-carnest-gold/8 border border-carnest-gold/15 flex items-center justify-center shrink-0 transition-all group-hover:bg-carnest-gold/14">
                  <f.icon className="h-5 w-5 text-carnest-gold" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900 font-heading">
                    {f.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community Showcases ──────────────────────────────── */}
      <Suspense fallback={null}>
        <ShowcasesSection />
      </Suspense>

      {/* ── Active Auctions ───────────────────────────────────── */}
      <div className="bg-white">
        <Suspense fallback={null}>
          <ActiveAuctionsSection />
        </Suspense>
      </div>

      {/* ── New Products ─────────────────────────────────────── */}
      <section className="py-16 bg-carnest-surface">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Mới nhất"
            title="Sản phẩm mới"
            subtitle="Cập nhật liên tục từ các seller trên toàn quốc"
            href="/products"
            linkLabel="Xem tất cả"
          />
          <NewProductsSection />

          {/* Mobile "view all" */}
          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/products">
              <Button variant="outline" size="sm" className="gap-1 rounded-xl">
                Xem tất cả sản phẩm <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Want List ────────────────────────────────────────── */}
      <Suspense fallback={null}>
        <WantListSection />
      </Suspense>

      {/* ── Featured Shops ───────────────────────────────────── */}
      <section className="py-16 bg-carnest-surface border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Nổi bật"
            title="Shop hàng đầu"
            subtitle="Những shop được đánh giá cao nhất"
            href="/shops"
            linkLabel="Tất cả shop"
            icon={<Store className="h-4 w-4 text-carnest-gold" />}
          />
          <FeaturedShopsSection />

          {/* Mobile "view all" */}
          <div className="mt-8 flex justify-center md:hidden">
            <Link href="/shops">
              <Button variant="outline" size="sm" className="gap-1 rounded-xl">
                Xem tất cả shop <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
