import apiClient from "./client";
import type { ApiResponse, Badge, UserBadge } from "@/types";

export const badgesApi = {
  getAll: async (): Promise<Badge[]> => {
    const res = await apiClient.get<ApiResponse<Badge[]>>("/api/badges");
    return res.data.data;
  },

  getByUser: async (userId: number): Promise<UserBadge[]> => {
    const res = await apiClient.get<ApiResponse<UserBadge[]>>(
      `/api/badges/user/${userId}`
    );
    return res.data.data;
  },

  getMy: async (): Promise<UserBadge[]> => {
    const res = await apiClient.get<ApiResponse<UserBadge[]>>("/api/badges/my");
    return res.data.data;
  },
};
