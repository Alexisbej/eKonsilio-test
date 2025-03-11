"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div
            className="p-6 rounded-lg bg-red-50 border border-red-200"
            role="alert"
            aria-live="assertive"
          >
            <h2 className="text-xl font-bold text-red-700 mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600 mb-4">
              The application encountered an unexpected error.
            </p>
            <p className="text-xs text-red-500 mb-4 font-mono overflow-auto max-h-40">
              {this.state.error?.toString()}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              aria-label="Try again"
            >
              Try again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
