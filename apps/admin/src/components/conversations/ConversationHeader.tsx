import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Conversation } from "@ekonsilio/types";

interface ConversationHeaderProps {
  conversation: Conversation;
  onResolve: () => void;
}

export const ConversationHeader = ({
  conversation,
  onResolve,
}: ConversationHeaderProps) => {
  return (
    <div className="p-4 border-b bg-white flex justify-between items-center shadow-sm">
      <div className="flex items-center">
        <Avatar className="h-12 w-12 mr-4 ring-2 ring-blue-50">
          <AvatarImage
            src={`https://api.dicebear.com/7.x/initials/svg?seed=${conversation.user.name}`}
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white">
            {conversation.user.name?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="font-semibold text-lg">{conversation.user.name}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{conversation.title}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant={
            conversation.status === "ACTIVE"
              ? "default"
              : conversation.status === "PENDING"
                ? "secondary"
                : "outline"
          }
          className="px-3 py-1 uppercase text-xs font-medium tracking-wider"
        >
          {conversation.status.toLowerCase()}
        </Badge>
        {conversation.status !== "CLOSED" && (
          <Button
            variant="outline"
            size="sm"
            onClick={onResolve}
            className="border-slate-200 hover:bg-slate-50 hover:text-blue-600 transition-colors"
          >
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
};
