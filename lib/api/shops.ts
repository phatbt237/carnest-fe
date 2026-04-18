import apiClient from "./client";
import type { ApiResponse, CreateShopRequest, CursorPage, Shop } from "@/types";

export const shopsApi = {
  list: async (params: {
    sortBy?: "follower" | "rating" | "newest";
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<Shop>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Shop>>>("/api/shops", { params });
    return res.data.data;
  },

  search: async (params: { keyword: string; cursor?: string; size?: number }): Promise<CursorPage<Shop>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Shop>>>("/api/shops/search", { params });
    return res.data.data;
  },

  getById: async (id: number): Promise<Shop> => {
    const res = await apiClient.get<ApiResponse<Shop>>(`/api/shops/${id}`);
    return res.data.data;
  },

  getBySlug: async (slug: string): Promise<Shop> => {
    const res = await apiClient.get<ApiResponse<Shop>>(`/api/shops/slug/${slug}`);
    return res.data.data;
  },

  getMyShop: async (): Promise<Shop> => {
    const res = await apiClient.get<ApiResponse<Shop>>("/api/shops/me");
    return res.data.data;
  },

  create: async (data: CreateShopRequest): Promise<Shop> => {
    const res = await apiClient.post<ApiResponse<Shop>>("/api/shops", data);
    return res.data.data;
  },

  update: async (data: Partial<CreateShopRequest>): Promise<Shop> => {
    const res = await apiClient.put<ApiResponse<Shop>>("/api/shops", data);
    return res.data.data;
  },

  follow: async (shopId: number): Promise<void> => {
    await apiClient.post(`/api/shops/${shopId}/follow`);
  },

  unfollow: async (shopId: number): Promise<void> => {
    await apiClient.delete(`/api/shops/${shopId}/follow`);
  },

  getFollowing: async (params: { cursor?: string; size?: number } = {}): Promise<CursorPage<Shop>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Shop>>>("/api/shops/following", { params });
    return res.data.data;
  },
};
