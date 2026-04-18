"use client";

import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  if (!referenceType || !referenceId) return "#";
  switch (referenceType) {
    case "ORDER": return `/orders/${referenceId}`;
    case "AUCTION": return `/auctions/${referenceId}`;
    case "PRODUCT": return `/products/${referenceId}`;
    case "TRADE": return `/my/trades`;
    case "OFFER": return `/dashboard/offers`;
    default: return "#";
  }
}

export default function NotificationsPage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setUnreadCount } = useNotificationStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery({
      queryKey: ["notifications"],
      queryFn: ({ pageParam }) =>
        notificationsApi.getAll(pageParam as string | undefined, 20),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
      enabled: isAuthenticated,
    });

  const notifications = data?.pages.flatMap((p) => p.items) ?? [];

  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      setUnreadCount(0);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-preview"] });
      toast.success("Đã đánh dấu tất cả đã đọc");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Vui lòng đăng nhập để xem thông báo
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Thông báo
        </h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllMutation.mutate()}
          disabled={markAllMutation.isPending}
          className="gap-1.5 text-sm"
        >
          <CheckCheck className="h-4 w-4" />
          Đọc tất cả
        </Button>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>Không có thông báo nào</p>
          </div>
        ) : (
          <>
            {notifications.map((notif, idx) => (
              <button
                key={notif.id}
                onClick={() => {
                  const url = resolveNotifUrl(notif);
                  if (url !== "#") router.push(url);
                }}
                className={cn(
                  "w-full text-left px-5 py-4 flex items-start gap-3 hover:bg-gray-50 transition-colors",
                  idx < notifications.length - 1 && "border-b border-gray-100",
                  !notif.isRead && "bg-carnest-gold/5"
                )}
              >
                {!notif.isRead && (
                  <span className="mt-2 h-2 w-2 rounded-full bg-carnest-gold shrink-0" />
                )}
                <div className={cn("flex-1 min-w-0", notif.isRead && "pl-4")}>
                  <p className="text-sm font-semibold text-gray-900">{notif.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                    {notif.content}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(notif.createdAt)}
                  </p>
                </div>
              </button>
            ))}
            {hasNextPage && (
              <div className="p-4 border-t border-gray-100 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
