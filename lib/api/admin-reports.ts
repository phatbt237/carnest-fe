import apiClient from "./client";
import type { ApiResponse } from "@/types";

// BE trả về array hoặc object { items: [...] } — chuẩn hoá thành array
function toArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const obj = raw as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items as T[];
    if (Array.isArray(obj.data)) return obj.data as T[];
  }
  return [];
}

export interface AdminOverview {
  totalUsers: number;
  newUsersToday: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  revenueToday: number;
  activeAuctions: number;
  pendingReports: number;
}

export interface RevenuePoint {
  period: string;
  revenue: number;
  orderCount: number;
}

export interface UserGrowthPoint {
  period: string;
  newUsers: number;
  totalUsers?: number;
}

export interface TopShopItem {
  shopId: number;
  shopName: string;
  slug: string;
  revenue: number;
  orderCount: number;
  logoUrl?: string | null;
}

export interface TopProductItem {
  productId: number;
  name: string;
  slug: string;
  count: number;
  revenue?: number;
  primaryImage?: string | null;
}

export interface TopBuyerItem {
  userId: number;
  username: string;
  fullName?: string;
  avatarUrl?: string | null;
  totalSpent: number;
  orderCount: number;
}

export interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  newThisMonth?: number;
}

export interface OrderStats {
  total: number;
  pending: number;
  confirmed?: number;
  shipping?: number;
  completed: number;
  cancelled: number;
  totalRevenue?: number;
}

export interface AuctionStats {
  total: number;
  active: number;
  upcoming?: number;
  ended: number;
  sold: number;
  cancelled?: number;
}

export interface ReviewStats {
  total: number;
  averageRating: number;
  fiveStars?: number;
  fourStars?: number;
  threeStars?: number;
  twoStars?: number;
  oneStar?: number;
}

export interface ViolationStats {
  total: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

export const adminReportsApi = {
  getOverview: async (): Promise<AdminOverview> => {
    const res = await apiClient.get<ApiResponse<AdminOverview>>(
      "/api/admin/reports/overview"
    );
    return res.data.data;
  },

  getRevenue: async (params?: {
    from?: string;
    to?: string;
    groupBy?: "day" | "week" | "month";
  }): Promise<RevenuePoint[]> => {
    const res = await apiClient.get<ApiResponse<unknown>>(
      "/api/admin/reports/revenue",
      { params }
    );
    return toArray<RevenuePoint>(res.data.data);
  },

  getUsers: async (params?: {
    from?: string;
    to?: string;
    groupBy?: "day" | "week" | "month";
  }): Promise<UserGrowthPoint[]> => {
    const res = await apiClient.get<ApiResponse<unknown>>(
      "/api/admin/reports/users",
      { params }
    );
    return toArray<UserGrowthPoint>(res.data.data);
  },

  getTopShops: async (limit = 10): Promise<TopShopItem[]> => {
    const res = await apiClient.get<ApiResponse<unknown>>(
      "/api/admin/reports/top-shops",
      { params: { limit } }
    );
    return toArray<TopShopItem>(res.data.data);
  },

  getTopProductsSold: async (limit = 10): Promise<TopProductItem[]> => {
    const res = await apiClient.get<ApiResponse<unknown>>(
      "/api/admin/reports/top-products/sold",
      { params: { limit } }
    );
    return toArray<TopProductItem>(res.data.data);
  },

  getTopProductsViewed: async (limit = 10): Promise<TopProductItem[]> => {
    const res = await apiClient.get<ApiResponse<unknown>>(
      "/api/admin/reports/top-products/viewed",
      { params: { limit } }
    );
    return toArray<TopProductItem>(res.data.data);
  },

  getTopBuyers: async (limit = 10): Promise<TopBuyerItem[]> => {
    const res = await apiClient.get<ApiResponse<unknown>>(
      "/api/admin/reports/top-buyers",
      { params: { limit } }
    );
    return toArray<TopBuyerItem>(res.data.data);
  },

  getProductStats: async (): Promise<ProductStats> => {
    const res = await apiClient.get<ApiResponse<ProductStats>>(
      "/api/admin/reports/products"
    );
    return res.data.data;
  },

  getOrderStats: async (): Promise<OrderStats> => {
    const res = await apiClient.get<ApiResponse<OrderStats>>(
      "/api/admin/reports/orders"
    );
    return res.data.data;
  },

  getAuctionStats: async (): Promise<AuctionStats> => {
    const res = await apiClient.get<ApiResponse<AuctionStats>>(
      "/api/admin/reports/auctions"
    );
    return res.data.data;
  },

  getReviewStats: async (): Promise<ReviewStats> => {
    const res = await apiClient.get<ApiResponse<ReviewStats>>(
      "/api/admin/reports/reviews"
    );
    return res.data.data;
  },

  getViolationStats: async (): Promise<ViolationStats> => {
    const res = await apiClient.get<ApiResponse<ViolationStats>>(
      "/api/admin/reports/violations"
    );
    return res.data.data;
  },
};
