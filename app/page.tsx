import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { shopsApi } from "@/lib/api/shops";
import { auctionsApi } from "@/lib/api/auctions";
import { NewProductsSection } from "@/components/home/new-products-section";
import { AuctionCard } from "@/components/auction/auction-card";
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
} from "lucide-react";
import Image from "next/image";

export const metadata: Metadata = {
  title: "CarNest — Marketplace Xe Mô Hình Diecast",
  description:
    "Mua bán xe mô hình diecast uy tín. Hot Wheels, Tomica, Matchbox, Majorette. Đấu giá hàng hiếm, giá tốt nhất.",
};

export const revalidate = 300;


async function ActiveAuctionsSection() {
  try {
    const data = await auctionsApi.list({ filter: "active", size: 4 });
    if (!data.items.length) return null;
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {data.items.map((auction) => (
              <AuctionCard key={auction.id} auction={auction} />
            ))}
          </div>
        </div>
      </section>
    );
  } catch {
    return null;
  }
}

async function FeaturedShops() {
  try {
    const data = await shopsApi.list({ sortBy: "rating", size: 4 });
    if (!data.items.length) return null;
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {data.items.map((shop) => (
          <Link
            key={shop.id}
            href={`/shops/${shop.slug}`}
            className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 text-center"
          >
            <div className="h-14 w-14 rounded-full overflow-hidden bg-gray-100 border-2 border-transparent group-hover:border-carnest-gold/40 transition-all relative">
              {shop.logoUrl ? (
                <Image
                  src={shop.logoUrl}
                  alt={shop.shopName}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xl font-bold text-carnest-navy font-heading">
                  {shop.shopName.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-900 group-hover:text-carnest-gold transition-colors font-heading">
                {shop.shopName}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                ⭐ {shop.rating?.toFixed(1) || "Mới"} · {shop.followerCount} followers
              </p>
            </div>
          </Link>
        ))}
      </div>
    );
  } catch {
    return null;
  }
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
                  className="border-white/20 text-white hover:bg-white/8 hover:border-white/35 rounded-xl px-6 transition-all duration-200"
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

      {/* ── Featured Shops ───────────────────────────────────── */}
      <section className="py-16 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 md:px-6">
          <SectionHeader
            label="Nổi bật"
            title="Shop hàng đầu"
            subtitle="Những shop được đánh giá cao nhất"
            href="/shops"
            linkLabel="Tất cả shop"
            icon={<Store className="h-4 w-4 text-carnest-gold" />}
          />
          <Suspense fallback={null}>
            <FeaturedShops />
          </Suspense>
        </div>
      </section>

      <Footer />
    </div>
  );
}
