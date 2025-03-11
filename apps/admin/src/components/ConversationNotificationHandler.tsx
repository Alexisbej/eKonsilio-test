import { useConversations } from "@/hooks/useConversations";
import { useEffect } from "react";

export function ConversationNotificationHandler() {
  const { setupNewConversationListener } = useConversations();

  useEffect(() => {
    const unsubscribe = setupNewConversationListener();

    return () => {
      unsubscribe();
    };
  }, [setupNewConversationListener]);

  return null;
}
