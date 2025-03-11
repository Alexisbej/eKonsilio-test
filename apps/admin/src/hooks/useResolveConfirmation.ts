import { useState } from "react";
import { toast } from "sonner";

export const useResolveConfirmation = (
  resolveHandler: () => Promise<boolean | undefined>,
) => {
  const [showResolveConfirmation, setShowResolveConfirmation] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShowResolveConfirmation = () => {
    setError(null);
    setShowResolveConfirmation(true);
  };

  const handleCancelResolve = () => {
    setShowResolveConfirmation(false);
  };

  const handleConfirmResolve = async () => {
    setIsResolving(true);
    setError(null);

    try {
      const success = await resolveHandler();
      setShowResolveConfirmation(false);

      if (success) {
        toast.success("Conversation resolved successfully");
      }

      return success;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to resolve conversation";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsResolving(false);
    }
  };

  return {
    showResolveConfirmation,
    setShowResolveConfirmation,
    handleShowResolveConfirmation,
    handleCancelResolve,
    handleConfirmResolve,
    isResolving,
    error,
  };
};
