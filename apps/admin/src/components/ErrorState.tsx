import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center border-0 shadow-lg bg-white rounded-xl">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-red-50 rounded-full">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-3 text-red-600">Error</h3>
        <p className="text-slate-600 mb-6">{error}</p>
        <Button
          className="px-6 py-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
          onClick={onRetry}
        >
          Retry
        </Button>
      </Card>
    </div>
  );
};
