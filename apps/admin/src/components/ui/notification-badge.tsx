import { cn } from "@ekonsilio/chat-core";
import { Badge } from "./badge";

interface NotificationBadgeProps {
  count: number;
  maxCount?: number;
  className?: string;
}

export function NotificationBadge({
  count,
  maxCount = 99,
  className,
}: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  return (
    <Badge
      variant="destructive"
      className={cn(
        "absolute -top-1 -right-1 min-w-[1.25rem] h-5 flex items-center justify-center rounded-full px-1 text-xs",
        className,
      )}
    >
      {displayCount}
    </Badge>
  );
}
