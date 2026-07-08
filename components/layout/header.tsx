"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Car,
  Search,
  ShoppingCart,
  ShoppingBag,
  User,
  Menu,
  LogOut,
  Package,
  Wallet,
  Store,
  Gavel,
  ChevronDown,
  X,
  MessageCircle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/lib/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/lib/api/cart";
import { NotificationBell } from "@/components/notification/notification-bell";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/products", label: "Sản phẩm", icon: ShoppingBag },
  { href: "/shops", label: "Cửa hàng", icon: Store },
  { href: "/auctions", label: "Đấu giá", icon: Gavel },
  { href: "/categories/diecast", label: "Diecast", icon: Car },
];


export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/products?keyword=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    router.push("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        "bg-carnest-navy border-b border-white/5",
        scrolled && "shadow-[0_4px_24px_rgba(0,0,0,0.4)]"
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-6 h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 group"
          >
            <div className="h-8 w-8 rounded-lg bg-carnest-gold/10 border border-carnest-gold/30 flex items-center justify-center transition-all group-hover:bg-carnest-gold/20">
              <Car className="h-4.5 w-4.5 text-carnest-gold" />
            </div>
            <span className="text-[1.15rem] font-heading font-bold tracking-tight text-white">
              Car<span className="text-carnest-gold">Nest</span>
            </span>
          </Link>

          {/* Search */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-xl hidden md:flex"
          >
            <div className="relative w-full group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 group-focus-within:text-carnest-gold transition-colors pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm Hot Wheels, Tomica, Matchbox..."
                className="pl-9 pr-4 h-10 w-full rounded-lg border-white/10 bg-white/5 text-white placeholder:text-white/30 text-sm focus-visible:ring-carnest-gold/50 focus-visible:border-carnest-gold/40 transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Chat — mobile only */}
            <Link href="/chat" className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white/70 hover:text-white hover:bg-white/8 rounded-lg h-9 w-9 transition-all"
              >
                <MessageCircle className="h-[18px] w-[18px]" />
              </Button>
            </Link>

            {/* Cart */}
            <Link href="/cart">
              <Button
                variant="ghost"
                size="icon"
                className="relative text-white/70 hover:text-white hover:bg-white/8 rounded-lg h-9 w-9 transition-all"
              >
                <ShoppingCart className="h-[18px] w-[18px]" />
                {cart && cart.totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-carnest-gold text-[9px] font-bold text-carnest-navy flex items-center justify-center leading-none">
                    {cart.totalItems > 99 ? "99+" : cart.totalItems}
                  </span>
                )}
              </Button>
            </Link>

            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-white/10 mx-1" />

            {/* User menu or auth buttons */}
            {isAuthenticated ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className={cn(
                    "flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-all",
                    "text-white/80 hover:text-white hover:bg-white/8",
                    userMenuOpen && "bg-white/8 text-white"
                  )}
                >
                  <div className="h-7 w-7 rounded-full bg-carnest-gold/20 border border-carnest-gold/40 flex items-center justify-center text-xs font-semibold text-carnest-gold">
                    {user?.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <span className="text-sm font-medium max-w-[96px] truncate">
                    {user?.fullName}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-3 w-3 text-white/40 transition-transform duration-200",
                      userMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/8 bg-carnest-navy-mid shadow-2xl shadow-black/40 z-20 py-1.5 animate-fade-in overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/8">
                        <p className="text-sm font-semibold text-white truncate">
                          {user?.fullName}
                        </p>
                        <p className="text-xs text-white/40 truncate mt-0.5">
                          {user?.email}
                        </p>
                      </div>
                      {[
                        { href: "/profile", icon: User, label: "Hồ sơ" },
                        { href: "/orders", icon: Package, label: "Đơn hàng" },
                        { href: "/dashboard/offers", icon: Tag, label: "Offer giá" },
                        { href: "/wallet", icon: Wallet, label: "Ví tiền" },
                        { href: "/chat", icon: MessageCircle, label: "Tin nhắn" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-colors"
                        >
                          <item.icon className="h-3.5 w-3.5 text-white/40" />
                          {item.label}
                        </Link>
                      ))}
                      {user?.isSeller && (
                        <Link
                          href="/dashboard/shop"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/6 transition-colors"
                        >
                          <Store className="h-3.5 w-3.5 text-white/40" />
                          Quản lý shop
                        </Link>
                      )}
                      {user?.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-300/80 hover:text-red-200 hover:bg-red-500/8 transition-colors"
                        >
                          <Gavel className="h-3.5 w-3.5 text-red-400/50" />
                          Quản trị hệ thống
                        </Link>
                      )}
                      <div className="border-t border-white/8 mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          Đăng xuất
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white hover:bg-white/8 text-sm h-9"
                  >
                    Đăng nhập
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    size="sm"
                    className="bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold text-sm h-9 px-4 rounded-lg transition-all"
                  >
                    Đăng ký
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu trigger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden text-white/70 hover:text-white hover:bg-white/10 h-9 w-9 rounded-lg"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-[300px] bg-carnest-navy border-l border-white/10"
              >
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2 text-white">
                    <Car className="h-5 w-5 text-carnest-gold" />
                    <span>
                      Car<span className="text-carnest-gold">Nest</span>
                    </span>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-1">
                  <form onSubmit={handleSearch} className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30 pointer-events-none" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="pl-9 border-white/10 bg-white/10 text-white placeholder:text-white/30 focus-visible:ring-carnest-gold/40"
                      />
                    </div>
                  </form>
                  {NAV_LINKS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <item.icon className="h-4 w-4 text-white/40" />
                      {item.label}
                    </Link>
                  ))}
                  {isAuthenticated ? (
                    <>
                      <div className="border-t border-white/10 my-2" />
                      {[
                        { href: "/wallet", icon: Wallet, label: "Ví tiền" },
                        { href: "/orders", icon: Package, label: "Đơn hàng" },
                        { href: "/chat", icon: MessageCircle, label: "Tin nhắn" },
                        { href: "/dashboard/offers", icon: Tag, label: "Offer giá" },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all"
                        >
                          <item.icon className="h-4 w-4 text-white/40" />
                          {item.label}
                        </Link>
                      ))}
                      {user?.isSeller && (
                        <Link
                          href="/dashboard/shop"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-carnest-gold/80 hover:text-carnest-gold hover:bg-carnest-gold/8 transition-all"
                        >
                          <Store className="h-4 w-4" />
                          Quản lý shop
                        </Link>
                      )}
                      {user?.role === "ADMIN" && (
                        <Link
                          href="/admin"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/8 transition-all"
                        >
                          <Gavel className="h-4 w-4" />
                          Quản trị hệ thống
                        </Link>
                      )}
                      <div className="border-t border-white/10 mt-2 pt-2">
                        <button
                          onClick={() => { handleLogout(); setMobileOpen(false); }}
                          className="flex w-full items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Đăng xuất
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="pt-6 flex flex-col gap-2">
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full border border-white/20 text-white hover:bg-white/10 hover:text-white"
                        >
                          Đăng nhập
                        </Button>
                      </Link>
                      <Link href="/register" onClick={() => setMobileOpen(false)}>
                        <Button className="w-full bg-carnest-gold hover:bg-carnest-gold-dark text-carnest-navy font-semibold">
                          Đăng ký
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Bottom nav bar — desktop */}
        <nav className="hidden md:flex items-center gap-0.5 pb-2 border-t border-white/5 pt-1">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative px-3.5 py-1.5 text-[13px] font-medium text-white/55 hover:text-white rounded-md transition-all duration-200 hover:bg-white/6 group flex items-center gap-1.5"
            >
              <item.icon className="h-3.5 w-3.5 shrink-0" />
              {item.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-carnest-gold group-hover:w-4 transition-all duration-200" />
            </Link>
          ))}
          {isAuthenticated && (
            <>
              <div className="w-px h-3.5 bg-white/15 mx-1.5" />
              <Link href="/wallet" className="relative px-3 py-1.5 text-[13px] font-medium text-white/45 hover:text-white rounded-md transition-all duration-200 hover:bg-white/6 flex items-center gap-1.5 group">
                <Wallet className="h-3.5 w-3.5" />
                Ví tiền
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-carnest-gold group-hover:w-4 transition-all duration-200" />
              </Link>
              <Link href="/orders" className="relative px-3 py-1.5 text-[13px] font-medium text-white/45 hover:text-white rounded-md transition-all duration-200 hover:bg-white/6 flex items-center gap-1.5 group">
                <Package className="h-3.5 w-3.5" />
                Đơn hàng
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-carnest-gold group-hover:w-4 transition-all duration-200" />
              </Link>
              <Link href="/chat" className="relative px-3 py-1.5 text-[13px] font-medium text-white/45 hover:text-white rounded-md transition-all duration-200 hover:bg-white/6 flex items-center gap-1.5 group">
                <MessageCircle className="h-3.5 w-3.5" />
                Tin nhắn
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-carnest-gold group-hover:w-4 transition-all duration-200" />
              </Link>
              {user?.isSeller && (
                <Link href="/dashboard/shop" className="relative px-3 py-1.5 text-[13px] font-medium text-carnest-gold/70 hover:text-carnest-gold rounded-md transition-all duration-200 hover:bg-carnest-gold/8 flex items-center gap-1.5 group">
                  <Store className="h-3.5 w-3.5" />
                  Quản lý shop
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-carnest-gold group-hover:w-4 transition-all duration-200" />
                </Link>
              )}
              {user?.role === "ADMIN" && (
                <Link href="/admin" className="relative px-3 py-1.5 text-[13px] font-medium text-red-400/80 hover:text-red-300 rounded-md transition-all duration-200 hover:bg-red-500/8 flex items-center gap-1.5 group">
                  <Gavel className="h-3.5 w-3.5" />
                  Admin
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] rounded-full bg-red-400 group-hover:w-4 transition-all duration-200" />
                </Link>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
