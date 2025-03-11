import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  buttonText?: string;
  onButtonClick?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState = ({
  title,
  description,
  buttonText,
  onButtonClick,
  icon,
}: EmptyStateProps) => {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Card className="w-full max-w-md p-8 text-center border-0 shadow-lg bg-white rounded-xl">
        {icon && (
          <div className="flex justify-center mb-4 text-slate-300">{icon}</div>
        )}
        <h3 className="text-xl font-semibold mb-3 text-slate-800">{title}</h3>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
        {buttonText && onButtonClick && (
          <Button
            className="px-6 py-2 rounded-full bg-blue-500 hover:bg-blue-600 transition-colors shadow-sm"
            onClick={onButtonClick}
          >
            {buttonText}
          </Button>
        )}
      </Card>
    </div>
  );
};
