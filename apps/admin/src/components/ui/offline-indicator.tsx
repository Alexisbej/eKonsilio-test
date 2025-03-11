import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@ekonsilio/chat-core";
import { WifiOff } from "lucide-react";

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 flex items-center gap-2 rounded-md bg-destructive px-4 py-2 text-white shadow-lg",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">You are offline</span>
    </div>
  );
}
