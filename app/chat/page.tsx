"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, MessageCircle, ArrowLeft, ImagePlus, Tag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReportModal } from "@/components/report/report-modal";
import { chatApi } from "@/lib/api/chat";
import { uploadApi } from "@/lib/api/upload";
import { ordersApi } from "@/lib/api/orders";
import { productsApi } from "@/lib/api/products";
import { useAuth } from "@/lib/context/auth-context";
import { useWebSocket } from "@/lib/context/websocket-context";
import { formatCurrency, formatDate, formatDateTime, getErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChatMessageEvent, ChatTagType, Conversation, CursorPage, Message } from "@/types";

// ─── localStorage helpers ──────────────────────────────────────────────────
const LS_KEY = "carnest_chat_receivers";

function loadReceiverMap(): Record<number, number> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveReceiverMap(map: Record<number, number>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(map));
  } catch {}
}

// ─── Sub-components ────────────────────────────────────────────────────────
function ConversationItem({
  conv,
  active,
  onClick,
}: {
  conv: Conversation;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left",
        active && "bg-carnest-blue/5 border-r-2 border-carnest-blue"
      )}
    >
      <div className="h-10 w-10 rounded-full bg-carnest-blue/10 flex items-center justify-center text-carnest-blue font-semibold shrink-0 overflow-hidden">
        {conv.otherAvatar ? (
          <Image
            src={conv.otherAvatar}
            alt={conv.otherUsername}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        ) : (
          conv.otherUsername.charAt(0).toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-sm truncate",
              conv.unread > 0 ? "font-bold text-gray-900" : "font-semibold text-gray-900"
            )}
          >
            {conv.otherUsername}
          </p>
          {conv.unread > 0 && (
            <span className="h-5 min-w-5 px-1 rounded-full bg-carnest-blue text-white text-[10px] font-bold leading-none flex items-center justify-center shrink-0">
              {conv.unread > 99 ? "99+" : conv.unread}
            </span>
          )}
        </div>
        {conv.lastMessage && (
          <p
            className={cn(
              "text-xs truncate mt-0.5",
              conv.unread > 0 ? "font-bold text-gray-900" : "text-gray-400"
            )}
          >
            {conv.lastMessage}
          </p>
        )}
      </div>
    </button>
  );
}

const TAG_LABELS: Record<ChatTagType, string> = {
  PRODUCT: "Sản phẩm",
  ORDER: "Đơn hàng",
  WANT_LIST: "Yêu cầu tìm kiếm",
};

const GROUP_GAP_MS = 2 * 60 * 1000;

function getGroupFlags(messages: Message[], index: number) {
  const cur = messages[index];
  const prev = messages[index - 1];
  const next = messages[index + 1];

  const connectedToPrev =
    !!prev &&
    prev.senderUsername === cur.senderUsername &&
    Math.abs(new Date(cur.createdAt).getTime() - new Date(prev.createdAt).getTime()) < GROUP_GAP_MS;

  const connectedToNext =
    !!next &&
    next.senderUsername === cur.senderUsername &&
    Math.abs(new Date(next.createdAt).getTime() - new Date(cur.createdAt).getTime()) < GROUP_GAP_MS;

  return { isFirst: !connectedToPrev, isLast: !connectedToNext };
}

