import { MessageSquare } from "lucide-react";
import React from "react";

interface ConversationEmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export function ConversationEmptyState({
  title = "No conversations selected",
  description = "Select a conversation from the list or wait for a new visitor to start chatting.",
  icon = <MessageSquare className="h-12 w-12 text-muted-foreground/50" />,
}: ConversationEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
        {icon}
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
