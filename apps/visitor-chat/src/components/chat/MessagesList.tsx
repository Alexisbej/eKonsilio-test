import { Conversation } from "@ekonsilio/types";
import { useEffect, useRef } from "react";
import { MessageItem } from "./MessageItem";

interface MessagesListProps {
  conversation: Conversation;
  visitorName: string;
}

export const MessagesList = ({
  conversation,
  visitorName,
}: MessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { messages } = conversation;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation.messages]);

  return (
    <div
      className="flex-1 p-4 overflow-y-auto bg-gray-50"
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
    >
      {!messages?.length ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-gray-400">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              visitorName={visitorName}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};
