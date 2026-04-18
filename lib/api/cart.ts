import apiClient from "./client";
import type { ApiResponse, Cart } from "@/types";

export const cartApi = {
  get: async (): Promise<Cart> => {
    const res = await apiClient.get<ApiResponse<Cart>>("/api/cart");
    return res.data.data;
  },

  add: async (productId: number, quantity: number): Promise<Cart> => {
    const res = await apiClient.post<ApiResponse<Cart>>("/api/cart", {
      productId,
      quantity,
    });
    return res.data.data;
  },

  removeItem: async (productId: number): Promise<void> => {
    await apiClient.delete(`/api/cart/${productId}`);
  },

  clear: async (): Promise<void> => {
    await apiClient.delete("/api/cart");
  },
};
