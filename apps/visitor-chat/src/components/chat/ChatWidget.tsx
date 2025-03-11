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
      <div className="w-full max-w-md mx-auto p-8 bg-white rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Start a Conversation
        </h2>
        <div className="space-y-6">
          <div className="relative">
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Name
            </label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={visitorFormData.name}
              onChange={(e) => handleVisitorInfoChange("name", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${error?.includes("Name") ? "border-red-500" : "border-gray-300"}`}
              aria-required="true"
              maxLength={50}
              aria-invalid={error?.includes("Name") ? "true" : "false"}
            />
            {error?.includes("Name") && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
          <div className="relative">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Your Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={visitorFormData.email}
              onChange={(e) => handleVisitorInfoChange("email", e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${error?.includes("Email") || error?.includes("email") ? "border-red-500" : "border-gray-300"}`}
              aria-required="true"
              maxLength={100}
              aria-invalid={
                error?.includes("Email") || error?.includes("email")
                  ? "true"
                  : "false"
              }
            />
            {(error?.includes("Email") || error?.includes("email")) && (
              <p className="text-red-500 text-xs mt-1">{error}</p>
            )}
          </div>
          <Button
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium rounded-lg transform transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={handleFormSubmit}
            disabled={
              !visitorFormData.name || !visitorFormData.email || isLoading
            }
            aria-busy={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Starting Chat...
              </span>
            ) : (
              "Start Chat"
            )}
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
