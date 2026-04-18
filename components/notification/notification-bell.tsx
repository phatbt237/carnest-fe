"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { notificationsApi } from "@/lib/api/notifications";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { useAuth } from "@/lib/context/auth-context";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types";

function resolveNotifUrl(notif: Notification): string {
  const { referenceType, referenceId } = notif;
  if (!referenceType || !referenceId) return "/notifications";
  switch (referenceType) {
    case "ORDER": return `/orders/${referenceId}`;
    case "AUCTION": return `/auctions/${referenceId}`;
    case "PRODUCT": return `/products/${referenceId}`;
    case "TRADE": return `/my/trades`;
    case "OFFER": return `/dashboard/offers`;
    default: return "/notifications";
  }
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { unreadCount, setUnreadCount } = useNotificationStore();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications-preview"],
    queryFn: () => notificationsApi.getAll(undefined, 8),
    enabled: isAuthenticated && open,
    staleTime: 30000,
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Đã đánh dấu tất cả đã đọc");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!isAuthenticated) return null;

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative text-white/70 hover:text-white hover:bg-white/8 rounded-lg h-9 w-9 transition-all"
      >
        <Bell className="h-[18px] w-[18px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-white/8 bg-carnest-navy-mid shadow-2xl shadow-black/40 z-20 overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <span className="text-sm font-semibold text-white">Thông báo</span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="flex items-center gap-1 text-xs text-carnest-gold hover:text-carnest-gold/80 transition-colors"
                >
                  <CheckCheck className="h-3 w-3" />
                  Đọc tất cả
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[360px] overflow-y-auto">
              {isLoading ? (
                <div className="p-3 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0 bg-white/10" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-full bg-white/10" />
                        <Skeleton className="h-3 w-2/3 bg-white/10" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !data?.items.length ? (
                <div className="py-10 text-center text-white/40 text-sm">
                  Không có thông báo
                </div>
              ) : (
                data.items.map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(resolveNotifUrl(notif));
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors",
                      !notif.isRead && "bg-carnest-gold/5"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {!notif.isRead && (
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-carnest-gold shrink-0" />
                      )}
                      <div className={cn("flex-1", notif.isRead && "pl-3.5")}>
                        <p className="text-xs font-semibold text-white line-clamp-1">
                          {notif.title}
                        </p>
                        <p className="text-xs text-white/50 line-clamp-2 mt-0.5">
                          {notif.content}
                        </p>
                        <p className="text-[10px] text-white/30 mt-1">
                          {formatDateTime(notif.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/8 p-2">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="block w-full text-center text-xs text-carnest-gold hover:text-carnest-gold/80 py-2 transition-colors"
              >
                Xem tất cả thông báo
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
