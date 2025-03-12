import { NotificationBadge } from "@/components/ui/notification-badge";
import { TimeAgo } from "@/components/ui/time-ago";
import { cn } from "@ekonsilio/chat-core";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { ConversationStatusBadge } from "./ConversationStatusBadge";

interface ConversationListItemProps {
  id: string;
  visitorName: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  status: "PENDING" | "CLOSED" | "ACTIVE";
  unreadCount: number;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  visitorName,
  title,
  lastMessage,
  lastMessageTime,
  status,
  unreadCount,
  isSelected,
  onClick,
}: ConversationListItemProps) {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer flex-col gap-1 rounded-md border p-3 transition-colors",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-transparent hover:bg-accent",
      )}
      onClick={onClick}
      aria-selected={isSelected}
      role="option"
    >
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 ring-2 ring-white">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${visitorName}`}
          />
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-purple-600 text-white">
            {visitorName?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-800 truncate">{title}</h3>

            <TimeAgo
              date={lastMessageTime}
              className="text-xs text-muted-foreground whitespace-nowrap ml-2"
            />
          </div>

          <p className="line-clamp-1 text-sm text-muted-foreground mt-1">
            {lastMessage}
          </p>

          <div className="mt-2 flex items-center justify-between">
            <ConversationStatusBadge status={status} />
            {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
          </div>
        </div>
      </div>
    </div>
  );
}
