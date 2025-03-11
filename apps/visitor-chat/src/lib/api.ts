import { CONFIG } from "@/config";
import { Conversation, VisitorInfo } from "@ekonsilio/types";
import axios from "axios";

const api = axios.create({
  baseURL: CONFIG.API.BASE_URL,
  withCredentials: true,
});

export const createConversation = async (
  visitorInfo: VisitorInfo,
): Promise<Conversation> => {
  try {
    const visitorSession = await api.post("/auth/visitor", {
      tenantId: CONFIG.API.DEFAULT_TENANT_ID,
    });

    const userId = visitorSession.data.userId;

    const response = await api.post("/conversations", {
      userId: userId,
      tenantId: CONFIG.API.DEFAULT_TENANT_ID,
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
