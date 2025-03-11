import { Conversation, VisitorInfo } from "@/types";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Create a visitor session first, then create a conversation
export const createConversation = async (
  visitorInfo: VisitorInfo,
): Promise<Conversation> => {
  try {
    // First create a visitor session to get a valid userId
    const visitorSession = await api.post("/auth/visitor", {
      tenantId:
        process.env.DEFAULT_TENANT_ID || "b5f88040-a8bf-4b1e-99c2-1650c4fcbf3f",
    });

    const userId = visitorSession.data.userId;

    // Then create the conversation with the valid userId
    const response = await api.post("/conversations", {
      userId: userId, // Use the userId from the visitor session
      tenantId:
        process.env.DEFAULT_TENANT_ID || "b5f88040-a8bf-4b1e-99c2-1650c4fcbf3f",
      title: `Support for ${visitorInfo.name}`,
      metadata: {
        visitorInfo,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw new Error("Failed to create conversation");
  }
};

export const getConversation = async (
  conversationId: string,
): Promise<Conversation> => {
  try {
    const response = await api.get(`/conversations/${conversationId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw new Error("Failed to fetch conversation");
  }
};

export const getVisitorConversations = async (
  visitorId: string,
): Promise<Conversation[]> => {
  try {
    const response = await api.get(`/conversations/visitor/${visitorId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching visitor conversations:", error);
    throw new Error("Failed to fetch visitor conversations");
  }
};
