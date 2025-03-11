import { format } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import React from "react";
import { Button } from "./button";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

export function DateRangePicker({
  value,
  onChange,
  className = "",
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const formatDateRange = () => {
    if (!value.from && !value.to) {
      return "Select date range";
    }

    if (value.from && !value.to) {
      return `From ${format(value.from, "MMM d, yyyy")}`;
    }

    if (!value.from && value.to) {
      return `Until ${format(value.to, "MMM d, yyyy")}`;
    }

    return `${value.from ? format(value.from, "MMM d") : ""} - ${value.to ? format(value.to, "MMM d, yyyy") : ""}`;
  };

  // This is a simplified version - in a real implementation, you would use a proper
  // date picker library like react-datepicker or @radix-ui/react-popover with a calendar

  return (
    <div className={`relative ${className}`}>
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
      >
        <span className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {formatDateRange()}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </Button>

      {/* This is a placeholder for the actual date picker UI */}
      {isOpen && (
        <div className="absolute top-full left-0 z-10 mt-1 w-full rounded-md border bg-background p-4 shadow-md">
          <p className="text-sm text-muted-foreground">
            Date picker UI would go here. Implement with a library like
            react-datepicker.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onChange({ from: null, to: null });
                setIsOpen(false);
              }}
            >
              Clear
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
