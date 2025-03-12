"use client";

import { ConversationNotificationHandler } from "@/components/ConversationNotificationHandler";
import { ConversationEmptyState } from "@/components/conversations/ConversationEmptyState";
import { ConversationHeader } from "@/components/conversations/ConversationHeader";
import { ConversationList } from "@/components/conversations/ConversationList";
import { MessageInput } from "@/components/conversations/MessageInput";
import { MessagesList } from "@/components/conversations/MessagesList";
import { ResolveConfirmationDialog } from "@/components/conversations/ResolveConfirmationDialog";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/ui/loading-state";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { useConversations } from "@/hooks/useConversations";
import { useResolveConfirmation } from "@/hooks/useResolveConfirmation";
import { useSearch } from "@/hooks/useSearch";
import { useMessageInput } from "@ekonsilio/chat-core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ChevronLeft, ChevronRight, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

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

  const { filteredConversations } = useSearch(conversations);

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

  const [showSidebar, setShowSidebar] = useState(true);

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

  const [hasMore] = useState(false);

  if (error) {
    return <ErrorState error={error} onRetry={() => fetchConversations()} />;
  }

  const loadMore = () => {};

  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  return (
    <div className="flex h-full relative">
      <div
        className={`${
          showSidebar ? "flex" : "hidden"
        } md:flex flex-col h-full border-r absolute md:relative z-10 bg-background w-full md:w-80`}
      >
        <LoadingState
          isLoading={loading && conversations.length === 0}
          loadingText="Loading conversations..."
          className="w-full"
        >
          <ConversationList
            conversations={filteredConversations}
            isLoading={loading}
            hasMore={hasMore}
            loadMore={loadMore}
            selectedConversationId={selectedConversation?.id}
            onSelectConversation={(id) => {
              const conversation = conversations.find((c) => c.id === id);
              if (conversation) {
                handleSelectConversation(conversation);
                if (window.innerWidth < 768) {
                  setShowSidebar(false);
                }
              }
            }}
          />
        </LoadingState>
      </div>

      <div className="flex-1 flex flex-col h-full">
        {selectedConversation ? (
          <>
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="md:hidden mr-2"
              >
                {showSidebar ? <ChevronLeft /> : <ChevronRight />}
              </Button>

              <div className="flex-1">
                <ConversationHeader
                  conversation={selectedConversation}
                  onResolve={handleShowResolveConfirmation}
                />
              </div>
            </div>

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
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="md:hidden absolute top-2 left-2 z-20"
            >
              {showSidebar ? <ChevronLeft /> : <ChevronRight />}
            </Button>

            <ConversationEmptyState
              title="No conversation selected"
              description="Select a conversation from the list to view messages"
              icon={
                <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
              }
            />
          </>
        )}
      </div>

      <OfflineIndicator />
      <ConversationNotificationHandler />
    </div>
  );
}
