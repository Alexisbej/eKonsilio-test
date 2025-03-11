import React from "react";
import { Spinner } from "./spinner";

interface LoadingStateProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  spinnerSize?: number;
}

export function LoadingState({
  isLoading,
  loadingText = "Loading...",
  children,
  className = "",
  spinnerSize = 24,
}: LoadingStateProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center p-6 ${className}`}
    >
      <Spinner size={spinnerSize} className="mb-2" />
      <p className="text-sm text-muted-foreground">{loadingText}</p>
    </div>
  );
}
