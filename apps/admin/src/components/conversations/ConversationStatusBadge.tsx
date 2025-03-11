import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock } from "lucide-react";

interface ConversationStatusBadgeProps {
  status: "active" | "resolved";
  className?: string;
}

export function ConversationStatusBadge({
  status,
  className = "",
}: ConversationStatusBadgeProps) {
  if (status === "resolved") {
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
