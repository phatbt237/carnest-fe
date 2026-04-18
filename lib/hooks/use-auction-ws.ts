"use client";

import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { AuctionBidEvent } from "@/types";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL?.replace("wss://", "https://").replace(
    "ws://",
    "http://"
  ) || "https://carnest-be-production.up.railway.app";

export function useAuctionWebSocket(
  auctionId: number | null,
  onEvent: (event: AuctionBidEvent) => void
) {
  const clientRef = useRef<Client | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!auctionId) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/auction/${auctionId}`, (message) => {
          try {
            const event: AuctionBidEvent = JSON.parse(message.body);
            onEvent(event);
          } catch {
            // ignore malformed messages
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [auctionId, onEvent]);

  return { connected };
}
