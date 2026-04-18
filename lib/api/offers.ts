import apiClient from "./client";
import type {
  ApiResponse,
  CreateOfferRequest,
  CursorPage,
  Offer,
} from "@/types";

export const offersApi = {
  create: async (data: CreateOfferRequest): Promise<Offer> => {
    const res = await apiClient.post<ApiResponse<Offer>>("/api/offers", data);
    return res.data.data;
  },

  accept: async (offerId: number): Promise<Offer> => {
    const res = await apiClient.put<ApiResponse<Offer>>(
      `/api/offers/${offerId}/accept`
    );
    return res.data.data;
  },

  reject: async (offerId: number): Promise<Offer> => {
    const res = await apiClient.put<ApiResponse<Offer>>(
      `/api/offers/${offerId}/reject`
    );
    return res.data.data;
  },

  counter: async (offerId: number, counterPrice: number): Promise<Offer> => {
    const res = await apiClient.put<ApiResponse<Offer>>(
      `/api/offers/${offerId}/counter`,
      { counterPrice }
    );
    return res.data.data;
  },

  acceptCounter: async (offerId: number): Promise<Offer> => {
    const res = await apiClient.put<ApiResponse<Offer>>(
      `/api/offers/${offerId}/accept-counter`
    );
    return res.data.data;
  },

  cancel: async (offerId: number): Promise<Offer> => {
    const res = await apiClient.put<ApiResponse<Offer>>(
      `/api/offers/${offerId}/cancel`
    );
    return res.data.data;
  },

  myOffers: async (params: {
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<Offer>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Offer>>>(
      "/api/offers/my",
      { params }
    );
    return res.data.data;
  },

  shopOffers: async (params: {
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<Offer>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Offer>>>(
      "/api/offers/shop",
      { params }
    );
    return res.data.data;
  },
};
