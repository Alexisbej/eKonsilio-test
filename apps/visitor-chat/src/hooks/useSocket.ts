"use client";

import { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";

export interface Message {
  id: string;
  content: string;
  sender: "user" | "agent";
  timestamp: Date;
  createdAt: string;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export function useSocket(visitorId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  // Use a ref to track which conversations we're already subscribed to
  const subscribedConversationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const socketInstance = io(
      process.env.NEXT_PUBLIC_WS_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3001",
      {
        withCredentials: true,
      },
    );

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
  }, [visitorId]); // Only recreate socket when visitorId changes

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
      // Only process messages from agents or from other users
      // This prevents duplicate rendering of our own messages
      if (
        message.sender === "agent" ||
        (message.userId && message.userId !== visitorId)
      ) {
        callback(message);
      }
    };

    socket.on(eventName, messageHandler);

    return () => {
      socket.off(eventName, messageHandler);
      // Don't leave the conversation when unsubscribing to avoid join/leave spam
      // Only remove from tracking set when explicitly leaving
      // subscribedConversationsRef.current.delete(conversationId);
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
    userId: string,
  ): boolean => {
    if (!socket || !connected) return false;

    socket.emit("send_message", {
      conversationId,
      content,
      userId,
    });

    return true;
  };

  // Reconnect socket if needed (useful for retries)
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
