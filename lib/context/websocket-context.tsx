"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/auth-context";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { notificationsApi } from "@/lib/api/notifications";
import type { ChatMessageEvent, Notification } from "@/types";

const WS_URL =
  (process.env.NEXT_PUBLIC_WS_URL || "https://carnest-be-production.up.railway.app")
    .replace("wss://", "https://")
    .replace("ws://", "http://");

type ChatHandler = (event: ChatMessageEvent) => void;

interface WebSocketContextValue {
  isConnected: boolean;
  subscribeToChat: (handler: ChatHandler) => () => void;
}

const WebSocketContext = createContext<WebSocketContextValue>({
  isConnected: false,
  subscribeToChat: () => () => {},
});

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const { setUnreadCount, increment } = useNotificationStore();
  const clientRef = useRef<Client | null>(null);
  const connectedRef = useRef(false);
  const chatHandlersRef = useRef<Set<ChatHandler>>(new Set());

  const subscribeToChat = useCallback((handler: ChatHandler) => {
    chatHandlersRef.current.add(handler);
    return () => {
      chatHandlersRef.current.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Load initial unread count
    notificationsApi.getUnreadCount().then(setUnreadCount).catch(() => {});

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        connectedRef.current = true;

        // Subscribe to notifications
        client.subscribe(`/topic/notifications/${user.id}`, (frame) => {
          try {
            const notif: Notification = JSON.parse(frame.body);
            increment();
            toast.info(notif.title, {
              description: notif.content,
              duration: 5000,
              action: notif.referenceType
                ? {
                    label: "Xem",
                    onClick: () => {
                      window.location.href = resolveNotifUrl(notif);
                    },
                  }
                : undefined,
            });
          } catch {
            // ignore malformed
          }
        });

        // Subscribe to chat
        client.subscribe(`/topic/chat/${user.id}`, (frame) => {
          try {
            const event: ChatMessageEvent = JSON.parse(frame.body);
            chatHandlersRef.current.forEach((h) => h(event));
          } catch {
            // ignore malformed
          }
        });
      },
      onDisconnect: () => {
        connectedRef.current = false;
      },
      onStompError: () => {
        connectedRef.current = false;
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      connectedRef.current = false;
    };
  }, [isAuthenticated, user, setUnreadCount, increment]);

  return (
    <WebSocketContext.Provider
      value={{ isConnected: connectedRef.current, subscribeToChat }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}

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
