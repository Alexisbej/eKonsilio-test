import { Message } from "@ekonsilio/types";
import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

export interface SocketConfig {
  userId?: string;
  authToken?: string;
  tokenKey?: string;
  apiUrl?: string;
  isAgent?: boolean;
}

export function useSocket(config: SocketConfig) {
  const {
    userId,
    authToken,
    tokenKey = "auth_token",
    apiUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001",
    isAgent = false,
  } = config;

  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const subscribedConversationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const socketInstance = io(apiUrl, {
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setConnected(true);

      // Rejoin any conversations we were previously subscribed to
      subscribedConversationsRef.current.forEach((conversationId) => {
        socketInstance.emit("join_conversation", { conversationId });
      });
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId, authToken, tokenKey, apiUrl, isAgent]);

  // Subscribe to messages for a specific conversation
  const subscribeToConversation = (
    conversationId: string,
    callback: (message: Message) => void,
  ) => {
    if (!socket) return () => {};

    // Only join the conversation if we haven't already
    if (!subscribedConversationsRef.current.has(conversationId)) {
      socket.emit("join_conversation", { conversationId });
      subscribedConversationsRef.current.add(conversationId);
    }

    // Ensure we have a unique event name for this conversation
    const eventName = `conversation:${conversationId}:message`;

    // Create a message handler that filters out duplicates
    const messageHandler = (message: Message) => {
      // For visitor chat, only process messages from agents or from other users
      if (
        isAgent ||
        message.sender === "agent" ||
        (message.userId && message.userId !== userId)
      ) {
        callback(message);
      }
    };

    socket.on(eventName, messageHandler);

    return () => {
      socket.off(eventName, messageHandler);
    };
  };

  // Subscribe to new conversation notifications
  const subscribeToNewConversations = (
    callback: (conversationId: string) => void,
  ) => {
    if (!socket) return () => {};

    const eventName = "new_conversation";
    socket.on(eventName, callback);

    return () => {
      socket.off(eventName, callback);
    };
  };

  // Send a message via socket
  const sendMessage = (
    conversationId: string,
    content: string,
    senderId: string,
  ): boolean => {
    if (!socket || !connected) return false;

    socket.emit("send_message", {
      conversationId,
      content,
      userId: senderId,
    });

    return true;
  };

  // Reconnect socket if needed
  const reconnect = () => {
    if (socket) {
      socket.connect();
    }
  };

  // Explicitly join a conversation room
  const joinConversation = (conversationId: string): boolean => {
    if (!socket || !connected) return false;

    if (!subscribedConversationsRef.current.has(conversationId)) {
      socket.emit("join_conversation", { conversationId });
      subscribedConversationsRef.current.add(conversationId);
    }
    return true;
  };

  // Explicitly leave a conversation room
  const leaveConversation = (conversationId: string): boolean => {
    if (!socket || !connected) return false;

    socket.emit("leave_conversation", { conversationId });
    subscribedConversationsRef.current.delete(conversationId);
    return true;
  };

  return {
    socket,
    connected,
    subscribeToConversation,
    subscribeToNewConversations,
    sendMessage,
    reconnect,
    joinConversation,
    leaveConversation,
  };
}
