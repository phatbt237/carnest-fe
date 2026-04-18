import apiClient from "./client";
import type {
  ApiResponse,
  CursorPage,
  CreateProductRequest,
  Product,
  ProductFilter,
} from "@/types";

export const productsApi = {
  list: async (params: ProductFilter = {}): Promise<CursorPage<Product>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Product>>>(
      "/api/products",
      { params }
    );
    return res.data.data;
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<Product>>(
      `/api/products/slug/${slug}`
    );
    return res.data.data;
  },

  getById: async (id: number): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<Product>>(
      `/api/products/${id}`
    );
    return res.data.data;
  },

  getByShop: async (
    shopId: number,
    params: { cursor?: string; size?: number } = {}
  ): Promise<CursorPage<Product>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Product>>>(
      `/api/products/shop/${shopId}`,
      { params }
    );
    return res.data.data;
  },

  create: async (data: CreateProductRequest): Promise<Product> => {
    const res = await apiClient.post<ApiResponse<Product>>(
      "/api/products",
      data
    );
    return res.data.data;
  },

  update: async (
    id: number,
    data: Partial<CreateProductRequest>
  ): Promise<Product> => {
    const res = await apiClient.put<ApiResponse<Product>>(
      `/api/products/${id}`,
      data
    );
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/products/${id}`);
  },
};
