import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Spinner } from "@/components/ui/spinner";

interface ResolveConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ResolveConfirmationDialog = ({
  open,
  onOpenChange,
  onCancel,
  onConfirm,
  isLoading = false,
  error = null,
}: ResolveConfirmationDialogProps) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Resolution</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to mark this conversation as resolved? This
            action cannot be undone.
          </AlertDialogDescription>
          {error && (
            <div className="mt-2 text-sm text-red-600 p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center justify-center gap-2"
          >
            {isLoading && <Spinner size={16} />}
            Resolve
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
