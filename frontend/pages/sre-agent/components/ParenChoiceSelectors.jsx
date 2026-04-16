import { memo } from "react";

const ParenChoiceSelectors = memo(function ParenChoiceSelectors({ groups, onSelect }) {
  if (!groups.length) return null;
  return (
    <div className="mt-1 space-y-2.5 pl-0.5">
      {groups.map((g) => (
        <div
          key={`${g.num}-${g.prompt.slice(0, 20)}`}
          className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-600 dark:bg-gray-800/90"
        >
          <p className="mb-2.5 text-[13px] font-medium leading-snug text-gray-800 dark:text-gray-100">
            <span className="mr-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/12 text-xs font-bold text-primary dark:bg-primary/20">
              {g.num}
            </span>
            {g.prompt}
          </p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={g.prompt}>
            {g.options.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  const head = g.prompt.replace(/[？?]\s*$/, "").trim();
                  onSelect(`${head}：${opt}`);
                }}
                className="min-h-[36px] rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-medium text-gray-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary active:scale-[0.98] dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-primary dark:hover:bg-primary/10"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});

export default ParenChoiceSelectors;
