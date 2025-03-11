export function ConversationSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-md border border-transparent p-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700" />
            <div className="h-3 w-16 rounded bg-gray-200 dark:bg-gray-700" />
          </div>
          <div className="h-3 w-full rounded bg-gray-200 dark:bg-gray-700" />
          <div className="mt-1 h-5 w-16 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      ))}
    </div>
  );
}
