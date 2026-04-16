import { memo, useCallback, useMemo } from "react";
import { extractChoices } from "../choiceParsing.js";

const ChoiceCards = memo(function ChoiceCards({ text, onSelect, setInput, inputRef, excludeNums }) {
  const choices = useMemo(() => extractChoices(text, excludeNums), [text, excludeNums]);

  const handleClick = useCallback((c) => {
    if (c.isQuestion && setInput) {
      setInput(c.fillHint ? `${c.fillHint}: ` : "");
      setTimeout(() => inputRef?.current?.focus(), 0);
    } else {
      onSelect(c.label);
    }
  }, [onSelect, setInput, inputRef]);

  if (choices.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 pl-1">
      {choices.map((c, i) => (
        <button
          key={i}
          type="button"
          onClick={() => handleClick(c)}
          className="flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-left text-[13px] transition hover:border-primary/40 hover:bg-primary/5 hover:shadow-md active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:hover:border-primary/40 dark:hover:bg-primary/10"
        >
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:bg-primary/20">
            {c.num}
          </span>
          <span className="flex-1 font-medium text-gray-700 dark:text-gray-200">{c.label}</span>
          {c.isQuestion ? (
            <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          ) : (
            <svg className="ml-auto h-4 w-4 shrink-0 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
});

export default ChoiceCards;
