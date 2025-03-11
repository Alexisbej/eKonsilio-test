"use client";

import { ConversationNotificationHandler } from "@/components/ConversationNotificationHandler";
import { ConversationEmptyState } from "@/components/conversations/ConversationEmptyState";
import { ConversationHeader } from "@/components/conversations/ConversationHeader";
import { ConversationsList } from "@/components/conversations/ConversationsList";
import { MessageInput } from "@/components/conversations/MessageInput";
import { MessagesList } from "@/components/conversations/MessagesList";
import { ResolveConfirmationDialog } from "@/components/conversations/ResolveConfirmationDialog";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/ui/loading-state";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { useConversations } from "@/hooks/useConversations";
import { useResolveConfirmation } from "@/hooks/useResolveConfirmation";
import { useSearch } from "@/hooks/useSearch";
import { useMessageInput } from "@ekonsilio/chat-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { MessageSquare } from "lucide-react";
import { useEffect } from "react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function ConversationsPageWrapper() {
  return (
    <QueryClientProvider client={queryClient}>
      <ConversationsPageContent />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

function ConversationsPageContent() {
  const {
    conversations,
    selectedConversation,
    loading,
    error,
    fetchConversations,
    handleSelectConversation,
    handleResolveConversation,
    handleSendMessage,
    setupMessageListener,
    setupNewConversationListener,
  } = useConversations();

  const { searchQuery, setSearchQuery, searchError, filteredConversations } =
    useSearch(conversations);

  const {
    showResolveConfirmation,
    setShowResolveConfirmation,
    handleShowResolveConfirmation,
    handleCancelResolve,
    handleConfirmResolve,
    isResolving,
    error: resolveError,
  } = useResolveConfirmation(handleResolveConversation);

  const {
    newMessage,
    setNewMessage,
    handleSendMessage: sendMessage,
    handleKeyDown,
  } = useMessageInput(handleSendMessage);

  useEffect(() => {
    if (conversations.length > 0 && !selectedConversation) {
      handleSelectConversation(conversations[0]);
    }
  }, [conversations, selectedConversation]);

  useEffect(() => {
    if (!selectedConversation) return;

    const unsubscribe = setupMessageListener(selectedConversation.id);
    return unsubscribe;
  }, [selectedConversation]);

  useEffect(() => {
    const unsubscribe = setupNewConversationListener();
    return unsubscribe;
  }, []);

  if (error) {
    return <ErrorState error={error} onRetry={() => fetchConversations()} />;
  }

  return (
    <div className="flex h-full">
      <LoadingState
        isLoading={loading && conversations.length === 0}
        loadingText="Loading conversations..."
        className="w-80 border-r"
      >
        <ConversationsList
          conversations={filteredConversations}
          selectedConversationId={selectedConversation?.id}
          searchQuery={searchQuery}
          searchError={searchError}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
        />
      </LoadingState>

      <div className="flex-1 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <ConversationHeader
              conversation={selectedConversation}
              onResolve={handleShowResolveConfirmation}
            />

            <ResolveConfirmationDialog
              open={showResolveConfirmation}
              onOpenChange={setShowResolveConfirmation}
              onCancel={handleCancelResolve}
              onConfirm={handleConfirmResolve}
              isLoading={isResolving}
              error={resolveError}
            />

            <LoadingState
              isLoading={loading && selectedConversation.messages?.length === 0}
              loadingText="Loading messages..."
              className="flex-1"
            >
              <MessagesList conversation={selectedConversation} />
            </LoadingState>

            {selectedConversation.status !== "CLOSED" && (
              <MessageInput
                value={newMessage}
                onChange={setNewMessage}
                onSend={sendMessage}
                onKeyDown={handleKeyDown}
              />
            )}
          </>
        ) : (
          <ConversationEmptyState
            title="No conversation selected"
            description="Select a conversation from the list to view messages"
            icon={
              <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            }
          />
        )}
      </div>

      <OfflineIndicator />
      <ConversationNotificationHandler />
    </div>
  );
}
