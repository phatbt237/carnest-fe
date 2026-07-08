import apiClient from "./client";
import type { Address, ApiResponse, CreateAddressRequest } from "@/types";

export const addressesApi = {
  getAll: async (): Promise<Address[]> => {
    const res = await apiClient.get<ApiResponse<Address[]>>("/api/users/addresses");
    return res.data.data;
  },

  create: async (data: CreateAddressRequest): Promise<Address> => {
    const res = await apiClient.post<ApiResponse<Address>>("/api/users/addresses", data);
    return res.data.data;
  },

  update: async (id: number, data: CreateAddressRequest): Promise<Address> => {
    const res = await apiClient.put<ApiResponse<Address>>(`/api/users/addresses/${id}`, data);
    return res.data.data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/addresses/${id}`);
  },

  setDefault: async (id: number): Promise<Address> => {
    const res = await apiClient.put<ApiResponse<Address>>(`/api/users/addresses/${id}/default`);
    return res.data.data;
  },
};
