import { formatDate } from "@ekonsilio/chat-core";
import { Message } from "@ekonsilio/types";
import { Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface MessageItemProps {
  message: Message;
  userName: string;
}

export const MessageItem = ({ message, userName }: MessageItemProps) => {
  const isAgent = message.user?.role === "AGENT";

  return (
    <div
      className={`flex ${isAgent ? "justify-end" : "justify-start"} my-3 group`}
    >
      {!isAgent && (
        <Avatar className="h-8 w-8 mr-2 mt-1 ring-2 ring-white">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${
              message.user?.name || userName
            }`}
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            {(message.user?.name || userName)?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={` rounded-2xl py-2 px-4 ${
          isAgent
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
            : "bg-white border shadow-md"
        }`}
      >
        <div className="flex items-center gap-2 ">
          <span
            className={`text-xs font-medium ${isAgent ? "text-blue-100" : "text-slate-500"}`}
          >
            {!isAgent ? message.user?.name || userName : "You"}
          </span>
        </div>
        <p className="leading-relaxed">{message.content}</p>
        <div className="text-right  flex justify-end items-center gap-2">
          <span
            className={`text-xs ${isAgent ? "text-blue-100" : "text-slate-400"}`}
          >
            {formatDate(message.timestamp)}
          </span>
          {isAgent && (
            <span className="text-xs text-blue-100">
              <Clock className="h-3 w-3" />
            </span>
          )}
        </div>
      </div>

      {isAgent && (
        <Avatar className="h-8 w-8 ml-2 mt-1 ring-2 ring-white">
          <AvatarImage src="/agent-avatar.png" />
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
            AG
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
