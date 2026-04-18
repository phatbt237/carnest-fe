"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportModal } from "@/components/report/report-modal";
import { chatApi } from "@/lib/api/chat";
import { useAuth } from "@/lib/context/auth-context";
import { useWebSocket } from "@/lib/context/websocket-context";
import { formatDateTime, getErrorMessage } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { ChatMessageEvent, Conversation, CursorPage, Message } from "@/types";

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
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {conv.otherUsername}
          </p>
          {conv.unread > 0 && (
            <span className="h-4.5 w-4.5 rounded-full bg-carnest-blue text-white text-[9px] font-bold flex items-center justify-center ml-1 shrink-0">
              {conv.unread}
            </span>
          )}
        </div>
        {conv.lastMessage && (
          <p className="text-xs text-gray-400 truncate mt-0.5">{conv.lastMessage}</p>
        )}
      </div>
    </button>
  );
}

function MessageBubble({ msg, isMine }: { msg: Message; isMine: boolean }) {
  return (
    <div className={cn("group flex items-end gap-1", isMine ? "justify-end" : "justify-start")}>
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
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2.5 text-sm",
          isMine
            ? "bg-carnest-blue text-white rounded-br-sm"
            : "bg-gray-100 text-gray-900 rounded-bl-sm"
        )}
      >
        <p className="leading-relaxed">{msg.content}</p>
        <p className={cn("text-[10px] mt-1", isMine ? "text-blue-200" : "text-gray-400")}>
          {formatDateTime(msg.createdAt)}
        </p>
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
  // convReceiverMap is seeded from localStorage so it survives navigation
  const [convReceiverMap, setConvReceiverMap] = useState<Record<number, number>>(loadReceiverMap);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const conversations = convsQuery.data?.pages.flatMap((p) => p.items) ?? [];
  const activeConv = conversations.find((c) => c.id === activeConvId);

  // When conversations load, sync any otherId values we have into the map
  useEffect(() => {
    conversations.forEach((conv) => {
      if (conv.otherId && !convReceiverMap[conv.id]) {
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

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark as read when conversation opens
  useEffect(() => {
    if (activeConvId) {
      chatApi.markRead(activeConvId).catch(() => {});
      queryClient.setQueryData<typeof convsQuery.data>(["conversations"], (old) =>
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
    mutationFn: (params: { receiverId: number; message: string }) =>
      chatApi.send(params.receiverId, params.message),
    onSuccess: (data, variables) => {
      const convId = data.conversationId;

      // Persist this receiver so future sends in this conversation work
      addReceiver(convId, variables.receiverId);

      // Build the new message from the API response
      const newMessage: Message = {
        id: data.messageId,
        senderUsername: data.senderUsername,
        content: data.content,
        type: "TEXT",
        isRead: true,
        createdAt: data.timestamp,
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
      queryClient.setQueryData<typeof convsQuery.data>(["conversations"], (old) =>
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
      setInputValue("");
      inputRef.current?.focus();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  // ── Handle send button / Enter ────────────────────────────────────────
  const handleSend = () => {
    const text = inputValue.trim();
    if (!text || !activeConvId || sendMutation.isPending) return;

    const receiverId = convReceiverMap[activeConvId];
    if (!receiverId) {
      // Should rarely happen — show a helpful hint
      toast.error("Không thể gửi: hãy mở lại cuộc trò chuyện từ trang sản phẩm");
      return;
    }
    sendMutation.mutate({ receiverId, message: text });
  };

  // ── Open chat from URL params ─────────────────────────────────────────
  useEffect(() => {
    const receiverIdParam = searchParams.get("receiverId");
    const initialMsg = searchParams.get("message") || "Xin chào!";
    if (receiverIdParam && isAuthenticated) {
      const receiverId = Number(receiverIdParam);
      chatApi
        .send(receiverId, initialMsg)
        .then((data) => {
          addReceiver(data.conversationId, receiverId);
          queryClient.invalidateQueries({ queryKey: ["conversations"] });
          setActiveConvId(data.conversationId);
          setMobileView("messages");
        })
        .catch(() => {});
    }
  }, [searchParams, isAuthenticated, queryClient, addReceiver]);

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
                  onClick={() => {
                    setActiveConvId(conv.id);
                    setMobileView("messages");
                    // If backend returns otherId, persist it
                    if (conv.otherId) {
                      addReceiver(conv.id, conv.otherId);
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
          {activeConvId && activeConv ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <button onClick={() => setMobileView("list")} className="md:hidden p-1 -ml-1">
                  <ArrowLeft className="h-5 w-5 text-gray-500" />
                </button>
                <div className="h-9 w-9 rounded-full bg-carnest-blue/10 flex items-center justify-center text-carnest-blue font-semibold overflow-hidden">
                  {activeConv.otherAvatar ? (
                    <Image
                      src={activeConv.otherAvatar}
                      alt={activeConv.otherUsername}
                      width={36}
                      height={36}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    activeConv.otherUsername.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="font-semibold text-gray-900">{activeConv.otherUsername}</span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {msgsQuery.hasNextPage && (
                  <div className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => msgsQuery.fetchNextPage()}
                      disabled={msgsQuery.isFetchingNextPage}
                      className="text-xs text-gray-400"
                    >
                      {msgsQuery.isFetchingNextPage ? "Đang tải..." : "Tải tin cũ hơn"}
                    </Button>
                  </div>
                )}
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMine={msg.senderUsername === user?.username}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
                    }
                    placeholder="Nhập tin nhắn..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={!inputValue.trim() || sendMutation.isPending}
                    className="bg-carnest-blue hover:bg-carnest-blue-dark text-white shrink-0"
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
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
    </div>
  );
}
