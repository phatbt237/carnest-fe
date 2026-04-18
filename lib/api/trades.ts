import apiClient from "./client";
import type { ApiResponse, CreateTradeRequest, Trade } from "@/types";

export const tradesApi = {
  create: async (data: CreateTradeRequest): Promise<Trade> => {
    const res = await apiClient.post<ApiResponse<Trade>>("/api/trades", data);
    return res.data.data;
  },

  accept: async (id: number): Promise<Trade> => {
    const res = await apiClient.put<ApiResponse<Trade>>(`/api/trades/${id}/accept`);
    return res.data.data;
  },

  reject: async (id: number): Promise<Trade> => {
    const res = await apiClient.put<ApiResponse<Trade>>(`/api/trades/${id}/reject`);
    return res.data.data;
  },

  cancel: async (id: number): Promise<Trade> => {
    const res = await apiClient.put<ApiResponse<Trade>>(`/api/trades/${id}/cancel`);
    return res.data.data;
  },

  getMy: async (): Promise<Trade[]> => {
    const res = await apiClient.get<ApiResponse<Trade[]>>("/api/trades/my");
    return res.data.data;
  },

  getReceived: async (): Promise<Trade[]> => {
    const res = await apiClient.get<ApiResponse<Trade[]>>("/api/trades/received");
    return res.data.data;
  },
};
