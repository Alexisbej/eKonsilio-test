import { useState } from "react";

interface UseMessageInputReturn {
  newMessage: string;
  setNewMessage: (value: string) => void;
  handleSendMessage: (content: string) => Promise<boolean>;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

export const useMessageInput = (
  onSend: (content: string) => Promise<boolean>,
): UseMessageInputReturn => {
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = async (content: string): Promise<boolean> => {
    if (!content.trim()) return false;

    const success = await onSend(content.trim());
    if (success) {
      setNewMessage("");
    }
    return success;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(newMessage);
    }
  };

  return {
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleKeyDown,
  };
};
