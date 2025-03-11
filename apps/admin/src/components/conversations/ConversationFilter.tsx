import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { SearchInput } from "@/components/ui/search-input";
import { X } from "lucide-react";

interface DateRange {
  from: Date | null;
  to: Date | null;
}

interface ConversationFilterProps {
  search: string;
  onSearchChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  status: "all" | "PENDING" | "RESOLVED";
  onStatusChange: (status: "all" | "PENDING" | "RESOLVED") => void;
}

export function ConversationFilter({
  search,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  status,
  onStatusChange,
}: ConversationFilterProps) {
  const hasFilters =
    search || dateRange.from || dateRange.to || status !== "all";

  const handleClearFilters = () => {
    onSearchChange("");
    onDateRangeChange({ from: null, to: null });
    onStatusChange("all");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search conversations..."
          className="flex-1"
        />
        <DateRangePicker
          value={dateRange}
          onChange={onDateRangeChange}
          className="w-full sm:w-auto sm:min-w-[240px]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <Badge
            variant={status === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onStatusChange("all")}
          >
            All
          </Badge>
          <Badge
            variant={status === "PENDING" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onStatusChange("PENDING")}
          >
            Active
          </Badge>
          <Badge
            variant={status === "RESOLVED" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onStatusChange("RESOLVED")}
          >
            Resolved
          </Badge>
        </div>

        {hasFilters && (
          <button
            onClick={handleClearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
