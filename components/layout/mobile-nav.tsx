"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Gavel, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { useQuery } from "@tanstack/react-query";
import { cartApi } from "@/lib/api/cart";

const navItems = [
  { href: "/", icon: Home, label: "Trang chủ" },
  { href: "/products", icon: Search, label: "Tìm kiếm" },
  { href: "/auctions", icon: Gavel, label: "Đấu giá" },
  { href: "/cart", icon: ShoppingCart, label: "Giỏ hàng" },
  { href: "/profile", icon: User, label: "Tôi" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const { data: cart } = useQuery({
    queryKey: ["cart"],
    queryFn: cartApi.get,
    enabled: isAuthenticated,
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-white shadow-2xl">
      <div className="flex items-center justify-around py-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[56px]",
                isActive ? "text-carnest-blue" : "text-gray-400"
              )}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {item.href === "/cart" &&
                  cart &&
                  cart.totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-carnest-orange text-[9px] font-bold text-white flex items-center justify-center">
                      {cart.totalItems > 9 ? "9+" : cart.totalItems}
                    </span>
                  )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
