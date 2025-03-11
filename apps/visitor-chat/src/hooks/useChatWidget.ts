import { CONFIG } from "@/config";
import { createConversation } from "@/lib/api";
import { useMessageInput } from "@ekonsilio/chat-core";
import { useSocket } from "@ekonsilio/chat-socket";
import { Conversation, Message, VisitorInfo } from "@ekonsilio/types";
import { useEffect, useRef, useState } from "react";

interface UseChatWidgetReturn {
  visitorInfo: VisitorInfo | null;
  visitorFormData: VisitorInfo;
  conversation: Conversation | null;
  isLoading: boolean;
  formSubmitted: boolean;
  newMessage: string;
  setNewMessage: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  sendMessageHandler: (content: string) => Promise<boolean>;
  handleVisitorInfoChange: (field: keyof VisitorInfo, value: string) => void;
  handleFormSubmit: () => Promise<void>;
  error: string | null;
  resetError: () => void;
}

export const useChatWidget = (
  initialConversation?: Conversation,
): UseChatWidgetReturn => {
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [visitorFormData, setVisitorFormData] = useState<VisitorInfo>({
    name: "",
    email: "",
  });

  const [conversation, setConversation] = useState<Conversation | null>(
    initialConversation || null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const visitorIdRef = useRef<string>(
    "visitor-" + Math.random().toString(36).substring(2, 9),
  );

  const visitorId = visitorInfo?.email || visitorIdRef.current;

  const { connected, sendMessage, subscribeToConversation } = useSocket({
    userId: visitorId,
    isAgent: false,
    tokenKey: "visitor_token",
  });

  const hasSubscribedRef = useRef(false);

  const resetError = () => setError(null);

  const handleNewMessage = (message: Message) => {
    if (!conversation) return;

    console.log("new message", message);

    if (message.user?.role === "VISITOR") return;

    setConversation((prev: Conversation | null) => {
      if (!prev) return null;

      if (prev.messages?.some((m) => m.id === message.id)) return prev;

      if (message.sender === "user" && message.userId === visitorId) {
        const updatedMessages = prev.messages?.filter(
          (msg) => !msg.id.startsWith("temp-"),
        );
        return {
          ...prev,
          messages: [...updatedMessages, message],
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
        };
      }

      return {
        ...prev,
        messages: Array.isArray(prev.messages)
          ? [...prev.messages, message]
          : [message],
        lastMessage: message.content,
        lastMessageTime: message.timestamp,
      };
    });
  };

  useEffect(() => {
    if (conversation?.id && !hasSubscribedRef.current && connected) {
      hasSubscribedRef.current = true;
      const unsubscribe = subscribeToConversation(
        conversation.id,
        handleNewMessage,
      );
      return () => {
        hasSubscribedRef.current = false;
        unsubscribe();
      };
    }
  }, [conversation?.id, subscribeToConversation, connected]);

  useEffect(() => {
    if (!connected && conversation) {
      setError("Lost connection to chat server. Please refresh the page.");
    } else if (
      connected &&
      error === "Lost connection to chat server. Please refresh the page."
    ) {
      setError(null);
    }
  }, [connected, conversation, error]);

  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!conversation || !connected) {
      setError("Cannot send message: not connected to chat server");
      return false;
    }

    if (!content.trim() || content.length > CONFIG.CHAT.MAX_MESSAGE_LENGTH) {
      return false;
    }

    setIsLoading(true);

    try {
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        content,
        sender: "user",
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        userId: visitorId,
      };

      setConversation((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          messages: Array.isArray(prev.messages)
            ? [...prev.messages, tempMessage]
            : [tempMessage],
          lastMessage: content,
          lastMessageTime: new Date(),
        };
      });

      const success = await sendMessage(conversation.id, content, visitorId);

      if (!success) {
        throw new Error("Failed to send message");
      }

      return success;
    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const {
    newMessage,
    setNewMessage,
    handleSendMessage: sendMessageHandler,
    handleKeyDown,
  } = useMessageInput(handleSendMessage);

  const handleVisitorInfoChange = (field: keyof VisitorInfo, value: string) => {
    if (field === "email" && value.length > 100) return;
    if (field === "name" && value.length > 50) return;

    setVisitorFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFormSubmit = async () => {
    if (!visitorFormData.name || !visitorFormData.email) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(visitorFormData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    setVisitorInfo(visitorFormData);
    setFormSubmitted(true);
    setError(null);

    try {
      setIsLoading(true);
      const newConversation = await createConversation(visitorFormData);
      setConversation(newConversation);
    } catch (err) {
      console.error("Failed to start conversation:", err);
      setError("Failed to start conversation. Please try again.");
      setFormSubmitted(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    visitorInfo,
    visitorFormData,
    conversation,
    isLoading,
    formSubmitted,
    newMessage,
    setNewMessage,
    handleKeyDown,
    sendMessageHandler,
    handleVisitorInfoChange,
    handleFormSubmit,
    error,
    resetError,
  };
};
