import apiClient from "./client";
import type {
  ApiResponse,
  CreateWantListRequest,
  CursorPage,
  WantList,
} from "@/types";

export const wantlistApi = {
  create: async (data: CreateWantListRequest): Promise<WantList> => {
    const res = await apiClient.post<ApiResponse<WantList>>("/api/wantlist", data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<CreateWantListRequest>): Promise<WantList> => {
    const res = await apiClient.put<ApiResponse<WantList>>(`/api/wantlist/${id}`, data);
    return res.data.data;
  },

  cancel: async (id: number): Promise<WantList> => {
    const res = await apiClient.put<ApiResponse<WantList>>(
      `/api/wantlist/${id}/cancel`
    );
    return res.data.data;
  },

  getMy: async (cursor?: string, size = 20): Promise<CursorPage<WantList>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<WantList>>>(
      "/api/wantlist/my",
      { params: { cursor, size } }
    );
    return res.data.data;
  },

  getPublic: async (cursor?: string, size = 20): Promise<CursorPage<WantList>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<WantList>>>(
      "/api/wantlist/public",
      { params: { cursor, size } }
    );
    return res.data.data;
  },

  contact: async (id: number, content: string, imageUrls?: string[]): Promise<void> => {
    await apiClient.post(`/api/wantlist/${id}/contact`, {
      content,
      type: imageUrls?.length ? "IMAGE" : "TEXT",
      ...(imageUrls?.length ? { imageUrls } : {}),
    });
  },
};
