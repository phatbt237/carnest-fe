"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import type { Client as StompClient } from "@stomp/stompjs";
import { toast } from "sonner";
import { useAuth } from "@/lib/context/auth-context";
import { useNotificationStore } from "@/lib/stores/notification-store";
import { notificationsApi } from "@/lib/api/notifications";
import type { ChatMessageEvent, Notification } from "@/types";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://160.250.4.26:8080").replace(/\/$/, "");

const WS_BASE = API_BASE
  .replace(/^https:\/\//, "wss://")
  .replace(/^http:\/\//, "ws://");

// SockJS WebSocket bridge — bypass cookie_needed:true restriction
class SockJSBridge {
  private ws: WebSocket;
  private ready = false;
  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  readonly CONNECTING = 0; readonly OPEN = 1; readonly CLOSING = 2; readonly CLOSED = 3;
  get readyState() { return !this.ready ? this.CONNECTING : this.ws.readyState; }
  constructor(baseWsUrl: string) {
    const server = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const session = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
    this.ws = new WebSocket(`${baseWsUrl}/${server}/${session}/websocket`);
    this.ws.onmessage = ({ data }) => {
      if (typeof data !== "string") return;
      if (data[0] === "o") { this.ready = true; this.onopen?.(new Event("open")); }
      else if (data[0] === "a") {
        try { (JSON.parse(data.slice(1)) as string[]).forEach(m => this.onmessage?.(new MessageEvent("message", { data: m }))); } catch {}
      } else if (data[0] === "c") { try { this.ws.close(); } catch {} }
    };
    this.ws.onclose = (e) => this.onclose?.(e);
    this.ws.onerror = (e) => this.onerror?.(e);
  }
  send(data: string) { if (this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify([data])); }
  close() { this.ws.close(); }
}

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
  const clientRef = useRef<StompClient | null>(null);
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

    // Lazy-load @stomp/stompjs — keeps it out of the main bundle
    let active = true;
    void import("@stomp/stompjs").then(({ Client }) => {
      if (!active) return;

      const client = new Client({
        webSocketFactory: () => new SockJSBridge(`${WS_BASE}/ws`) as unknown as WebSocket,
        reconnectDelay: 3000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
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
    });

    return () => {
      active = false;
      clientRef.current?.deactivate();
      clientRef.current = null;
      connectedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id]);

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
