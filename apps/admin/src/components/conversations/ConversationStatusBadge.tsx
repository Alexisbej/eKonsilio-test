import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

interface ConversationStatusBadgeProps {
  status: "PENDING" | "CLOSED" | "ACTIVE";
  className?: string;
}

export function ConversationStatusBadge({
  status,
  className = "",
}: ConversationStatusBadgeProps) {
  if (status === "CLOSED") {
    return (
      <Badge variant="secondary" className={className}>
        <CheckCircle className="mr-1 h-3 w-3" />
        Resolved
      </Badge>
    );
  }

  return (
    <Badge variant="default" className={className}>
      <Clock className="mr-1 h-3 w-3" />
      Active
    </Badge>
  );
}
