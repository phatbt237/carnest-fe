"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MessageCircle, ImagePlus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { chatApi } from "@/lib/api/chat";
import { uploadApi } from "@/lib/api/upload";
import { wantlistApi } from "@/lib/api/wantlist";
import { getErrorMessage } from "@/lib/utils";
import type { ChatTagType } from "@/types";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Direct chat: send to this user's id (tagType/tagId attach PRODUCT/ORDER/WANT_LIST context) */
  receiverId?: number;
  tagType?: ChatTagType;
  tagId?: number;
  /** Human-readable title shown alongside the tag badge, e.g. product name, order code, wantlist title */
  tagTitle?: string;
  /** Wantlist contact: tags the message as WANT_LIST when receiverId is known; falls back to the wantlist's own contact endpoint otherwise */
  wantlistId?: number;
  /** Used to prefill the chat redirect after a successful wantlist contact */
  username?: string;
}

export function ContactDialog({ open, onOpenChange, receiverId, tagType, tagId, tagTitle, wantlistId, username }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const imageUrls = images.length
        ? await uploadApi.uploadImages(images.map((i) => i.file), "chat")
        : [];
      if (wantlistId && receiverId) {
        return chatApi.send(receiverId, message.trim(), imageUrls.length ? "IMAGE" : "TEXT", {
          tagType: "WANT_LIST",
          tagId: wantlistId,
          tagTitle,
          imageUrls,
        });
      }
      if (wantlistId) {
        return wantlistApi.contact(wantlistId, message.trim(), imageUrls);
      }
      return chatApi.send(receiverId!, message.trim(), imageUrls.length ? "IMAGE" : "TEXT", {
        tagType,
        tagId,
        tagTitle,
        imageUrls,
      });
    },
    onSuccess: () => {
      toast.success("Đã gửi tin nhắn!");
      images.forEach((i) => URL.revokeObjectURL(i.preview));
      setMessage("");
      setImages([]);
      onOpenChange(false);
      if (receiverId) {
        router.push(
          `/chat?receiverId=${receiverId}${username ? `&username=${encodeURIComponent(username)}` : ""}`
        );
      } else {
        router.push("/chat");
      }
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 text-lg">
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              <MessageCircle className="h-4 w-4 text-gray-700" />
            </div>
            Nhắn tin
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Nhập lời nhắn..."
            className="w-full px-3 py-2.5 text-sm text-gray-800 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-none placeholder:text-gray-300"
          />

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={img.preview} className="relative h-16 w-16 rounded-lg overflow-hidden border shrink-0">
                  <Image src={img.preview} alt="Preview" fill className="object-cover" sizes="64px" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFiles}
          />

          <div className="flex gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 text-gray-500 hover:text-carnest-blue hover:border-carnest-blue"
              onClick={() => fileInputRef.current?.click()}
              disabled={mutation.isPending}
            >
              <ImagePlus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-10 text-gray-600 border-gray-200"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={(!message.trim() && images.length === 0) || mutation.isPending}
              className="flex-1 h-10 bg-carnest-blue hover:bg-carnest-blue-dark text-white font-semibold gap-1.5"
            >
              {mutation.isPending ? "Đang gửi..." : "Gửi"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
