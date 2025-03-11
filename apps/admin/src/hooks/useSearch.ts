import { validateSearch } from "@/lib/validations";
import { Conversation } from "@ekonsilio/types";
import { useMemo, useState } from "react";

export const useSearch = (conversations: Conversation[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearchChange = (query: string) => {
    const result = validateSearch(query);
    if (result.success) {
      setSearchQuery(result.data);
      setSearchError(null);
    } else {
      setSearchError(result.error.errors[0]?.message || "Invalid search query");

      setSearchQuery(query);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(
      (conv) =>
        conv.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [conversations, searchQuery]);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    searchError,
    filteredConversations,
  };
};
