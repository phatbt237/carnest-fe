import apiClient from "./client";
import type { ApiResponse, CursorPage, CreateReviewRequest, Review } from "@/types";

export const reviewsApi = {
  create: async (data: CreateReviewRequest): Promise<Review> => {
    const res = await apiClient.post<ApiResponse<Review>>("/api/reviews", data);
    return res.data.data;
  },

  reply: async (reviewId: number, reply: string): Promise<Review> => {
    const res = await apiClient.put<ApiResponse<Review>>(
      `/api/reviews/${reviewId}/reply`,
      { reply }
    );
    return res.data.data;
  },

  getByShop: async (
    shopId: number,
    cursor?: string,
    size = 10
  ): Promise<CursorPage<Review>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Review>>>(
      `/api/reviews/shop/${shopId}`,
      { params: { cursor, size } }
    );
    return res.data.data;
  },
};
