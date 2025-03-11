import { format, formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";

interface TimeAgoProps {
  date: Date | string | number;
  className?: string;
  updateInterval?: number; // in milliseconds
  showFullOnHover?: boolean;
}

export function TimeAgo({
  date,
  className = "",
  updateInterval = 60000, // 1 minute
  showFullOnHover = true,
}: TimeAgoProps) {
  const [timeAgo, setTimeAgo] = useState<string>("");
  const dateObj = date instanceof Date ? date : new Date(date);

  useEffect(() => {
    const updateTimeAgo = () => {
      setTimeAgo(formatDistanceToNow(dateObj, { addSuffix: true }));
    };

    updateTimeAgo();

    const intervalId = setInterval(updateTimeAgo, updateInterval);

    return () => clearInterval(intervalId);
  }, [dateObj, updateInterval]);

  const fullDate = format(dateObj, "PPpp"); // e.g., "Apr 29, 2023, 1:15 PM"

  return (
    <time
      dateTime={dateObj.toISOString()}
      className={className}
      title={showFullOnHover ? fullDate : undefined}
    >
      {timeAgo}
    </time>
  );
}
