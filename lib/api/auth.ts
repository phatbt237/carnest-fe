import apiClient from "./client";
import type { ApiResponse, AuthTokens, LoginRequest, RegisterRequest, User } from "@/types";

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>("/api/auth/register", data);
    return res.data.data;
  },

  login: async (data: LoginRequest): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>("/api/auth/login", data);
    return res.data.data;
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const res = await apiClient.post<ApiResponse<AuthTokens>>("/api/auth/refresh", { refreshToken });
    return res.data.data;
  },

  me: async (): Promise<User> => {
    const res = await apiClient.get<ApiResponse<User>>("/api/auth/me");
    return res.data.data;
  },
};
