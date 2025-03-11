"use client";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useChatWidget } from "@/hooks/useChatWidget";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Input,
} from "@ekonsilio/chat-core";
import { Conversation } from "@ekonsilio/types";
import { MessageInput } from "./MessageInput";
import { MessagesList } from "./MessagesList";

export const ChatWidget = ({
  initialConversation,
}: {
  initialConversation?: Conversation;
}) => {
  const {
    visitorInfo,
    visitorFormData,
    conversation,
    formSubmitted,
    newMessage,
    setNewMessage,
    handleKeyDown,
    sendMessageHandler,
    handleVisitorInfoChange,
    handleFormSubmit,
    error,
    isLoading,
    resetError,
  } = useChatWidget(initialConversation);

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
        <p className="mb-4">{error}</p>
        <Button
          className="bg-blue-500 hover:bg-blue-600 rounded-md"
          onClick={resetError}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!formSubmitted) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Start a Conversation</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Your Name
            </label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={visitorFormData.name}
              onChange={(e) => handleVisitorInfoChange("name", e.target.value)}
              className="rounded-md"
              aria-required="true"
              maxLength={50}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Your Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={visitorFormData.email}
              onChange={(e) => handleVisitorInfoChange("email", e.target.value)}
              className="rounded-md"
              aria-required="true"
              maxLength={100}
            />
          </div>
          <Button
            className="w-full bg-blue-500 hover:bg-blue-600 rounded-md"
            onClick={handleFormSubmit}
            disabled={
              !visitorFormData.name || !visitorFormData.email || isLoading
            }
            aria-busy={isLoading}
          >
            {isLoading ? "Starting Chat..." : "Start Chat"}
          </Button>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">
          Starting your conversation...
        </h2>
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-[600px] w-full max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-white border-b p-4 flex items-center">
          <div className="flex items-center">
            <div className="relative mr-3">
              <div className="h-10 w-10 rounded-full overflow-hidden">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${
                      visitorInfo?.name || ""
                    }`}
                    alt={`${visitorInfo?.name || "Visitor"} avatar`}
                  />
                  <AvatarFallback>
                    {(visitorInfo?.name || "").substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            <div>
              <h2 className="font-medium text-gray-800">Support Agent</h2>
              <p className="text-xs text-gray-500">
                {conversation.status === "PENDING"
                  ? "Waiting for agent..."
                  : "Your online advisor"}
              </p>
            </div>
          </div>
        </div>

        <MessagesList
          conversation={conversation}
          visitorName={visitorInfo?.name || ""}
        />

        <MessageInput
          value={newMessage}
          onChange={setNewMessage}
          onSend={sendMessageHandler}
          onKeyDown={handleKeyDown}
          isLoading={isLoading}
        />
      </div>
    </ErrorBoundary>
  );
};
