import { cn } from "@ekonsilio/chat-core";
import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = error
      ? `${ariaDescribedBy || ""} ${errorId}`.trim()
      : ariaDescribedBy;

    return (
      <div className="w-full">
        <input
          type={type}
          id={id}
          ref={ref}
          data-slot="input"
          aria-invalid={!!error}
          aria-describedby={describedBy || undefined}
          className={cn(
            "border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
            "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
            className,
          )}
          {...props}
        />
        {error && (
          <div
            id={errorId}
            className="mt-1 text-sm text-destructive"
            aria-live="polite"
          >
            {error}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input };
