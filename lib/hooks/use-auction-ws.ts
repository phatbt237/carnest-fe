"use client";

import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import type { AuctionBidEvent } from "@/types";

const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || "http://160.250.4.26:8080").replace(/\/$/, "");

const WS_BASE = API_BASE
  .replace(/^https:\/\//, "wss://")
  .replace(/^http:\/\//, "ws://");

/**
 * SockJS WebSocket bridge — bypass sockjs-client hoàn toàn.
 *
 * sockjs-client v1.6 tự loại WebSocket transport khi server trả về
 * cookie_needed:true. Bridge này kết nối thẳng đến SockJS WebSocket
 * URL và tự xử lý SockJS framing (o / a[...] / h / c[...]).
 */
class SockJSBridge {
  private ws: WebSocket;
  private ready = false;

  onopen: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onclose: ((e: CloseEvent) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;

  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;

  get readyState() {
    // chỉ báo OPEN sau khi nhận 'o' frame từ SockJS
    if (!this.ready) return this.CONNECTING;
    return this.ws.readyState;
  }

  constructor(baseWsUrl: string) {
    // SockJS WebSocket URL: {base}/{server_id}/{session_id}/websocket
    const server = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
    const session = Math.random().toString(36).slice(2, 10) +
                    Math.random().toString(36).slice(2, 10);
    const url = `${baseWsUrl}/${server}/${session}/websocket`;

    this.ws = new WebSocket(url);

    this.ws.onmessage = ({ data }) => {
      if (typeof data !== "string") return;
      const type = data[0];

      if (type === "o") {
        // SockJS open frame → báo stompjs connected
        this.ready = true;
        this.onopen?.(new Event("open"));
      } else if (type === "h") {
        // SockJS heartbeat — ignore
      } else if (type === "a") {
        // SockJS message: a["stomp frame"]
        try {
          (JSON.parse(data.slice(1)) as string[]).forEach((msg) =>
            this.onmessage?.(new MessageEvent("message", { data: msg }))
          );
        } catch { /* ignore malformed */ }
      } else if (type === "c") {
        // SockJS close frame
        try {
          const [code, reason] = JSON.parse(data.slice(1)) as [number, string];
          this.ws.close(code, reason);
        } catch { this.ws.close(); }
      }
    };

    this.ws.onclose = (e) => this.onclose?.(e);
    this.ws.onerror = (e) => this.onerror?.(e);
  }

  send(data: string): void {
    if (this.ws.readyState === WebSocket.OPEN) {
      // SockJS send framing: ["stomp frame"]
      this.ws.send(JSON.stringify([data]));
    }
  }

  close(): void {
    this.ws.close();
  }
}

export function useAuctionWebSocket(
  auctionId: number | null,
  onEvent: (event: AuctionBidEvent) => void
) {
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!auctionId) return;

    const client = new Client({
      webSocketFactory: () => new SockJSBridge(`${WS_BASE}/ws`) as unknown as WebSocket,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/auction/${auctionId}`, (message) => {
          try {
            const event: AuctionBidEvent = JSON.parse(message.body);
            onEventRef.current(event);
          } catch { /* ignore */ }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();

    return () => {
      client.deactivate();
      setConnected(false);
    };
  }, [auctionId]);

  return { connected };
}
