"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Flag, CheckCircle, Eye, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { reportsApi } from "@/lib/api/reports";
import { useAuth } from "@/lib/context/auth-context";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { REPORT_REASON_LABELS, type Report } from "@/types";
import Link from "next/link";

const TARGET_URLS: Record<string, (id: number) => string> = {
  PRODUCT: (id) => `/products/${id}`,
  USER: (id) => `/users/${id}`,
  REVIEW: (id) => `/reviews/${id}`,
  MESSAGE: (id) => `/chat`,
};

function ResolveModal({
  report,
  open,
  onClose,
}: {
  report: Report;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [resolution, setResolution] = useState("");

  const mutation = useMutation({
    mutationFn: () => reportsApi.resolve(report.id, resolution),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Đã xử lý báo cáo");
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xử lý báo cáo #{report.id}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Loại:</span>
              <span className="font-medium">{report.targetType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ID đối tượng:</span>
              <span className="font-medium">{report.targetId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Lý do:</span>
              <span className="font-medium">{REPORT_REASON_LABELS[report.reason]}</span>
            </div>
            <div>
              <span className="text-gray-500">Mô tả:</span>
              <p className="mt-1 text-gray-700">{report.description}</p>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Báo cáo bởi:</span>
              <span className="font-medium">@{report.reporterUsername}</span>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Quyết định xử lý</Label>
            <Textarea
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Mô tả hành động đã thực hiện..."
              rows={3}
              className="resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!resolution || mutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {mutation.isPending ? "Đang xử lý..." : "Xác nhận xử lý"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportRow({
  report,
  onResolve,
}: {
  report: Report;
  onResolve: (r: Report) => void;
}) {
  const queryClient = useQueryClient();
  const targetUrl = TARGET_URLS[report.targetType]?.(report.targetId);

  const dismissMutation = useMutation({
    mutationFn: () => reportsApi.dismiss(report.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Đã bỏ qua báo cáo");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={report.status === "PENDING" ? "default" : "secondary"}>
              {report.status === "PENDING" ? "Chờ xử lý" : report.status === "RESOLVED" ? "Đã xử lý" : "Bỏ qua"}
            </Badge>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
              {report.targetType}
            </span>
            <span className="text-xs font-medium text-gray-700">
              {REPORT_REASON_LABELS[report.reason]}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">{report.description}</p>
          <div className="flex gap-3 mt-2 text-xs text-gray-400">
            <span>Báo cáo bởi @{report.reporterUsername}</span>
            <span>{formatDateTime(report.createdAt)}</span>
          </div>
          {report.resolution && (
            <div className="mt-2 text-xs text-green-700 bg-green-50 rounded px-3 py-1.5">
              Xử lý: {report.resolution}
            </div>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          {targetUrl && (
            <Button size="sm" variant="ghost" asChild className="h-8 gap-1 text-xs">
              <Link href={targetUrl} target="_blank">
                <Eye className="h-3.5 w-3.5" />
                Xem
              </Link>
            </Button>
          )}
          {report.status === "PENDING" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => dismissMutation.mutate()}
              disabled={dismissMutation.isPending}
              className="h-8 gap-1 text-xs text-gray-500 hover:text-red-500 hover:border-red-300"
            >
              <XCircle className="h-3.5 w-3.5" />
              Bỏ qua
            </Button>
          )}
          {report.status === "PENDING" && (
            <Button
              size="sm"
              onClick={() => onResolve(report)}
              className="h-8 gap-1 text-xs bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              Xử lý
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("PENDING");

  const { data: reports, isLoading } = useQuery({
    queryKey: ["admin-reports", statusFilter],
    queryFn: () => reportsApi.getAll(statusFilter || undefined),
    enabled: user?.role === "ADMIN",
  });

  if (user?.role !== "ADMIN") {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Không có quyền truy cập
      </div>
    );
  }

  const pendingCount = reports?.filter((r) => r.status === "PENDING").length ?? 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Flag className="h-5 w-5 text-red-500" />
          Quản lý báo cáo
          {pendingCount > 0 && (
            <span className="bg-red-100 text-red-700 text-sm px-2 py-0.5 rounded-full">
              {pendingCount} chờ xử lý
            </span>
          )}
        </h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PENDING">Chờ xử lý</SelectItem>
            <SelectItem value="RESOLVED">Đã xử lý</SelectItem>
            <SelectItem value="DISMISSED">Đã bỏ qua</SelectItem>
            <SelectItem value="">Tất cả</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : !reports?.length ? (
        <div className="text-center py-16 text-gray-400">
          <Flag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Không có báo cáo nào</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((report) => (
            <ReportRow
              key={report.id}
              report={report}
              onResolve={setSelectedReport}
            />
          ))}
        </div>
      )}

      {selectedReport && (
        <ResolveModal
          report={selectedReport}
          open={!!selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}
    </div>
  );
}
