import apiClient from "./client";
import type {
  ApiResponse,
  Auction,
  AuctionBid,
  AuctionStatus,
  BidRequest,
  CreateAuctionRequest,
  CursorPage,
  MyAuction,
} from "@/types";

export const auctionsApi = {
  list: async (params: {
    filter?: "active" | "ending_soon" | "upcoming" | "ended";
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<Auction>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Auction>>>(
      "/api/auctions",
      { params }
    );
    return res.data.data;
  },

  getById: async (id: number): Promise<Auction> => {
    const res = await apiClient.get<ApiResponse<Auction>>(
      `/api/auctions/${id}`
    );
    return res.data.data;
  },

  create: async (data: CreateAuctionRequest): Promise<Auction> => {
    const res = await apiClient.post<ApiResponse<Auction>>(
      "/api/auctions",
      data
    );
    return res.data.data;
  },

  bid: async (auctionId: number, data: BidRequest): Promise<Auction> => {
    const res = await apiClient.post<ApiResponse<Auction>>(
      `/api/auctions/${auctionId}/bid`,
      data
    );
    return res.data.data;
  },

  getBids: async (auctionId: number, params: { page?: number; size?: number } = {}): Promise<{ items: AuctionBid[]; totalElements: number }> => {
    const res = await apiClient.get<ApiResponse<{ items: AuctionBid[]; totalElements: number }>>(
      `/api/auctions/${auctionId}/bids`,
      { params: { size: 20, ...params } }
    );
    return res.data.data;
  },

  cancel: async (auctionId: number): Promise<void> => {
    await apiClient.put(`/api/auctions/${auctionId}/cancel`);
  },

  myAuctions: async (params: {
    status?: AuctionStatus;
    cursor?: string;
    size?: number;
  } = {}): Promise<CursorPage<MyAuction>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<MyAuction>>>(
      "/api/auctions/my",
      { params }
    );
    return res.data.data;
  },
};
