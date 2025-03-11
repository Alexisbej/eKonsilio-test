import { cn } from "@ekonsilio/chat-core";

interface MessageSkeletonProps {
  align?: "left" | "right";
  className?: string;
}

export function MessageSkeleton({
  align = "left",
  className,
}: MessageSkeletonProps) {
  return (
    <div
      className={cn(
        "flex animate-pulse",
        align === "right" ? "justify-end" : "justify-start",
        className,
      )}
    >
      <div
        className={cn(
          "max-w-[70%] rounded-lg p-3",
          align === "right" ? "bg-blue-500/30" : "bg-gray-200 dark:bg-gray-800",
        )}
      >
        <div className="h-4 w-24 rounded bg-gray-300 dark:bg-gray-700" />
        <div className="mt-2 h-3 w-48 rounded bg-gray-300 dark:bg-gray-700" />
        <div className="mt-1 h-3 w-32 rounded bg-gray-300 dark:bg-gray-700" />
      </div>
    </div>
  );
}
