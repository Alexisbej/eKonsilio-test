import { useDebounce } from "@/hooks/useDebounce";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { Conversation, DateRange } from "@ekonsilio/types";
import React, { useEffect, useState } from "react";
import { ConversationEmptyState } from "./ConversationEmptyState";
import { ConversationFilter } from "./ConversationFilter";
import { ConversationListItem } from "./ConversationListItem";
import { ConversationSkeleton } from "./ConversationSkeleton";

interface ConversationListProps {
  conversations: Conversation[];
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  selectedConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  hasMore,
  loadMore,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const [search, setSearch] = useState("");

  const [dateRange, setDateRange] = useState<DateRange>({
    from: null,
    to: null,
  });

  const handleDateRangeChange = (range: DateRange) => {
    setDateRange(range);
  };
  const [status, setStatus] = useState<"all" | "PENDING" | "RESOLVED">("all");

  const debouncedSearch = useDebounce(search, 300);

  const filteredConversations = React.useMemo(() => {
    return conversations.filter((conversation) => {
      const matchesSearch = debouncedSearch
        ? conversation.user.name
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase()) ||
          conversation.lastMessage
            ?.toLowerCase()
            .includes(debouncedSearch.toLowerCase())
        : true;

      const matchesStatus =
        status === "all" ? true : conversation.status === status;

      const matchesDateRange = true;

      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [conversations, debouncedSearch, status]);

  const { entry, setRef } = useIntersectionObserver({
    threshold: 0.5,
    enabled: hasMore && !isLoading,
  });

  useEffect(() => {
    if (entry?.isIntersecting && hasMore) {
      loadMore();
    }
  }, [entry?.isIntersecting, hasMore, loadMore]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <ConversationFilter
          search={search}
          onSearchChange={setSearch}
          dateRange={dateRange}
          onDateRangeChange={handleDateRangeChange}
          status={status}
          onStatusChange={setStatus}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading && filteredConversations.length === 0 ? (
          <ConversationSkeleton />
        ) : filteredConversations.length === 0 ? (
          <ConversationEmptyState
            title="No conversations found"
            description="There are no conversations matching your filters."
          />
        ) : (
          <div className="space-y-2" role="listbox">
            {filteredConversations.map((conversation) => (
              <ConversationListItem
                key={conversation.id}
                id={conversation.id}
                visitorName={conversation.user.name || "Anonymous"}
                lastMessage={conversation.lastMessage || "No messages yet"}
                lastMessageTime={conversation.lastMessageTime || new Date()}
                status={conversation.status as "active" | "resolved"}
                unreadCount={conversation.unreadCount || 0}
                isSelected={selectedConversationId === conversation.id}
                onClick={() => onSelectConversation(conversation.id)}
              />
            ))}

            {hasMore && (
              <div ref={setRef} className="py-2">
                {isLoading && <ConversationSkeleton />}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
