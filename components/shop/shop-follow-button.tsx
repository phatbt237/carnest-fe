"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserPlus, UserCheck } from "lucide-react";
import { shopsApi } from "@/lib/api/shops";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage, cn } from "@/lib/utils";

interface Props {
  shopId: number;
  initialIsFollowing: boolean;
  onChange?: (isFollowing: boolean) => void;
  className?: string;
}

export function ShopFollowButton({ shopId, initialIsFollowing, onChange, className }: Props) {
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, setIsPending] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập");
      return;
    }
    if (isPending) return;

    setIsPending(true);
    try {
      if (isFollowing) {
        await shopsApi.unfollow(shopId);
      } else {
        await shopsApi.follow(shopId);
      }
      const next = !isFollowing;
      setIsFollowing(next);
      onChange?.(next);
      toast.success(next ? "Đã follow shop!" : "Đã hủy follow");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={isFollowing ? "Đang theo dõi" : "Theo dõi"}
      className={cn(
        "h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-colors shadow-sm",
        isFollowing
          ? "bg-carnest-blue text-white"
          : "bg-white border border-gray-200 text-gray-500 hover:border-carnest-blue hover:text-carnest-blue",
        className
      )}
    >
      {isFollowing ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
    </button>
  );
}
