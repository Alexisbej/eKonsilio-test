import { Button, Input } from "@ekonsilio/chat-core";
import { Send } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onKeyDown,
}: MessageInputProps) => {
  return (
    <div className="p-4 border-t bg-white">
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Type your message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 p-2 rounded-full border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
        <Button
          onClick={onSend}
          disabled={!value.trim()}
          size="icon"
          className="rounded-full bg-blue-500 hover:bg-blue-600 h-10 w-10 flex items-center justify-center"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
