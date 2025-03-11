import { formatDate } from "@ekonsilio/chat-core";
import { Conversation } from "@ekonsilio/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}

export const ConversationItem = ({
  conversation,
  isSelected,
  onSelect,
}: ConversationItemProps) => {
  return (
    <div
      className={`p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
        isSelected ? "bg-blue-50 border-l-4 border-blue-500" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-white">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.user.name}`}
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            {conversation.user.name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium text-slate-800 truncate">
              {conversation.user.name}
            </h3>
            <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
              {conversation.lastMessageTime &&
                formatDate(conversation.lastMessageTime)}
            </span>
          </div>
          <p className="text-sm text-slate-500 truncate">
            {conversation.title}
          </p>
          <div className="flex justify-between items-center mt-2">
            <Badge
              variant={
                conversation.status === "ACTIVE"
                  ? "default"
                  : conversation.status === "PENDING"
                    ? "secondary"
                    : "outline"
              }
              className="text-xs px-2 py-0"
            >
              {conversation.status.toLowerCase()}
            </Badge>
            {conversation.unreadCount && conversation.unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {conversation.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
