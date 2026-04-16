import { memo } from "react";

const ConfirmCard = memo(function ConfirmCard({ confirm: c, onRespond }) {
  return (
    <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-3 dark:border-amber-600 dark:bg-amber-950/30">
      <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">{c.title}</p>
      <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-400">{c.message}</p>
      {c.command && (
        <code className="mt-1.5 block rounded bg-amber-100 px-2 py-1 text-[10px] font-mono text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
          {c.command}
        </code>
      )}
      <div className="mt-2.5 flex gap-2">
        {c.actions?.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onRespond(a.id === "approve")}
            className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
              a.variant === "primary"
                ? "bg-primary text-white hover:bg-primary/90"
                : "border border-gray-300 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
});

export default ConfirmCard;
