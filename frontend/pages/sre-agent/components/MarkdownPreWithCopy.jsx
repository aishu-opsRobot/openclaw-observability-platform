import { isValidElement, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

const COLLAPSE_LINE_THRESHOLD = 15;

function collectPlainText(node) {
  if (node == null || node === false) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(collectPlainText).join("");
  if (isValidElement(node)) return collectPlainText(node.props.children);
  return "";
}

function countLines(text) {
  if (text == null || text === "") return 0;
  return text.split(/\r?\n/).length;
}

const PRE_BASE =
  "group relative my-[0.65em] rounded-lg border text-xs leading-[1.55] " +
  "border-gray-200 bg-gray-50 text-gray-800 pt-3 pl-4 pr-11 " +
  "shadow-[inset_0_1px_0_rgb(255_255_255/0.6)] " +
  "dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 " +
  "dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] " +
  /* 覆盖 x-markdown 默认的 pre-wrap / break-word */
  "!whitespace-pre !break-normal !overflow-wrap-normal";

const COPY_BTN =
  "absolute top-2 right-2 z-[2] m-0 flex cursor-pointer items-center justify-center rounded-md border-0 p-[0.35rem] leading-none " +
  "bg-white/85 text-gray-500 opacity-0 pointer-events-none " +
  "transition-[opacity,background-color,color] duration-150 ease-in-out " +
  "hover:bg-gray-100 hover:text-gray-700 " +
  "group-hover:opacity-100 group-hover:pointer-events-auto " +
  "group-focus-within:opacity-100 group-focus-within:pointer-events-auto " +
  "[@media(hover:none)]:opacity-100 [@media(hover:none)]:pointer-events-auto " +
  "dark:bg-gray-800/90 dark:text-gray-400 dark:hover:bg-gray-600 dark:hover:text-gray-200";

const BODY_BASE =
  "min-w-0 w-full overflow-x-auto " +
  "[&>code]:!m-0 [&>code]:!block [&>code]:!border-0 [&>code]:!bg-transparent [&>code]:!p-0 " +
  "[&>code]:!whitespace-pre [&>code]:!break-normal [&>code]:!text-[inherit] [&>code]:!font-[inherit] " +
  "[&>code]:!leading-[inherit] [&>code]:!rounded-none";

const BODY_COLLAPSED =
  "relative max-h-[calc(15*1.55em)] overflow-x-auto overflow-y-hidden " +
  "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-9 " +
  "after:bg-gradient-to-b after:from-transparent after:to-gray-50 " +
  "dark:after:to-gray-900";

/** 与 PRE_BASE 的 pl-4、pr-11 对齐，使底栏与代码框（含内边距区）同宽 */
const TOGGLE_BTN =
  "m-0 box-border w-[calc(100%+1rem+2.75rem)] max-w-none -ml-4 -mr-11 cursor-pointer border-0 border-t border-gray-200 " +
  "bg-gray-100/85 px-3 py-[0.4rem] pb-[0.55rem] text-center text-xs font-medium leading-snug text-blue-600 " +
  "rounded-b-lg transition-colors hover:bg-blue-50 hover:text-blue-800 " +
  "dark:border-gray-600 dark:bg-slate-800/90 dark:text-blue-300 " +
  "dark:hover:bg-blue-950/40 dark:hover:text-blue-200";

/**
 * XMarkdown `components.pre`：fenced code 复制按钮；超过 15 行默认折叠。样式全部用 Tailwind。
 */
const MarkdownPreWithCopy = memo(function MarkdownPreWithCopy({ domNode: _domNode, streamStatus: _streamStatus, children, ...rest }) {
  const bodyRef = useRef(null);
  const [copied, setCopied] = useState(false);

  const plainText = useMemo(() => collectPlainText(children).replace(/\r\n/g, "\n"), [children]);
  const lineCount = useMemo(() => countLines(plainText), [plainText]);
  const needsCollapse = lineCount > COLLAPSE_LINE_THRESHOLD;

  const [expanded, setExpanded] = useState(() => lineCount <= COLLAPSE_LINE_THRESHOLD);

  useEffect(() => {
    setExpanded(lineCount <= COLLAPSE_LINE_THRESHOLD);
  }, [lineCount]);

  const handleCopy = useCallback(async () => {
    const text = bodyRef.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, []);

  const { className, ...domRest } = rest;
  const preClass = [PRE_BASE, needsCollapse ? "pb-0" : "pb-3", className].filter(Boolean).join(" ");
  const bodyCollapsed = needsCollapse && !expanded;
  const bodyClass = [BODY_BASE, bodyCollapsed ? BODY_COLLAPSED : ""].filter(Boolean).join(" ");

  return (
    <pre className={preClass} {...domRest}>
      <button
        type="button"
        onClick={handleCopy}
        title={copied ? "已复制" : "复制代码"}
        className={COPY_BTN}
        aria-label={copied ? "已复制" : "复制代码"}
      >
        {copied ? (
          <svg className="h-3.5 w-3.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
            />
          </svg>
        )}
      </button>
      <div ref={bodyRef} className={bodyClass}>
        {children}
      </div>
      {needsCollapse && (
        <button type="button" className={TOGGLE_BTN} onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
          {expanded ? "收起" : "展开"}
        </button>
      )}
    </pre>
  );
});

export default MarkdownPreWithCopy;
