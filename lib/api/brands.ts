import apiClient from "./client";
import type { ApiResponse, Brand } from "@/types";

export const brandsApi = {
  list: async (): Promise<Brand[]> => {
    const res = await apiClient.get<ApiResponse<Brand[]>>("/api/brands");
    return res.data.data;
  },

  search: async (keyword: string): Promise<Brand[]> => {
    const res = await apiClient.get<ApiResponse<Brand[]>>("/api/brands/search", {
      params: { keyword },
    });
    return res.data.data;
  },

  getById: async (id: number): Promise<Brand> => {
    const res = await apiClient.get<ApiResponse<Brand>>(`/api/brands/${id}`);
    return res.data.data;
  },

  create: async (data: Omit<Brand, "id">): Promise<Brand> => {
    const res = await apiClient.post<ApiResponse<Brand>>("/api/brands", data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<Brand>): Promise<Brand> => {
    const res = await apiClient.put<ApiResponse<Brand>>(`/api/brands/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/brands/${id}`);
  },
};
