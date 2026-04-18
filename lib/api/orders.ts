import apiClient from "./client";
import type {
  ApiResponse,
  CheckoutRequest,
  CursorPage,
  Order,
  OrderStatus,
  Wallet,
  WalletTransaction,
} from "@/types";

export const ordersApi = {
  checkout: async (data: CheckoutRequest): Promise<Order[]> => {
    const res = await apiClient.post<ApiResponse<Order[]>>(
      "/api/orders/checkout",
      data
    );
    return res.data.data;
  },

  pay: async (orderId: number): Promise<Order> => {
    const res = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/${orderId}/pay`
    );
    return res.data.data;
  },

  confirm: async (orderId: number): Promise<Order> => {
    const res = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/${orderId}/confirm`
    );
    return res.data.data;
  },

  ship: async (
    orderId: number,
    data: { trackingNumber: string; shippingMethod: string }
  ): Promise<Order> => {
    const res = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/${orderId}/ship`,
      data
    );
    return res.data.data;
  },

  delivered: async (orderId: number): Promise<Order> => {
    const res = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/${orderId}/delivered`
    );
    return res.data.data;
  },

  complete: async (orderId: number): Promise<Order> => {
    const res = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/${orderId}/complete`
    );
    return res.data.data;
  },

  cancel: async (orderId: number, cancelReason: string): Promise<Order> => {
    const res = await apiClient.put<ApiResponse<Order>>(
      `/api/orders/${orderId}/cancel`,
      { cancelReason }
    );
    return res.data.data;
  },

  getById: async (orderId: number): Promise<Order> => {
    const res = await apiClient.get<ApiResponse<Order>>(
      `/api/orders/${orderId}`
    );
    return res.data.data;
  },

  myOrders: async (params: {
    status?: OrderStatus;
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<Order>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Order>>>(
      "/api/orders/my",
      { params }
    );
    return res.data.data;
  },

  shopOrders: async (params: {
    status?: OrderStatus;
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<Order>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Order>>>(
      "/api/orders/shop",
      { params }
    );
    return res.data.data;
  },

  // Wallet
  getWallet: async (): Promise<Wallet> => {
    const res = await apiClient.get<ApiResponse<Wallet>>("/api/orders/wallet");
    return res.data.data;
  },

  deposit: async (amount: number): Promise<Wallet> => {
    const res = await apiClient.post<ApiResponse<Wallet>>(
      `/api/orders/wallet/deposit`,
      null,
      { params: { amount } }
    );
    return res.data.data;
  },

  walletTransactions: async (params: {
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<WalletTransaction>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<WalletTransaction>>>(
      "/api/orders/wallet/transactions",
      { params }
    );
    return res.data.data;
  },
};
