import apiClient from "./client";
import type {
  ApiResponse,
  CreateShowcaseItemRequest,
  CreateShowcaseRequest,
  Showcase,
  ShowcaseItem,
} from "@/types";

export const showcasesApi = {
  create: async (data: CreateShowcaseRequest): Promise<Showcase> => {
    const res = await apiClient.post<ApiResponse<Showcase>>("/api/showcases", data);
    return res.data.data;
  },

  addItem: async (
    showcaseId: number,
    data: CreateShowcaseItemRequest
  ): Promise<ShowcaseItem> => {
    const res = await apiClient.post<ApiResponse<ShowcaseItem>>(
      `/api/showcases/${showcaseId}/items`,
      data
    );
    return res.data.data;
  },

  toggleLike: async (showcaseId: number): Promise<void> => {
    await apiClient.post(`/api/showcases/${showcaseId}/like`);
  },

  getByUser: async (userId: number): Promise<Showcase[]> => {
    const res = await apiClient.get<ApiResponse<Showcase[]>>(
      `/api/showcases/user/${userId}`
    );
    return res.data.data;
  },

  getById: async (showcaseId: number): Promise<Showcase> => {
    const res = await apiClient.get<ApiResponse<Showcase>>(
      `/api/showcases/${showcaseId}`
    );
    return res.data.data;
  },
};
