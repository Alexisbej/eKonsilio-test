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

interface SocketHook {
  socket: Socket | null;
  connected: boolean;
  subscribeToConversation: (
    conversationId: string,
    callback: (message: Message) => void,
  ) => () => void;
  subscribeToNewConversations: (
    callback: (conversationId: string) => void,
  ) => () => void;
  sendMessage: (
    conversationId: string,
    content: string,
    senderId: string,
  ) => boolean;
  reconnect: () => void;
  joinConversation: (conversationId: string) => boolean;
  leaveConversation: (conversationId: string) => boolean;
}
export function useSocket(config: SocketConfig): SocketHook {
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

  const subscribeToConversation = (
    conversationId: string,
    callback: (message: Message) => void,
  ) => {
    if (!socket) return () => {};

    if (!subscribedConversationsRef.current.has(conversationId)) {
      socket.emit("join_conversation", { conversationId });
      subscribedConversationsRef.current.add(conversationId);
    }

    const eventName = `conversation:${conversationId}:message`;

    const messageHandler = (message: Message) => {
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

  const reconnect = () => {
    if (socket) {
      socket.connect();
    }
  };

  const joinConversation = (conversationId: string): boolean => {
    if (!socket || !connected) return false;

    if (!subscribedConversationsRef.current.has(conversationId)) {
      socket.emit("join_conversation", { conversationId });
      subscribedConversationsRef.current.add(conversationId);
    }
    return true;
  };

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
