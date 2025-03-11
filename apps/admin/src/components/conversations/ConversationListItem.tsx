import { NotificationBadge } from "@/components/ui/notification-badge";
import { TimeAgo } from "@/components/ui/time-ago";
import { cn } from "@ekonsilio/chat-core";
import { ConversationStatusBadge } from "./ConversationStatusBadge";

interface ConversationListItemProps {
  id: string;
  visitorName: string;
  lastMessage: string;
  lastMessageTime: Date;
  status: "active" | "resolved";
  unreadCount: number;
  isSelected: boolean;
  onClick: () => void;
}

export function ConversationListItem({
  visitorName,
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
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{visitorName}</h3>
        <TimeAgo
          date={lastMessageTime}
          className="text-xs text-muted-foreground"
        />
      </div>

      <p className="line-clamp-1 text-sm text-muted-foreground">
        {lastMessage}
      </p>

      <div className="mt-1 flex items-center justify-between">
        <ConversationStatusBadge status={status} />

        {unreadCount > 0 && <NotificationBadge count={unreadCount} />}
      </div>
    </div>
  );
}
