import apiClient from "./client";
import type { ApiResponse, CursorPage, Notification } from "@/types";

export const notificationsApi = {
  getAll: async (cursor?: string, size = 20): Promise<CursorPage<Notification>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Notification>>>(
      "/api/notifications",
      { params: { cursor, size } }
    );
    return res.data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const res = await apiClient.get<ApiResponse<number>>(
      "/api/notifications/unread-count"
    );
    return res.data.data;
  },

  markAllRead: async (): Promise<void> => {
    await apiClient.put("/api/notifications/read-all");
  },
};
