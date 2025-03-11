import { Conversation } from "@ekonsilio/types";
import { MessageItem } from "./MessageItem";

interface MessagesListProps {
  conversation: Conversation;
}

export const MessagesList = ({ conversation }: MessagesListProps) => {
  return (
    <div className="flex-1 p-4 overflow-y-auto bg-slate-50">
      {conversation.messages.length === 0 ? (
        <div className="flex h-full items-center justify-center">
          <p className="text-slate-500">No messages yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversation.messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              userName={conversation.user.name!}
            />
          ))}
        </div>
      )}
    </div>
  );
};