function MessageBubble({
  msg,
  isMine,
  isFirst,
  isLast,
  isLastMessage,
  onImageLoad,
}: {
  msg: Message;
  isMine: boolean;
  isFirst: boolean;
  isLast: boolean;
  isLastMessage?: boolean;
  onImageLoad?: () => void;
}) {
  const router = useRouter();
  const [resolvingTag, setResolvingTag] = useState(false);
  const isImage = msg.type === "IMAGE";
  const tagClickable = msg.tagType === "PRODUCT" || msg.tagType === "ORDER";

  const handleTagClick = async () => {
    if (!msg.tagType || !msg.tagId || resolvingTag) return;
    if (msg.tagType === "ORDER") {
      router.push(`/orders/${msg.tagId}`);
      return;
    }
    if (msg.tagType === "PRODUCT") {
      setResolvingTag(true);
      try {
        const product = await productsApi.getById(msg.tagId);
        router.push(`/products/${product.slug}`);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setResolvingTag(false);
      }
    }
  };
  const bubbleClass = isMine
    ? cn(
        "bg-carnest-blue text-white",
        isFirst && isLast  && "rounded-2xl rounded-br-sm",
        isFirst && !isLast && "rounded-2xl",
        !isFirst && !isLast && "rounded-l-2xl rounded-r-sm",
        !isFirst && isLast  && "rounded-l-2xl rounded-tr-sm rounded-br-sm",
      )
    : cn(
        "bg-gray-100 text-gray-900",
        isFirst && isLast  && "rounded-2xl rounded-bl-sm",
        isFirst && !isLast && "rounded-2xl",
        !isFirst && !isLast && "rounded-r-2xl rounded-l-sm",
        !isFirst && isLast  && "rounded-r-2xl rounded-tl-sm rounded-bl-sm",
      );

  return (
    <div
      className={cn(
        "group flex items-end gap-1",
        isMine ? "justify-end" : "justify-start",
        isFirst ? "mt-3" : "mt-0.5"
      )}
    >
      {!isMine && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-1 shrink-0">
          <ReportModal
            targetType="MESSAGE"
            targetId={msg.id}
            trigger={
              <button className="p-1 rounded text-gray-300 hover:text-red-400 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                  <line x1="4" y1="22" x2="4" y2="15" />
                </svg>
              </button>
            }
          />
        </div>
      )}
      <div className={cn("max-w-[70%] overflow-hidden", isImage ? "" : "px-4 py-2 text-sm", bubbleClass)}>
        {msg.tagType && (
          <span
            role={tagClickable ? "button" : undefined}
            onClick={tagClickable ? handleTagClick : undefined}
            className={cn(
              "inline-flex items-center gap-1 mb-1 px-2 py-0.5 rounded-full text-[10px] font-medium",
              isImage && "mx-3 mt-2",
              isMine ? "bg-white/15 text-blue-50" : "bg-black/5 text-gray-600",
              tagClickable && "cursor-pointer hover:underline",
              resolvingTag && "opacity-60"
            )}
          >
            <Tag className="h-2.5 w-2.5" />
            {msg.tagTitle ? `${TAG_LABELS[msg.tagType]}: ${msg.tagTitle}` : TAG_LABELS[msg.tagType]}
          </span>
        )}
        {isImage ? (
          <>
            <div className={cn("grid gap-0.5", (msg.imageUrls?.length ?? 1) > 1 ? "grid-cols-2" : "grid-cols-1")}>
              {(msg.imageUrls?.length ? msg.imageUrls : [msg.content]).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <Image
                    src={url}
                    alt="Hình ảnh"
                    width={240}
                    height={240}
                    className="block w-full h-auto object-cover"
                    onLoad={() => isLastMessage && onImageLoad?.()}
                  />
                </a>
              ))}
            </div>
            {isLast && (
              <p className={cn("text-[10px] px-3 pb-1.5 mt-0.5", isMine ? "text-blue-200" : "text-gray-400")}>
                {formatDateTime(msg.createdAt)}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="leading-relaxed">{msg.content}</p>
            {isLast && (
              <p className={cn("text-[10px] mt-1", isMine ? "text-blue-200" : "text-gray-400")}>
                {formatDateTime(msg.createdAt)}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function ChatPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-20 text-center text-gray-400">Đang tải...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}

function ChatPageContent() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const { subscribeToChat } = useWebSocket();

  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "messages">("list");
  const [convReceiverMap, setConvReceiverMap] = useState<Record<number, number>>(loadReceiverMap);
  // Pending = receiver set from URL but no conversation created yet
  const [pendingReceiverId, setPendingReceiverId] = useState<number | null>(null);
  const [pendingUsername, setPendingUsername] = useState<string>("");
  // Tag attached to the next message sent — either manually picked from the compose bar
  // (e.g. "Đơn hàng" picker) or carried over from a "Liên hệ" link's tagType/tagId/tagLabel.
  // Applies whether the conversation is brand-new or already existed.
  const [manualTag, setManualTag] = useState<{ tagType: ChatTagType; tagId: number; label: string } | null>(null);
  const [orderPickerOpen, setOrderPickerOpen] = useState(false);

  const [pendingImages, setPendingImages] = useState<{ file: File; preview: string }[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);

  // Revoke object URLs on cleanup
  useEffect(() => {
    return () => {
      pendingImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: update both state and localStorage together
  const addReceiver = useCallback((convId: number, receiverId: number) => {
    setConvReceiverMap((prev) => {
      const next = { ...prev, [convId]: receiverId };
      saveReceiverMap(next);
      return next;
    });
  }, []);

  // ── Conversations list ────────────────────────────────────────────────
  const convsQuery = useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: ({ pageParam }) =>
      chatApi.getConversations(pageParam as string | undefined, 20),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
    enabled: isAuthenticated,
  });

  const conversations = useMemo(
    () => convsQuery.data?.pages.flatMap((p) => p.items) ?? [],
    [convsQuery.data]
  );
  const activeConv = conversations.find((c) => c.id === activeConvId);

  // The person the next message would go to, whether the conversation is pending or active
  const currentReceiverId = activeConvId
    ? convReceiverMap[activeConvId] ?? activeConv?.otherId
    : pendingReceiverId ?? undefined;

  // When conversations load, always sync otherId into the map (overwrites stale localStorage)
  useEffect(() => {
    conversations.forEach((conv) => {
      if (conv.otherId) {
        addReceiver(conv.id, conv.otherId);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversations]);

  // ── Messages for active conversation ─────────────────────────────────
  const msgsQuery = useInfiniteQuery({
    queryKey: ["messages", activeConvId],
    queryFn: ({ pageParam }) =>
      chatApi.getMessages(activeConvId!, pageParam as string | undefined, 30),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (p) => (p.hasMore ? (p.nextCursor ?? undefined) : undefined),
    enabled: !!activeConvId,
  });

  const messages =
    msgsQuery.data?.pages
      .slice()
      .reverse()
      .flatMap((p) => p.items.slice().reverse()) ?? [];

  // Set scrollTop directly (rather than scrollIntoView) so it lands exactly at the
  // bottom — used both on new messages and once a lazy-loaded image resizes the last bubble.
  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, []);

  // Auto-scroll on new messages (only when NOT loading older pages)
  useEffect(() => {
    if (prevScrollHeightRef.current) return; // loading older — don't scroll to bottom
    scrollToBottom();
  }, [messages.length, activeConvId, scrollToBottom]);

  // Restore scroll position after older messages are prepended
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || !prevScrollHeightRef.current) return;
    container.scrollTop = container.scrollHeight - prevScrollHeightRef.current;
    prevScrollHeightRef.current = 0;
  }, [messages.length]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (activeConvId) {
      chatApi.markRead(activeConvId).catch(() => {});
      queryClient.setQueryData<InfiniteData<CursorPage<Conversation>>>(["conversations"], (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((c) =>
                  c.id === activeConvId ? { ...c, unread: 0 } : c
                ),
              })),
            }
          : old
      );
    }
  }, [activeConvId, queryClient]);

  // ── Orders with the current receiver, for the "Đơn hàng" tag picker ───
  const myOrdersQuery = useQuery({
    queryKey: ["chat-tag-orders", "buyer"],
    queryFn: () => ordersApi.myOrders({ size: 50 }),
    enabled: orderPickerOpen,
  });
  const shopOrdersQuery = useQuery({
    queryKey: ["chat-tag-orders", "seller"],
    queryFn: () => ordersApi.shopOrders({ size: 50 }),
    enabled: orderPickerOpen && !!user?.isSeller,
  });
  const taggableOrders = useMemo(() => {
    if (!currentReceiverId) return [];
    const all = [
      ...(myOrdersQuery.data?.items ?? []),
      ...(shopOrdersQuery.data?.items ?? []),
    ];
    return all.filter(
      (o) => o.buyer.id === currentReceiverId || o.shop.owner?.id === currentReceiverId
    );
  }, [myOrdersQuery.data, shopOrdersQuery.data, currentReceiverId]);

  // ── WebSocket handler ─────────────────────────────────────────────────
  const handleChatMessage = useCallback(
    (event: ChatMessageEvent) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (event.conversationId === activeConvId) {
        queryClient.invalidateQueries({ queryKey: ["messages", activeConvId] });
      }
    },
    [activeConvId, queryClient]
  );

  useEffect(() => {
    const unsub = subscribeToChat(handleChatMessage);
    return unsub;
  }, [subscribeToChat, handleChatMessage]);

  // ── Send mutation ─────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: (params: {
      receiverId: number;
      message: string;
      type?: string;
      imageUrls?: string[];
      tagType?: ChatTagType;
      tagId?: number;
      tagTitle?: string;
    }) =>
      chatApi.send(params.receiverId, params.message, params.type, {
        imageUrls: params.imageUrls,
        tagType: params.tagType,
        tagId: params.tagId,
        tagTitle: params.tagTitle,
      }),
    onSuccess: (data, variables) => {
      const convId = data.conversationId;

      // Persist this receiver so future sends in this conversation work
      addReceiver(convId, variables.receiverId);

      // Build the new message from the API response
      const newMessage: Message = {
        id: data.messageId,
        senderUsername: data.senderUsername,
        content: data.content,
        type: data.type ?? variables.type ?? "TEXT",
        isRead: true,
        createdAt: data.timestamp,
        imageUrls: data.imageUrls ?? variables.imageUrls,
        tagType: data.tagType ?? variables.tagType,
        tagId: data.tagId ?? variables.tagId,
        tagTitle: data.tagTitle ?? variables.tagTitle,
      };

      // Optimistically insert the message into the cache.
      // If no cache exists yet (fresh conversation), create an initial page.
      queryClient.setQueryData<InfiniteData<CursorPage<Message>>>(
        ["messages", convId],
        (old) => {
          if (!old || old.pages.length === 0) {
            // No cache yet — seed it with this message
            return {
              pages: [{ items: [newMessage], hasMore: false, nextCursor: null, size: 1, totalElements: 1 }],
              pageParams: [undefined],
            };
          }
          // Prepend to first page (will appear at end after reverse())
          const [firstPage, ...rest] = old.pages;
          return {
            ...old,
            pages: [
              { ...firstPage, items: [newMessage, ...firstPage.items] },
              ...rest,
            ],
          };
        }
      );

      // Update conversations sidebar (last message preview)
      queryClient.setQueryData<InfiniteData<CursorPage<Conversation>>>(["conversations"], (old) =>
        old
          ? {
              ...old,
              pages: old.pages.map((page) => ({
                ...page,
                items: page.items.map((c) =>
                  c.id === convId
                    ? { ...c, lastMessage: data.content, lastMessageAt: data.timestamp }
                    : c
                ),
              })),
            }
          : old
      );
      queryClient.invalidateQueries({ queryKey: ["conversations"] });

      setActiveConvId(convId);
      setPendingReceiverId(null);
      setPendingUsername("");
      setManualTag(null);
      setInputValue("");
      if (inputRef.current) inputRef.current.style.height = "auto";
      inputRef.current?.focus();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // ── Image picker ──────────────────────────────────────────────────────
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPendingImages((prev) => [
      ...prev,
      ...files.map((file) => ({ file, preview: URL.createObjectURL(file) })),
    ]);
    e.target.value = "";
  };

  const removePendingImage = (index: number) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ── Handle send button / Enter ────────────────────────────────────────
  const handleSend = async () => {
    if (sendMutation.isPending || isUploadingImage) return;

    // Resolve receiver
    let receiverId: number | undefined;
    if (pendingReceiverId && !activeConvId) {
      receiverId = pendingReceiverId;
    } else if (activeConvId) {
      receiverId = convReceiverMap[activeConvId] ?? activeConv?.otherId;
    }
    if (!receiverId) return;
    if (user && receiverId === user.id) {
      toast.error("Không thể nhắn tin cho chính mình");
      return;
    }

    const tag = manualTag;

    // Image send
    if (pendingImages.length > 0) {
      setIsUploadingImage(true);
      try {
        const imageUrls = await uploadApi.uploadImages(pendingImages.map((p) => p.file), "chat");
        pendingImages.forEach((p) => URL.revokeObjectURL(p.preview));
        setPendingImages([]);
        sendMutation.mutate({
          receiverId,
          message: inputValue.trim() || imageUrls[0],
          type: "IMAGE",
          imageUrls,
          tagType: tag?.tagType,
          tagId: tag?.tagId,
          tagTitle: tag?.label,
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setIsUploadingImage(false);
      }
      return;
    }

    // Text send
    const text = inputValue.trim();
    if (!text) return;
    sendMutation.mutate({ receiverId, message: text, tagType: tag?.tagType, tagId: tag?.tagId, tagTitle: tag?.label });
  };

  // ── Scroll to top → auto-load older messages ─────────────────────────
  const handleMessagesScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    if (container.scrollTop < 80 && msgsQuery.hasNextPage && !msgsQuery.isFetchingNextPage) {
      prevScrollHeightRef.current = container.scrollHeight;
      msgsQuery.fetchNextPage();
    }
  }, [msgsQuery]);

  // ── Read receiverId (+ optional tagType/tagId) from URL — set pending, don't auto-send ──
  useEffect(() => {
    const receiverIdParam = searchParams.get("receiverId");
    if (!receiverIdParam || !isAuthenticated || !user) return;
    const receiverId = Number(receiverIdParam);
    if (!receiverId || receiverId === user.id) return;
    setPendingReceiverId(receiverId);
    setPendingUsername(searchParams.get("username") ?? "");
    setMobileView("messages");

    const tagType = searchParams.get("tagType");
    const tagIdParam = searchParams.get("tagId");
    if ((tagType === "PRODUCT" || tagType === "ORDER" || tagType === "WANT_LIST") && tagIdParam) {
      const label = searchParams.get("tagLabel") || TAG_LABELS[tagType];
      setManualTag({ tagType, tagId: Number(tagIdParam), label });
    }
  }, [searchParams, isAuthenticated, user]);

  // ── When conversations load, resolve pending to existing conv ─────────
  useEffect(() => {
    if (!pendingReceiverId || conversations.length === 0) return;
    const existing = conversations.find((c) => c.otherId === pendingReceiverId);
    if (existing) {
      setActiveConvId(existing.id);
      if (existing.otherId) addReceiver(existing.id, existing.otherId);
      setPendingReceiverId(null);
      setPendingUsername("");
    }
  }, [conversations, pendingReceiverId, addReceiver]);

  // ── Not authenticated ─────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-20 text-center text-gray-500">
        Vui lòng đăng nhập để sử dụng chat
      </div>
    );
  }

  return (
    <div className="container mx-auto px-0 md:px-4 py-0 md:py-6 max-w-5xl">
      <div className="flex h-[calc(100vh-8rem)] md:h-[600px] md:rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        {/* Conversations sidebar */}
        <div
          className={cn(
            "w-full md:w-80 md:flex flex-col border-r border-gray-100 shrink-0",
            mobileView === "messages" ? "hidden" : "flex"
          )}
        >
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Tin nhắn</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {convsQuery.isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
                <MessageCircle className="h-10 w-10 opacity-30" />
                <p className="text-sm">Chưa có cuộc trò chuyện</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  active={conv.id === activeConvId}
                  onClick={async () => {
                    setActiveConvId(conv.id);
                    setMobileView("messages");
                    setPendingReceiverId(null);
                    setPendingUsername("");
                    setManualTag(null);

                    if (conv.otherId) {
                      addReceiver(conv.id, conv.otherId);
                    } else if (!convReceiverMap[conv.id]) {
                      // otherId missing — fetch conversation detail to get it
                      try {
                        const detail = await chatApi.getConversation(conv.id);
                        if (detail.otherId) addReceiver(conv.id, detail.otherId);
                      } catch {}
                    }
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Messages panel */}
        <div
          className={cn(
            "flex-1 flex flex-col min-w-0",
            mobileView === "list" ? "hidden md:flex" : "flex"
          )}
        >
          {(activeConvId && activeConv) || pendingReceiverId ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <button
                  onClick={() => { setMobileView("list"); setPendingReceiverId(null); setPendingUsername(""); }}
                  className="md:hidden p-1 -ml-1"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div className="h-9 w-9 rounded-full bg-carnest-blue/10 flex items-center justify-center text-carnest-blue font-semibold overflow-hidden">
                  {activeConv?.otherAvatar ? (
                    <Image
                      src={activeConv.otherAvatar}
                      alt={activeConv.otherUsername}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (activeConv?.otherUsername ?? pendingUsername).charAt(0).toUpperCase() || "?"
                  )}
                </div>
                <span className="font-semibold text-gray-900">
                  {activeConv?.otherUsername ?? (pendingUsername || "Tin nhắn mới")}
                </span>
              </div>

              {/* Messages */}
              <div
                ref={scrollContainerRef}
                onScroll={handleMessagesScroll}
                className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide"
              >
                {msgsQuery.isFetchingNextPage && (
                  <p className="text-center text-xs text-gray-400 mb-2">Đang tải...</p>
                )}
                {!activeConvId && pendingReceiverId && (
                  <p className="text-center text-xs text-gray-400 mt-8">Bắt đầu cuộc trò chuyện</p>
                )}
                {messages.map((msg, i) => {
                  const { isFirst, isLast } = getGroupFlags(messages, i);
                  return (
                    <MessageBubble
                      key={msg.id}
                      msg={msg}
                      isMine={msg.senderUsername === user?.username}
                      isFirst={isFirst}
                      isLast={isLast}
                      isLastMessage={i === messages.length - 1}
                      onImageLoad={scrollToBottom}
                    />
                  );
                })}
              </div>

              {/* Input */}
              <div className="border-t border-gray-100">
                {/* Selected tag preview */}
                {manualTag && (
                  <div className="px-4 pt-2 pb-1 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-carnest-blue/10 text-carnest-blue text-xs font-medium">
                      <Tag className="h-3 w-3" />
                      {manualTag.label}
                      <button
                        onClick={() => setManualTag(null)}
                        className="p-0.5 rounded-full hover:bg-carnest-blue/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  </div>
                )}
                {/* Image preview */}
                {pendingImages.length > 0 && (
                  <div className="px-4 pt-2 pb-1 flex items-center gap-2 flex-wrap">
                    {pendingImages.map((img, i) => (
                      <div key={img.preview} className="relative h-16 w-16 rounded-lg overflow-hidden border shrink-0">
                        <Image src={img.preview} alt="Preview" fill className="object-cover" sizes="64px" />
                        <button
                          onClick={() => removePendingImage(i)}
                          className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/50 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {isUploadingImage && (
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Đang gửi...
                      </span>
                    )}
                  </div>
                )}
                <div className="px-4 py-3 flex gap-2 items-end">
                  {/* Hidden file input */}
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  {/* Image picker button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 text-gray-500 hover:text-carnest-blue hover:border-carnest-blue"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploadingImage || sendMutation.isPending}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  {/* Order tag picker button */}
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className={cn(
                      "shrink-0 text-gray-500 hover:text-carnest-blue hover:border-carnest-blue",
                      manualTag && "text-carnest-blue border-carnest-blue"
                    )}
                    onClick={() => {
                      if (!currentReceiverId) return;
                      setOrderPickerOpen(true);
                    }}
                    disabled={!currentReceiverId || isUploadingImage || sendMutation.isPending}
                    title="Gắn tag đơn hàng"
                  >
                    <Tag className="h-4 w-4" />
                  </Button>
                  <textarea
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value);
                      const el = e.target;
                      el.style.height = "auto";
                      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
                    }
                    placeholder={pendingImages.length > 0 ? "Thêm chú thích... (tuỳ chọn)" : "Nhập tin nhắn..."}
                    rows={1}
                    className="flex-1 h-9 max-h-[120px] resize-none overflow-y-auto scrollbar-hide rounded-md border border-input bg-transparent px-3 py-1.5 text-sm leading-normal shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isUploadingImage}
                  />
                  <Button
                    onClick={handleSend}
                    disabled={(!inputValue.trim() && pendingImages.length === 0) || sendMutation.isPending || isUploadingImage}
                    className="bg-carnest-blue hover:bg-carnest-blue-dark text-white shrink-0"
                    size="icon"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
              <MessageCircle className="h-16 w-16 opacity-20" />
              <p className="text-sm">Chọn một cuộc trò chuyện để bắt đầu</p>
            </div>
          )}
        </div>
      </div>

      {/* Order tag picker */}
      <Dialog open={orderPickerOpen} onOpenChange={setOrderPickerOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 text-lg">Gắn tag đơn hàng</DialogTitle>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto -mx-1 px-1 space-y-1.5">
            {myOrdersQuery.isLoading || shopOrdersQuery.isLoading ? (
              <p className="text-center text-sm text-gray-400 py-6">Đang tải...</p>
            ) : taggableOrders.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">
                Không có đơn hàng nào chung với người này
              </p>
            ) : (
              taggableOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => {
                    setManualTag({ tagType: "ORDER", tagId: order.id, label: `Đơn ${order.orderCode}` });
                    setOrderPickerOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-carnest-blue hover:bg-carnest-blue/5 text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{order.orderCode}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-carnest-blue shrink-0">
                    {formatCurrency(order.totalAmount)}
                  </span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
