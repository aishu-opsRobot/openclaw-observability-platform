import { memo, useMemo } from "react";

const ToolCallIndicator = memo(function ToolCallIndicator({ tc }) {
  const parsedCmd = useMemo(() => {
    try {
      return JSON.parse(tc.args)?.command ?? null;
    } catch {
      return null;
    }
  }, [tc.args]);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5 text-xs dark:bg-gray-800">
      {tc.status === "running" ? (
        <svg className="h-3 w-3 animate-spin text-primary shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg className="h-3 w-3 text-emerald-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
      )}
      <span className="font-mono font-semibold text-gray-600 dark:text-gray-300">{tc.name}</span>
      {parsedCmd && <span className="truncate text-gray-400">{parsedCmd}</span>}
    </div>
  );
});

export default ToolCallIndicator;
