import { Conversation, Message } from "@ekonsilio/types";
import { useEffect, useRef, useState } from "react";

interface UseConversationProps {
  initialConversation?: Conversation | null;
  userId: string;
  subscribeToConversation: (
    conversationId: string,
    callback: (message: Message) => void,
  ) => () => void;
  sendMessage: (
    conversationId: string,
    content: string,
    userId: string,
  ) => boolean;
  isConnected: boolean;
}

export const useConversation = ({
  initialConversation,
  userId,
  subscribeToConversation,
  sendMessage,
  isConnected,
}: UseConversationProps) => {
  const [conversation, setConversation] = useState<Conversation | null>(
    initialConversation || null,
  );
  const hasSubscribedRef = useRef(false);

  const handleNewMessage = (message: Message) => {
    if (!conversation) return;

    if (message.sender === "user" && message.userId === userId) {
      setConversation((prev) => {
        if (!prev) return null;
        const updatedMessages = prev.messages.filter(
          (msg) => !msg.id.startsWith("temp-"),
        );
        return {
          ...prev,
          messages: [...updatedMessages, message],
          lastMessage: message.content,
          lastMessageTime: message.timestamp,
        };
      });
      return;
    }

    setConversation((prev) => {
      if (!prev) return null;
      if (prev.messages.some((m) => m.id === message.id)) return prev;
      return {
        ...prev,
        messages: [...prev.messages, message],
        lastMessage: message.content,
        lastMessageTime: message.timestamp,
      };
    });
  };

  useEffect(() => {
    if (conversation?.id && !hasSubscribedRef.current) {
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
  }, [conversation?.id, subscribeToConversation]);

  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!conversation || !isConnected) return false;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content,
      sender: "user",
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      userId,
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

    return sendMessage(conversation.id, content, userId);
  };

  return {
    conversation,
    setConversation,
    handleSendMessage,
  };
};
