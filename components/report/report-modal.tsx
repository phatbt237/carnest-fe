"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reportsApi } from "@/lib/api/reports";
import { useAuth } from "@/lib/context/auth-context";
import { getErrorMessage } from "@/lib/utils";
import {
  REPORT_REASON_LABELS,
  type ReportReason,
  type ReportTargetType,
} from "@/types";

interface ReportModalProps {
  targetType: ReportTargetType;
  targetId: number;
  trigger?: React.ReactNode;
}

export function ReportModal({ targetType, targetId, trigger }: ReportModalProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason | "">("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      reportsApi.create({
        targetType,
        targetId,
        reason: reason as ReportReason,
        description,
      }),
    onSuccess: () => {
      toast.success("Báo cáo đã được gửi. Chúng tôi sẽ xem xét trong thời gian sớm nhất.");
      setOpen(false);
      setReason("");
      setDescription("");
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleOpen = (v: boolean) => {
    if (v && !isAuthenticated) {
      toast.error("Vui lòng đăng nhập để báo cáo");
      return;
    }
    setOpen(v);
  };

  const TARGET_LABELS: Record<ReportTargetType, string> = {
    USER: "người dùng",
    PRODUCT: "sản phẩm",
    REVIEW: "đánh giá",
    MESSAGE: "tin nhắn",
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-red-500 gap-1.5"
          >
            <Flag className="h-4 w-4" />
            Báo cáo
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Báo cáo {TARGET_LABELS[targetType]}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Lý do báo cáo</Label>
            <Select
              value={reason}
              onValueChange={(v) => setReason(v as ReportReason)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn lý do..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REPORT_REASON_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Mô tả chi tiết</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả chi tiết vấn đề bạn gặp phải..."
              className="resize-none"
              rows={4}
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!reason || mutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {mutation.isPending ? "Đang gửi..." : "Gửi báo cáo"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
