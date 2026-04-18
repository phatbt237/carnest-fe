import apiClient from "./client";
import type { ApiResponse, Category } from "@/types";

export const categoriesApi = {
  list: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>("/api/categories");
    return res.data.data;
  },

  tree: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>("/api/categories/tree");
    return res.data.data;
  },

  getById: async (id: number): Promise<Category> => {
    const res = await apiClient.get<ApiResponse<Category>>(`/api/categories/${id}`);
    return res.data.data;
  },

  create: async (data: Omit<Category, "id" | "children">): Promise<Category> => {
    const res = await apiClient.post<ApiResponse<Category>>("/api/categories", data);
    return res.data.data;
  },

  update: async (id: number, data: Partial<Category>): Promise<Category> => {
    const res = await apiClient.put<ApiResponse<Category>>(`/api/categories/${id}`, data);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/categories/${id}`);
  },
};
