import { memo } from "react";

const AgentPicker = memo(function AgentPicker({ value, onChange, disabled, className = "", catalog, loading, error, compact }) {
  if (compact) {
    return (
      <div className="relative shrink-0">
        <select
          value={value}
          disabled={disabled || loading}
          onChange={(e) => onChange(e.target.value)}
          title="切换 Agent"
          className={`h-9 w-[110px] cursor-pointer appearance-none rounded-xl border border-gray-300 bg-white py-0 pl-2.5 pr-7 text-xs font-medium text-gray-700 outline-none transition hover:border-primary focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-primary ${loading ? "opacity-50" : ""}`}
        >
          {loading && <option value="">加载…</option>}
          {!loading && catalog.map((a) => (
            <option key={a.id} value={a.id} title={a.description || a.id}>
              {a.label}
            </option>
          ))}
        </select>
        <svg className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
        </svg>
        {error && !loading && (
          <span
            className="absolute -right-1 -top-1 flex h-3 w-3 cursor-help items-center justify-center rounded-full bg-amber-400 text-[8px] font-bold text-white"
            title={`同步异常: ${error}`}
          >!</span>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <select
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
        title="选择要对话的 Agent（对应 OpenClaw agent_id）"
        className={`app-input min-w-0 flex-1 py-1.5 pr-8 text-xs ${loading ? "opacity-50" : ""}`}
      >
        {loading && <option value="">加载中…</option>}
        {!loading && catalog.map((a) => (
          <option key={a.id} value={a.id} title={[a.description, a.status ? `状态: ${a.status}` : ""].filter(Boolean).join(" · ") || a.id}>
            {a.label}{a.status && a.status !== "unknown" ? ` (${a.status})` : ""}
          </option>
        ))}
      </select>
      {error && !loading && (
        <span
          className="shrink-0 cursor-help text-amber-500"
          title={`Agent 列表同步异常: ${error}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </span>
      )}
    </div>
  );
});

export default AgentPicker;
