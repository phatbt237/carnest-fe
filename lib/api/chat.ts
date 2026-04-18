import apiClient from "./client";
import type {
  ApiResponse,
  Conversation,
  CursorPage,
  Message,
  SendMessageResponse,
} from "@/types";

export const chatApi = {
  send: async (receiverId: number, content: string): Promise<SendMessageResponse> => {
    const res = await apiClient.post<ApiResponse<SendMessageResponse>>(
      `/api/chat/send/${receiverId}`,
      { content }
    );
    return res.data.data;
  },

  getConversations: async (
    cursor?: string,
    size = 20
  ): Promise<CursorPage<Conversation>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Conversation>>>(
      "/api/chat/conversations",
      { params: { cursor, size } }
    );
    return res.data.data;
  },

  getMessages: async (
    conversationId: number,
    cursor?: string,
    size = 30
  ): Promise<CursorPage<Message>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Message>>>(
      `/api/chat/conversations/${conversationId}/messages`,
      { params: { cursor, size } }
    );
    return res.data.data;
  },

  markRead: async (conversationId: number): Promise<void> => {
    await apiClient.put(`/api/chat/conversations/${conversationId}/read`);
  },
};
