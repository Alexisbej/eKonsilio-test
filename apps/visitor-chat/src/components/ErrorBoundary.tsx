"use client";

import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
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
              The chat application encountered an unexpected error.
            </p>
            <details className="mb-4">
              <summary className="cursor-pointer text-red-600 hover:text-red-800">
                Error details
              </summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-sm overflow-auto">
                {this.state.error?.toString()}
              </pre>
            </details>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
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
