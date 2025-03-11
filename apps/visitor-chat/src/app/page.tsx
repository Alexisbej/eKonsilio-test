"use client";

import { ChatWidget } from "@/components/chat/ChatWidget";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function Home() {
  return (
    <div className="min-h-screen p-4 md:p-8 flex items-center justify-center bg-slate-50">
      <ErrorBoundary>
        <ChatWidget />
      </ErrorBoundary>
    </div>
  );
}
