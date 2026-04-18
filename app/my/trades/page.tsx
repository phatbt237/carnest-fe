"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeftRight, CheckCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { tradesApi } from "@/lib/api/trades";
import { useAuth } from "@/lib/context/auth-context";
import { formatCurrency, formatDate, formatDateTime, getErrorMessage } from "@/lib/utils";
import type { Trade } from "@/types";

const STATUS_LABELS: Record<Trade["status"], string> = {
  PENDING: "Chờ phản hồi",
  ACCEPTED: "Đã chấp nhận",
  REJECTED: "Đã từ chối",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const STATUS_VARIANT: Record<
  Trade["status"],
  "default" | "success" | "destructive" | "secondary" | "outline"
> = {
  PENDING: "default",
  ACCEPTED: "success",
  REJECTED: "destructive",
  CANCELLED: "secondary",
  EXPIRED: "outline",
};

function TradeCard({
  trade,
  isReceived,
  onAccept,
  onReject,
  onCancel,
  loading,
}: {
  trade: Trade;
  isReceived: boolean;
  onAccept?: () => void;
  onReject?: () => void;
  onCancel?: () => void;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-gray-500">
            {isReceived
              ? `Từ @${trade.offererUsername}`
              : `Đến @${trade.receiverUsername}`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatDateTime(trade.createdAt)}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[trade.status]}>
          {STATUS_LABELS[trade.status]}
        </Badge>
      </div>

      <div className="flex items-center gap-3 my-3">
        {/* Offer products */}
        <div className="flex-1 rounded-lg bg-gray-50 p-3">
          <p className="text-xs font-semibold text-gray-500 mb-1.5">Xe đề xuất</p>
          {trade.offerProducts.map((p) => (
            <p key={p.id} className="text-sm text-gray-800">
              {p.name}
            </p>
          ))}
        </div>

        <ArrowLeftRight className="h-5 w-5 text-gray-400 shrink-0" />

        {/* Target product */}
        <div className="flex-1 rounded-lg bg-carnest-blue/5 p-3">
          <p className="text-xs font-semibold text-carnest-blue mb-1.5">Xe muốn đổi</p>
          <p className="text-sm text-gray-800">{trade.targetProductName}</p>
        </div>
      </div>

      {trade.cashOffset !== 0 && (
        <div className="text-sm text-gray-600 mb-2">
          Tiền bù:{" "}
          <span
            className={
              trade.cashOffset > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"
            }
          >
            {trade.cashOffset > 0 ? "+" : ""}
            {formatCurrency(Math.abs(trade.cashOffset))}
          </span>
        </div>
      )}

      {trade.message && (
        <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg px-3 py-2 mb-3">
          "{trade.message}"
        </p>
      )}

      {trade.expiresAt && trade.status === "PENDING" && (
        <p className="text-xs text-amber-600 mb-3">
          Hết hạn: {formatDateTime(trade.expiresAt)}
        </p>
      )}

      {/* Actions */}
      {trade.status === "PENDING" && (
        <div className="flex gap-2 mt-2">
          {isReceived ? (
            <>
              <Button
                size="sm"
                onClick={onAccept}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
              >
                <CheckCircle className="h-4 w-4" />
                Chấp nhận
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReject}
                disabled={loading}
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Từ chối
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="border-gray-300 text-gray-600"
            >
              <X className="h-4 w-4 mr-1" />
              Hủy đề xuất
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default function MyTradesPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const myTradesQuery = useQuery({
    queryKey: ["my-trades"],
    queryFn: tradesApi.getMy,
    enabled: isAuthenticated,
  });

  const receivedTradesQuery = useQuery({
    queryKey: ["received-trades"],
    queryFn: tradesApi.getReceived,
    enabled: isAuthenticated,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: number) => tradesApi.accept(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["received-trades"] });
      toast.success("Đã chấp nhận đề xuất đổi xe!");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: number) => tradesApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["received-trades"] });
      toast.success("Đã từ chối đề xuất");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) => tradesApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
      toast.success("Đã hủy đề xuất");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Vui lòng đăng nhập
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <ArrowLeftRight className="h-5 w-5" />
        Đổi xe của tôi
      </h1>

      <Tabs defaultValue="received">
        <TabsList className="mb-6">
          <TabsTrigger value="received">
            Đã nhận
            {(receivedTradesQuery.data?.filter((t) => t.status === "PENDING").length ?? 0) > 0 && (
              <span className="ml-1.5 bg-carnest-blue text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {receivedTradesQuery.data?.filter((t) => t.status === "PENDING").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="sent">Đã gửi</TabsTrigger>
        </TabsList>

        <TabsContent value="received">
          {receivedTradesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : !receivedTradesQuery.data?.length ? (
            <div className="text-center py-16 text-gray-400">
              <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Chưa có đề xuất đổi xe nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {receivedTradesQuery.data.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  isReceived
                  onAccept={() => acceptMutation.mutate(trade.id)}
                  onReject={() => rejectMutation.mutate(trade.id)}
                  loading={acceptMutation.isPending || rejectMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent">
          {myTradesQuery.isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : !myTradesQuery.data?.length ? (
            <div className="text-center py-16 text-gray-400">
              <ArrowLeftRight className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>Chưa gửi đề xuất đổi xe nào</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTradesQuery.data.map((trade) => (
                <TradeCard
                  key={trade.id}
                  trade={trade}
                  isReceived={false}
                  onCancel={() => cancelMutation.mutate(trade.id)}
                  loading={cancelMutation.isPending}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
