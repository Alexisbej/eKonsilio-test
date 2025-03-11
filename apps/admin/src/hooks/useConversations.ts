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

  const conversationsQuery = useQuery({
    queryKey: conversationKeys.lists(),
    queryFn: fetchConversationsList,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const selectedConversationQuery = useQuery({
    queryKey: conversationKeys.detail(selectedConversationId || ""),
    queryFn: () => fetchConversationDetails(selectedConversationId || ""),
    enabled: !!selectedConversationId,
    staleTime: 1000 * 60, // 1 minute
  });

  const resolveMutation = useMutation({
    mutationFn: resolveConversation,
    onMutate: async (conversationId) => {
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(conversationId),
      });
      await queryClient.cancelQueries({ queryKey: conversationKeys.lists() });

      const previousConversation = queryClient.getQueryData(
        conversationKeys.detail(conversationId),
      );
      const previousConversations = queryClient.getQueryData(
        conversationKeys.lists(),
      );

      if (previousConversation) {
        queryClient.setQueryData(
          conversationKeys.detail(conversationId),
          (old: Conversation | undefined) =>
            old ? { ...old, status: "CLOSED" } : undefined,
        );
      }

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
      queryClient.invalidateQueries({
        queryKey: conversationKeys.detail(conversationId!),
      });
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => {
      return {
        conversationId,
        content,
        agentId: "agent",
        messageId: `temp-${Date.now()}`,
        timestamp: new Date(),
      };
    },
    onMutate: async ({ conversationId, content }) => {
      await queryClient.cancelQueries({
        queryKey: conversationKeys.detail(conversationId),
      });

      const previousConversation = queryClient.getQueryData(
        conversationKeys.detail(conversationId),
      );

      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        content,
        sender: "agent" as const,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      };

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
      const sent = sendMessage(data.conversationId, data.content, data.agentId);

      if (!sent) {
        throw new Error(
          "Failed to send message. Please check your connection.",
        );
      }
    },
    onError: (err, variables, context) => {
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

  const setupMessageListener = (conversationId: string) => {
    return subscribeToConversation(
      conversationId,
      (message: ProcessedMessage) => {
        const processedMessage = {
          ...message,

          sender: message.user?.role === "AGENT" ? "agent" : "user",
        };

        queryClient.setQueryData(
          conversationKeys.detail(conversationId),
          (old: Conversation | undefined) => {
            if (!old) return old;

            const hasDuplicate = old.messages.some(
              (msg: Message) =>
                msg.id === processedMessage.id ||
                (msg.id.startsWith("temp-") &&
                  msg.content === processedMessage.content &&
                  msg.sender === processedMessage.sender),
            );

            if (hasDuplicate) {
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
      queryClient.invalidateQueries({ queryKey: conversationKeys.lists() });

      if (selectedConversationId !== conversationId) {
        queryClient.prefetchQuery({
          queryKey: conversationKeys.detail(conversationId),
          queryFn: () => fetchConversationDetails(conversationId),
        });
      }
    });
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversationId(conversation.id);
  };

  const handleResolveConversation = async () => {
    if (!selectedConversationId) return false;

    try {
      await resolveMutation.mutateAsync(selectedConversationId);
      return true;
    } catch (error) {
      throw new Error("Cannot resolve conversation", error as ErrorOptions);
    }
  };

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
