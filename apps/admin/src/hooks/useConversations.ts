// hooks/useConversations.ts
// First, let's define some interfaces at the top of the file
import { conversationKeys } from "@/constants/queryKeys";
import {
  fetchConversationDetails,
  fetchConversationsList,
  resolveConversation,
} from "@/services/conversationService";

import { useSocket } from "@ekonsilio/chat-socket";
import { Conversation, Message } from "@ekonsilio/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";

interface ProcessedMessage extends Message {
  sender: "agent" | "user";
}

export const useConversations = () => {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { subscribeToConversation, subscribeToNewConversations, sendMessage } =
    useSocket({
      userId: user?.id,
      isAgent: true,
      tokenKey: "auth_token",
    });

  // Query for fetching all conversations
  const conversationsQuery = useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: fetchConversationsList,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Query for fetching details of the selected conversation
  const selectedConversationQuery = useQuery({
    queryKey: conversationKeys.detail(selectedConversationId || ""),
    queryFn: () => fetchConversationDetails(selectedConversationId || ""),
    enabled: !!selectedConversationId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Mutation for resolving a conversation
  const resolveMutation = useMutation({
    mutationFn: resolveConversation,
    onMutate: async (conversationId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
      await queryClient.cancelQueries({ queryKey: conversationKeys.lists() });

      // Snapshot previous values
      const previousConversation = queryClient.getQueryData(
        conversationKeys.detail(conversationId),
      );
      const previousConversations = queryClient.getQueryData(
        conversationKeys.lists(),
      );

      // Optimistically update the selected conversation
      if (previousConversation) {
        queryClient.setQueryData(
          conversationKeys.detail(conversationId),
          (old: Conversation | undefined) =>
            old ? { ...old, status: "CLOSED" } : undefined,
        );
      }

      // Optimistically update the conversations list
      queryClient.setQueryData(
        conversationKeys.lists(),
        (old: Conversation[] | undefined) =>
          old?.map((conv: Conversation) =>
            conv.id === conversationId ? { ...conv, status: "CLOSED" } : conv,
          ) || [],
      );

      return { previousConversation, previousConversations };
    },
    onError: (err, conversationId, context) => {
      // Revert to previous values if there's an error
      if (context?.previousConversation) {
        queryClient.setQueryData(
          conversationKeys.detail(conversationId),
          context.previousConversation,
        );
      }
      if (context?.previousConversations) {
        queryClient.setQueryData(
          conversationKeys.lists(),
          context.previousConversations,
        );
      }

      toast("Error", {
        description: "Failed to resolve conversation",
      });
    },
    onSuccess: () => {
      toast("Success", {
        description: "Conversation marked as resolved",
      });
    },
    onSettled: (conversationId) => {
      // Invalidate queries to refetch latest data
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId!),
      });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });

  // Mutation for sending a message
  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      // For the optimistic update, return the necessary data.
      return {
        conversationId,
        content,
        agentId: "agent", // Replace with the actual agent id if available.
        messageId: `temp-${Date.now()}`,
        timestamp: new Date(),
      };
    },
    onMutate: async ({ conversationId, content }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(conversationId),
      });

      // Snapshot previous values
      const previousConversation = queryClient.getQueryData(
        conversationKeys.detail(conversationId),
      );

      // Create an optimistic message
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content,
        sender: "agent" as const,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      };

      // Optimistically update the conversation detail
      queryClient.setQueryData(
        conversationKeys.detail(conversationId),
        (old: Conversation | undefined) =>
          old
            ? {
                ...old,
                messages: [...old.messages, optimisticMessage],
                lastMessage: content,
                lastMessageTime: new Date(),
              }
            : undefined,
      );

      // Also update the conversation in the list
      queryClient.setQueryData(
        conversationKeys.lists(),
        (old: Conversation[] | undefined) =>
          old?.map((conv: Conversation) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  lastMessage: content,
                  lastMessageTime: new Date(),
                }
              : conv,
          ) || [],
      );

      return { previousConversation };
    },
    onSuccess: async (data) => {
      // Send the message via WebSocket
      const sent = sendMessage(data.conversationId, data.content, data.agentId);

      if (!sent) {
        throw new Error(
          "Failed to send message. Please check your connection.",
        );
      }
    },
    onError: (err, variables, context) => {
      // Revert to previous values on error
      if (context?.previousConversation) {
        queryClient.setQueryData(
          conversationKeys.detail(variables.conversationId),
          context.previousConversation,
        );
      }

      toast("Error", {
        description: "Failed to send message",
      });
    },
  });

  // Handling WebSocket updates through React Query
  const setupMessageListener = (conversationId: string) => {
    return subscribeToConversation(
      conversationId,
      (message: ProcessedMessage) => {
        // The issue is here - we're not correctly identifying message senders
        // We should check if the message is from the agent or user based on role or ID

        // Make sure the message has the correct sender property
        const processedMessage = {
          ...message,
          // Ensure sender is correctly set to "user" for visitor messages
          sender: message.user?.role === "AGENT" ? "agent" : "user",
        };

        // Update conversation detail with the new message
        queryClient.setQueryData(
          conversationKeys.detail(conversationId),
          (old: Conversation | undefined) => {
            if (!old) return old;

            // Check for duplicate messages (including optimistic ones)
            const hasDuplicate = old.messages.some(
              (msg: Message) =>
                msg.id === processedMessage.id ||
                (msg.id.startsWith("temp-") &&
                  msg.content === processedMessage.content &&
                  msg.sender === processedMessage.sender),
            );

            if (hasDuplicate) {
              // Replace duplicate optimistic message with the real one
              const updatedMessages = old.messages.filter(
                (msg: Message) =>
                  !(
                    msg.id.startsWith("temp-") &&
                    msg.content === processedMessage.content &&
                    msg.sender === processedMessage.sender
                  ),
              );

              return {
                ...old,
                messages: [...updatedMessages, processedMessage],
                lastMessage: processedMessage.content,
                lastMessageTime: new Date(processedMessage.createdAt),
              };
            }

            return {
              ...old,
              messages: [...old.messages, processedMessage],
              lastMessage: processedMessage.content,
              lastMessageTime: new Date(processedMessage.createdAt),
            };
          },
        );

        // Also update the conversations list
        queryClient.setQueryData(
          conversationKeys.lists(),
          (old: Conversation[] | undefined) =>
            old?.map((conv: Conversation) =>
              conv.id === conversationId
                ? {
                    ...conv,
                    lastMessage: processedMessage.content,
                    lastMessageTime: new Date(processedMessage.createdAt),
                  }
                : conv,
            ) || [],
        );
      },
    );
  };

  const setupNewConversationListener = () => {
    return subscribeToNewConversations((conversationId: string) => {
      // Invalidate queries to refetch latest data
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });

      // Optionally prefetch the new conversation details if it isn't selected already
      if (selectedConversationId !== conversationId) {
        queryClient.prefetchQuery({
          queryKey: conversationKeys.detail(conversationId),
          queryFn: () => fetchConversationDetails(conversationId),
        });
      }
    });
  };

  // Handle selecting a conversation
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
  };

  // Handle resolving a conversation
  const handleResolveConversation = async () => {
    if (!selectedConversationId) return false;

    try {
      await resolveMutation.mutateAsync(selectedConversationId);
      return true;
    } catch (error) {
      throw new Error("Cannot resolve conversation", error as ErrorOptions);
    }
  };

  // Handle sending a message
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedConversationId) return false;

    try {
      await sendMessageMutation.mutateAsync({
        conversationId: selectedConversationId,
        content,
      });
      return true;
    } catch (error) {
      throw new Error("Cannot send message", error as ErrorOptions);
    }
  };

  return {
    conversations: conversationsQuery.data || [],
    selectedConversation: selectedConversationId
      ? selectedConversationQuery.data || null
      : null,
    loading: conversationsQuery.isPending,
    error: conversationsQuery.error ? String(conversationsQuery.error) : null,
    fetchConversations: () =>
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() }),
    fetchConversationDetails: (id: string) => {
      queryClient.invalidateQueries({ queryKey: conversationKeys.detail(id) });
    },
    handleSelectConversation,
    handleResolveConversation,
    handleSendMessage,
    isResolvingConversation: resolveMutation.isPending,
    isSendingMessage: sendMessageMutation.isPending,
    setupMessageListener,
    setupNewConversationListener,
  };
};
