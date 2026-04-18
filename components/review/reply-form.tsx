"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { reviewsApi } from "@/lib/api/reviews";
import { getErrorMessage } from "@/lib/utils";

interface ReplyFormProps {
  reviewId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReplyForm({ reviewId, onSuccess, onCancel }: ReplyFormProps) {
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");

  const mutation = useMutation({
    mutationFn: () => reviewsApi.reply(reviewId, reply),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Đã gửi phản hồi!");
      onSuccess?.();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  return (
    <div className="space-y-2 mt-2">
      <Textarea
        value={reply}
        onChange={(e) => setReply(e.target.value)}
        placeholder="Nhập phản hồi của bạn..."
        className="resize-none text-sm"
        rows={2}
      />
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={!reply.trim() || mutation.isPending}
          className="bg-carnest-blue hover:bg-carnest-blue-dark text-white"
        >
          {mutation.isPending ? "Đang gửi..." : "Gửi phản hồi"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Hủy
        </Button>
      </div>
    </div>
  );
}
