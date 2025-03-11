import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const MessageInput = ({
  value,
  onChange,
  onSend,
  onKeyDown,
}: MessageInputProps) => {
  const handleSend = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (value.trim()) {
      onSend(value);
    }
  };

  return (
    <div className="p-5 border-t bg-white shadow-sm">
      <div className="flex gap-3 items-center max-w-4xl mx-auto">
        <Input
          placeholder="Type your message..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1 py-3 px-4 rounded-full border-slate-200 focus-visible:ring-blue-400 transition-all"
        />
        <Button
          onClick={handleSend}
          disabled={!value.trim()}
          size="icon"
          className="rounded-full h-11 w-11 bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
