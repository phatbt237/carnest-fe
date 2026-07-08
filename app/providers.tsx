"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AuthProvider } from "@/lib/context/auth-context";
import { WebSocketProvider } from "@/lib/context/websocket-context";
import { Toaster } from "sonner";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://carnest-be-production.up.railway.app";

// Ping backend khi app khởi động để Railway không bị cold start khi user thực sự dùng
function BackendWakeup() {
  useEffect(() => {
    // Server VPS luôn chạy, không cần wakeup ping như Railway
    // Bỏ interval để không tạo traffic không cần thiết
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <BackendWakeup />
      <AuthProvider>
        <WebSocketProvider>
          {children}
        </WebSocketProvider>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
