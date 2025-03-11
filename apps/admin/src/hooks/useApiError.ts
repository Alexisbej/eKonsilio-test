import { useCallback, useState } from "react";
import { toast } from "sonner"; // Make sure to install this package

interface ApiErrorState {
  message: string | null;
  code: string | null;
  isError: boolean;
}

// Define a more specific error type
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
  message?: string;
}

export const useApiError = () => {
  const [error, setError] = useState<ApiErrorState>({
    message: null,
    code: null,
    isError: false,
  });

  const handleError = useCallback((err: ApiErrorResponse) => {
    const errorMessage =
      err?.response?.data?.message ||
      err?.message ||
      "An unexpected error occurred";

    const errorCode = err?.response?.status || "UNKNOWN";

    setError({
      message: errorMessage,
      code: errorCode.toString(),
      isError: true,
    });

    // Show toast notification
    toast.error(errorMessage);

    // Log error for monitoring
    console.error(`API Error (${errorCode}):`, errorMessage);

    return { message: errorMessage, code: errorCode };
  }, []);

  const clearError = useCallback(() => {
    setError({
      message: null,
      code: null,
      isError: false,
    });
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};
