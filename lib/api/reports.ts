import apiClient from "./client";
import type { ApiResponse, CreateReportRequest, Report } from "@/types";

export const reportsApi = {
  create: async (data: CreateReportRequest): Promise<Report> => {
    const res = await apiClient.post<ApiResponse<Report>>("/api/reports", data);
    return res.data.data;
  },

  // Admin only
  getAll: async (status?: string): Promise<Report[]> => {
    const res = await apiClient.get<ApiResponse<Report[]>>("/api/reports/admin", {
      params: { status },
    });
    return res.data.data;
  },

  resolve: async (id: number, resolution: string): Promise<Report> => {
    const res = await apiClient.put<ApiResponse<Report>>(
      `/api/reports/admin/${id}/resolve`,
      { resolution }
    );
    return res.data.data;
  },

  dismiss: async (id: number): Promise<Report> => {
    const res = await apiClient.put<ApiResponse<Report>>(
      `/api/reports/admin/${id}/dismiss`
    );
    return res.data.data;
  },
};
