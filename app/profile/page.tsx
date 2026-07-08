"use client";

import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { User, Store, ShoppingBag, Tag, Award, Heart, Search, ArrowLeftRight, MapPin } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hồ sơ của tôi</h1>

      {/* User card */}
      <div className="rounded-2xl bg-gradient-to-br from-carnest-blue to-carnest-blue-light p-6 text-white mb-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user.fullName?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.fullName}</h2>
            <p className="text-white/70 text-sm">@{user.username}</p>
            <div className="flex gap-2 mt-2">
              {user.role === "ADMIN" && (
                <Badge className="bg-yellow-500 text-yellow-900 border-0">Admin</Badge>
              )}
              {user.isSeller && (
                <Badge className="bg-green-500 text-white border-0">Seller</Badge>
              )}
              {user.isVerified && (
                <Badge className="bg-blue-300 text-blue-900 border-0">Đã xác minh</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
          <ShoppingBag className="h-8 w-8 text-carnest-blue opacity-80" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{user.totalBought}</p>
            <p className="text-xs text-gray-500">Đã mua</p>
          </div>
        </div>
        <div className="rounded-xl border bg-white p-4 flex items-center gap-3">
          <Tag className="h-8 w-8 text-carnest-orange opacity-80" />
          <div>
            <p className="text-2xl font-bold text-gray-900">{user.totalSold}</p>
            <p className="text-xs text-gray-500">Đã bán</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border bg-white p-5 space-y-4 mb-4">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <User className="h-4 w-4" />
          Thông tin cá nhân
        </h2>
        <Separator />
        {[
          { label: "Họ và tên", value: user.fullName },
          { label: "Username", value: `@${user.username}` },
          { label: "Email", value: user.email },
          { label: "Số điện thoại", value: user.phone },
        ].map((item) => (
          <div key={item.label} className="flex justify-between text-sm">
            <span className="text-gray-500">{item.label}</span>
            <span className="font-medium text-gray-900">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Shop link */}
      {user.isSeller && (
        <div className="rounded-xl border bg-white p-5 mb-4">
          <Link
            href="/dashboard/shop"
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-carnest-blue" />
              <div>
                <p className="font-medium text-gray-900">Quản lý Shop</p>
                <p className="text-xs text-gray-500">
                  Xem đơn hàng, sản phẩm, thống kê
                </p>
              </div>
            </div>
            <span className="text-carnest-blue text-sm">→</span>
          </Link>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { href: "/my/showcases", icon: Heart, label: "Bộ sưu tập" },
          { href: "/my/wantlist", icon: Search, label: "Tìm kiếm xe" },
          { href: "/my/trades", icon: ArrowLeftRight, label: "Đổi xe" },
          { href: `/users/${user.username}`, icon: Award, label: "Huy hiệu" },
          { href: "/profile/addresses", icon: MapPin, label: "Địa chỉ" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl border bg-white p-4 flex flex-col items-center gap-2 hover:shadow-sm transition-shadow text-center"
          >
            <item.icon className="h-6 w-6 text-carnest-blue" />
            <span className="text-xs font-medium text-gray-700">{item.label}</span>
          </Link>
        ))}
      </div>

      {!user.isSeller && (
        <div className="rounded-xl border border-carnest-orange/30 bg-orange-50 p-5 mb-4">
          <p className="font-semibold text-gray-900 mb-1">Trở thành người bán</p>
          <p className="text-sm text-gray-600 mb-3">
            Tạo shop để bắt đầu bán xe mô hình trên CarNest
          </p>
          <Link href="/dashboard/shop">
            <Button size="sm" className="bg-carnest-orange hover:bg-carnest-orange-dark text-white">
              Tạo shop ngay
            </Button>
          </Link>
        </div>
      )}

      <Button
        variant="outline"
        className="w-full border-red-300 text-red-600 hover:bg-red-50"
        onClick={logout}
      >
        Đăng xuất
      </Button>
    </div>
  );
}
