import { Button, Input } from "@ekonsilio/chat-core";
import { Loader2, Send } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string) => Promise<boolean>;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading?: boolean;
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onKeyDown,
  isLoading = false,
}: MessageInputProps) => {
  const handleSend = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
    }
  };
  return (
    <div className="p-4 border-t bg-white">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Type your message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 p-2 rounded-full border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          disabled={isLoading}
          aria-label="Message input"
        />
        <Button
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          size="icon"
          className="rounded-full bg-blue-500 hover:bg-blue-600 h-10 w-10 flex items-center justify-center"
          aria-label="Send message"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
};
