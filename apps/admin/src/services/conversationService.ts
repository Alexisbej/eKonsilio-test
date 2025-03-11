import { Conversation, Message } from "@ekonsilio/types";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const getAuthConfig = () => ({
  withCredentials: true,
});

export const fetchAgentProfile = async () => {
  const response = await axios.get(`${API_URL}/auth/profile`, getAuthConfig());
  return response.data;
};

export const fetchConversationsList = async (): Promise<Conversation[]> => {
  const agent = await fetchAgentProfile();
  if (!agent?.id) {
    throw new Error("Agent ID not found. Please log in again.");
  }

  const { data } = await axios.get(
    `${API_URL}/conversations/agent/${agent.id}/all`,
    getAuthConfig(),
  );

  return data.conversations.map((conv: Conversation) => {
    const lastMessage =
      conv.messages && conv.messages.length > 0 ? conv.messages[0] : null;

    return {
      id: conv.id,
      title: conv.title || "New Conversation",
      status: conv.status,
      lastMessage: lastMessage?.content || "No messages yet",
      lastMessageTime: lastMessage
        ? new Date(lastMessage.createdAt)
        : new Date(conv.updatedAt),
      updatedAt: conv.updatedAt,
      unreadCount: 0, // This would need to be calculated from the backend
      user: conv.user,
      messages: [],
    };
  });
};

export const fetchConversationDetails = async (conversationId: string) => {
  const response = await axios.get(
    `${API_URL}/conversations/${conversationId}`,
    getAuthConfig(),
  );

  const transformedMessages = response.data.messages.map((msg: Message) => ({
    id: msg.id,
    content: msg.content,
    sender: msg.userId === response.data.user.id ? "user" : "agent",
    timestamp: new Date(msg.createdAt),
    createdAt: msg.createdAt,
    userId: msg.userId,
    user: msg.user,
  }));

  return {
    ...response.data,
    messages: transformedMessages,
    lastMessage:
      transformedMessages.length > 0
        ? transformedMessages[transformedMessages.length - 1].content
        : "No messages",
    lastMessageTime:
      transformedMessages.length > 0
        ? new Date(
            transformedMessages[transformedMessages.length - 1].createdAt,
          )
        : new Date(response.data.updatedAt),
  };
};

export const resolveConversation = async (conversationId: string) => {
  await axios.put(
    `${API_URL}/conversations/${conversationId}/close`,
    {},
    getAuthConfig(),
  );
  return conversationId;
};
