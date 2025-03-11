import { Conversation } from "@ekonsilio/types";
import { useMemo, useState } from "react";

export const useSearch = (conversations: Conversation[]) => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (conv) =>
        conv.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [conversations, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredConversations,
  };
};
