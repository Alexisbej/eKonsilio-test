import { toast } from "sonner";

type ToastAction = {
  label: string;
  onClick: () => void;
};

type ToastOptions = {
  description?: string;
  action?: ToastAction;
};

export const showToast = {
  success: (title: string, options?: ToastOptions) => {
    toast(title, {
      description: options?.description,
      action: options?.action,
    });
  },
  error: (title: string, options?: ToastOptions) => {
    toast(title, {
      description: options?.description,
      action: options?.action,
    });
  },
};
