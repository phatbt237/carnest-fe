"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/context/auth-context";
import { ContactDialog } from "@/components/chat/contact-dialog";

export function WantlistContactButton({
  wantlistId,
  userId,
  username,
  title,
}: {
  wantlistId: number;
  userId?: number;
  username: string;
  title?: string;
}) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2.5 gap-1 rounded-lg text-[11px] border-carnest-gold/30 text-carnest-gold hover:bg-carnest-gold hover:text-carnest-navy shrink-0"
        onClick={() => {
          if (!isAuthenticated) {
            toast.error("Vui lòng đăng nhập để liên hệ");
            return;
          }
          // Known user: jump straight into the chat with the wantlist pre-tagged.
          // Only fall back to the compose dialog when the poster's user id isn't available.
          if (userId) {
            const params = new URLSearchParams({
              receiverId: String(userId),
              username,
              tagType: "WANT_LIST",
              tagId: String(wantlistId),
            });
            if (title) params.set("tagLabel", title);
            router.push(`/chat?${params.toString()}`);
            return;
          }
          setOpen(true);
        }}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Liên hệ
      </Button>
      {!userId && (
        <ContactDialog
          open={open}
          onOpenChange={setOpen}
          wantlistId={wantlistId}
          receiverId={userId}
          tagTitle={title}
          username={username}
        />
      )}
    </>
  );
}
