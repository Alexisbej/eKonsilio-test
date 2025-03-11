import { Input } from "@/components/ui/input";

import { Conversation } from "@ekonsilio/types";
import { AlertCircle, Search } from "lucide-react";
import { ConversationItem } from "./ConversationItem";

interface ConversationsListProps {
  conversations: Conversation[];
  selectedConversationId?: string;
  searchQuery: string;
  searchError?: string | null;
  onSearchChange: (query: string) => void;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationsList = ({
  conversations,
  selectedConversationId,
  searchQuery,
  searchError,
  onSearchChange,
  onSelectConversation,
}: ConversationsListProps) => {
  return (
    <div className="w-80 border-r bg-white overflow-y-auto shadow-sm">
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search conversations..."
            className={`pl-9 pr-3 py-2 rounded-full border-slate-200 focus-visible:ring-blue-400 ${searchError ? "border-red-500" : ""}`}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-invalid={!!searchError}
          />
          {searchError && (
            <div className="text-red-500 text-xs mt-1 flex items-center">
              <AlertCircle className="h-3 w-3 mr-1" />
              {searchError}
            </div>
          )}
        </div>
      </div>

      {conversations.length === 0 ? (
        <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-64">
          <Search className="h-10 w-10 text-slate-300 mb-3" />
          <p>No conversations found</p>
        </div>
      ) : (
        <div className="divide-y">
          {conversations.map((conversation) => (
            <ConversationItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onSelect={() => onSelectConversation(conversation)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
