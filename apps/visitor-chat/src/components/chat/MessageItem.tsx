import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  formatDate,
} from "@ekonsilio/chat-core";
import { Message } from "@ekonsilio/types";

interface MessageItemProps {
  message: Message;
  visitorName: string;
}

export const MessageItem = ({ message, visitorName }: MessageItemProps) => {
  const isUser = message.sender === "user";

  return (
    <div className="flex flex-col space-y-4">
      <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
        {!isUser && (
          <div className="mr-2 flex-shrink-0 mt-8">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=Agent`}
              />
              <AvatarFallback>AG</AvatarFallback>
            </Avatar>
          </div>
        )}

        <div className="max-w-[75%]">
          <span className="block text-xs text-gray-500 mb-1">
            {isUser ? visitorName : "Jeremy Smith"}
          </span>

          <div
            className={`rounded-2xl px-4 py-2 ${
              isUser ? "bg-gray-200 text-gray-800" : "bg-blue-500 text-white"
            }`}
          >
            <p className="text-sm">{message.content}</p>
          </div>

          <span className="block text-xs text-gray-400 mt-1 text-right">
            {formatDate(message.timestamp)}
          </span>
        </div>

        {isUser && (
          <div className="ml-2 flex-shrink-0 mt-6">
            <Avatar className="h-8 w-8">
              <AvatarImage
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${visitorName}`}
              />
              <AvatarFallback>{visitorName.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  );
};
