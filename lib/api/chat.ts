import apiClient from "./client";
import type {
  ApiResponse,
  ChatTagType,
  Conversation,
  CursorPage,
  Message,
  SendMessageResponse,
} from "@/types";

export interface SendMessageOptions {
  tagType?: ChatTagType;
  tagId?: number;
  tagTitle?: string;
  imageUrls?: string[];
}

// Normalize raw conversation item to our Conversation type,
// trying multiple field names the backend might use for the other user's ID.
function normalizeConversation(item: Record<string, unknown>): Conversation {
  const otherId =
    (item.otherId as number | undefined) ??
    (item.otherUserId as number | undefined) ??
    ((item.otherUser as Record<string, unknown> | undefined)?.id as number | undefined) ??
    (item.recipientId as number | undefined);

  return {
    id: item.id as number,
    otherId,
    otherUsername:
      (item.otherUsername as string | undefined) ??
      ((item.otherUser as Record<string, unknown> | undefined)?.username as string | undefined) ??
      "",
    otherAvatar:
      (item.otherAvatar as string | null | undefined) ??
      ((item.otherUser as Record<string, unknown> | undefined)?.avatarUrl as string | null | undefined) ??
      null,
    lastMessage: (item.lastMessage as string | null | undefined) ?? null,
    lastMessageAt: (item.lastMessageAt as string | null | undefined) ?? null,
    unread: (item.unread as number | undefined) ?? (item.unreadCount as number | undefined) ?? 0,
  };
}

export const chatApi = {
  send: async (
    receiverId: number,
    content: string,
    type = "TEXT",
    options?: SendMessageOptions
  ): Promise<SendMessageResponse> => {
    const res = await apiClient.post<ApiResponse<SendMessageResponse>>(
      `/api/chat/send/${receiverId}`,
      {
        content,
        type,
        ...(options?.tagType ? { tagType: options.tagType } : {}),
        ...(options?.tagId ? { tagId: options.tagId } : {}),
        ...(options?.tagTitle ? { tagTitle: options.tagTitle } : {}),
        ...(options?.imageUrls?.length ? { imageUrls: options.imageUrls } : {}),
      }
    );
    return res.data.data;
  },

  getConversations: async (
    cursor?: string,
    size = 20
  ): Promise<CursorPage<Conversation>> => {
    const res = await apiClient.get<ApiResponse<CursorPage<Record<string, unknown>>>>(
      "/api/chat/conversations",
      { params: { cursor, size } }
    );
    const raw = res.data.data;
    return {
      ...raw,
      items: (raw.items ?? []).map(normalizeConversation),
    };
  },

  getConversation: async (conversationId: number): Promise<Conversation> => {
    const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(
      `/api/chat/conversations/${conversationId}`
    );
    return normalizeConversation(res.data.data);
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
