import { createConversation } from "@/lib/api";
import { Conversation, Message, VisitorInfo } from "@/types";
import { useMessageInput } from "@ekonsilio/chat-core";
import { useSocket } from "@ekonsilio/chat-socket";
import { useEffect, useRef, useState } from "react";

interface UseChatWidgetReturn {
  visitorInfo: VisitorInfo | null;
  visitorFormData: VisitorInfo;
  conversation: Conversation | null;
  isStartingChat: boolean;
  formSubmitted: boolean;
  newMessage: string;
  setNewMessage: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  sendMessageHandler: (content: string) => Promise<boolean>;
  handleVisitorInfoChange: (field: keyof VisitorInfo, value: string) => void;
  handleFormSubmit: () => Promise<void>;
}

export const useChatWidget = (
  initialConversation?: Conversation,
): UseChatWidgetReturn => {
  // Visitor info state
  const [visitorInfo, setVisitorInfo] = useState<VisitorInfo | null>(null);
  const [visitorFormData, setVisitorFormData] = useState<VisitorInfo>({
    name: "",
    email: "",
  });

  // Conversation state
  const [conversation, setConversation] = useState<Conversation | null>(
    initialConversation || null,
  );
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);

  // Persist visitorId across renders
  const visitorIdRef = useRef<string>(
    "visitor-" + Math.random().toString(36).substring(2, 9),
  );
  // Prefer visitor email as id if available
  const visitorId = visitorInfo?.email || visitorIdRef.current;

  // Initialize socket connection using the visitor ID
  const { connected, sendMessage, subscribeToConversation } = useSocket({
    userId: visitorId,
    isAgent: false,
    tokenKey: "visitor_token",
  });

  // Track whether we've subscribed to the conversation messages already
  const hasSubscribedRef = useRef(false);

  // Handle incoming messages from socket
  const handleNewMessage = (message: Message) => {
    if (!conversation) return;

    // Filter out messages sent by the visitor (to avoid duplicates)
    if (message.user?.role === "VISITOR") return;

    // If the message matches our own (from a temp message), replace it
    if (message.sender === "user" && message.userId === visitorId) {
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

    // Otherwise, add the new message if it doesn't exist yet
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

  // Subscribe to conversation messages once a conversation exists
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

  // Handle sending a message (with an optimistic update)
  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!conversation || !connected) return false;

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

    return sendMessage(conversation.id, content, visitorId);
  };

  // Use message input hook (handles text input state and key events)
  const {
    newMessage,
    setNewMessage,
    handleSendMessage: sendMessageHandler,
    handleKeyDown,
  } = useMessageInput(handleSendMessage);

  // Update visitor form data
  const handleVisitorInfoChange = (field: keyof VisitorInfo, value: string) => {
    setVisitorFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle visitor form submission and conversation creation
  const handleFormSubmit = async () => {
    if (!visitorFormData.name || !visitorFormData.email) return;

    setVisitorInfo(visitorFormData);
    setFormSubmitted(true);

    try {
      setIsStartingChat(true);
      const newConversation = await createConversation(visitorFormData);
      setConversation(newConversation);
    } catch (error) {
      console.error("Failed to start conversation:", error);
    } finally {
      setIsStartingChat(false);
    }
  };

  return {
    visitorInfo,
    visitorFormData,
    conversation,
    isStartingChat,
    formSubmitted,
    newMessage,
    setNewMessage,
    handleKeyDown,
    sendMessageHandler,
    handleVisitorInfoChange,
    handleFormSubmit,
  };
};
