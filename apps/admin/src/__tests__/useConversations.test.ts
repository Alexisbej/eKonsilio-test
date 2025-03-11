import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useSocket } from "@ekonsilio/chat-socket";
import { Conversation, Message, User, UserRole } from "@ekonsilio/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import "@testing-library/jest-dom";
import { act, renderHook } from "@testing-library/react";
import { toast } from "sonner";

jest.mock("@ekonsilio/chat-socket");
jest.mock("@/hooks/useAuth");
jest.mock("@tanstack/react-query");
jest.mock("sonner");

const mockUser: User = { id: "user1", role: UserRole.AGENT };
const mockConversation: Conversation = {
  id: "conv1",
  title: "mock title",
  user: mockUser,
  status: "PENDING",
  messages: [],
  lastMessage: undefined,
  lastMessageTime: new Date(),
  updatedAt: new Date().toISOString(),
};
const mockMessage: Message = {
  id: "msg1",
  content: "Hello",
  sender: "agent",
  createdAt: new Date().toISOString(),
  timestamp: new Date(),
  user: { id: "user1", role: UserRole.AGENT },
};

const mockSubscribeToConversation = jest.fn();
const mockSubscribeToNewConversations = jest.fn();
const mockSendMessage = jest.fn().mockReturnValue(true);
const mockInvalidateQueries = jest.fn();
const mockSetQueryData = jest.fn();

describe("useConversations", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });

    (useSocket as jest.Mock).mockReturnValue({
      subscribeToConversation: mockSubscribeToConversation.mockReturnValue(
        () => {},
      ),
      subscribeToNewConversations:
        mockSubscribeToNewConversations.mockReturnValue(() => {}),
      sendMessage: mockSendMessage,
    });

    const mockQueryClient = {
      invalidateQueries: mockInvalidateQueries,
      setQueryData: mockSetQueryData,
      cancelQueries: jest.fn(),
      getQueryData: jest.fn().mockReturnValue(mockConversation),
      prefetchQuery: jest.fn(),
    };

    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    (useQuery as jest.Mock).mockImplementation((options) => {
      if (
        options.queryKey[0] === "conversations" &&
        options.queryKey[1] === "detail"
      ) {
        return {
          data: mockConversation,
          isPending: false,
          error: null,
        };
      }
      if (
        options.queryKey[0] === "conversations" &&
        options.queryKey[1] === "list"
      ) {
        return {
          data: [mockConversation],
          isPending: false,
          error: null,
        };
      }
      return { data: null, isPending: false, error: null };
    });

    (useMutation as jest.Mock).mockImplementation(({ onSuccess, onError }) => ({
      mutateAsync: jest.fn().mockImplementation(async (data) => {
        if (data?.status === "RESOLVED") {
          if (onSuccess) {
            await onSuccess();
            mockInvalidateQueries({ queryKey: ["conversations"] });
            toast("Success", {
              description: "Conversation marked as resolved",
            });
          }
          return { success: true };
        }

        if (mockSendMessage.mock.results[0]?.value === false) {
          if (onError) {
            await onError(new Error("Failed to send message"));
          }
          throw new Error("Failed to send message");
        }
        if (onSuccess) {
          await onSuccess({
            conversationId: mockConversation.id,
            content: data,
            agentId: "agent",
          });
        }
        return {};
      }),
      isPending: false,
    }));
  });

  it("initializes with correct default values", () => {
    const { result } = renderHook(() => useConversations());

    expect(result.current.conversations).toEqual([mockConversation]);
    expect(result.current.selectedConversation).toBeNull();
    expect(result.current.loading).toBeFalsy();
    expect(result.current.error).toBeNull();
  });

  it("selects a conversation correctly", () => {
    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.handleSelectConversation(mockConversation);
    });

    const targetCall = (useQuery as jest.Mock).mock.calls.find(
      ([options]) =>
        options.queryKey[0] === "conversations" &&
        options.queryKey[1] === "detail" &&
        options.queryKey[2] === mockConversation.id,
    );

    expect(targetCall[0]).toEqual(
      expect.objectContaining({
        queryKey: ["conversations", "detail", mockConversation.id],
        enabled: true,
        staleTime: 60000,
      }),
    );
  });

  it("sends message successfully", async () => {
    mockSendMessage.mockResolvedValueOnce(true);
    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.handleSelectConversation(mockConversation);
    });

    await act(async () => {
      await result.current.handleSendMessage("Hello");
    });

    expect(mockSendMessage).toHaveBeenCalledWith(
      mockConversation.id,
      { content: "Hello", conversationId: "conv1" },
      "agent",
    );
  });

  it("sets up message listener correctly", () => {
    const { result } = renderHook(() => useConversations());
    const unsubscribe = result.current.setupMessageListener(
      mockConversation.id,
    );

    expect(mockSubscribeToConversation).toHaveBeenCalledWith(
      mockConversation.id,
      expect.any(Function),
    );
    expect(unsubscribe).toBeDefined();
  });

  it("sets up new conversation listener correctly", () => {
    const { result } = renderHook(() => useConversations());
    const unsubscribe = result.current.setupNewConversationListener();

    expect(mockSubscribeToNewConversations).toHaveBeenCalledWith(
      expect.any(Function),
    );
    expect(unsubscribe).toBeDefined();
  });

  it("handles real-time message updates", () => {
    const { result } = renderHook(() => useConversations());
    result.current.setupMessageListener(mockConversation.id);

    const messageHandler = mockSubscribeToConversation.mock.calls[0][1];
    act(() => {
      messageHandler(mockMessage);
    });

    expect(mockSetQueryData).toHaveBeenCalled();
  });

  it("handles empty message content", async () => {
    const { result } = renderHook(() => useConversations());

    act(() => {
      result.current.handleSelectConversation(mockConversation);
    });

    await act(async () => {
      const success = await result.current.handleSendMessage("");
      expect(success).toBeFalsy();
    });

    expect(mockSendMessage).not.toHaveBeenCalled();
  });
});
