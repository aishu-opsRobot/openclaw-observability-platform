/**
 * 成对出现的 OpenClaw / 网关内部块：`<<<BEGIN_NAME>>>...<<<END_NAME>>>`
 *（如 OPENCLAW_INTERNAL_CONTEXT、UNTRUSTED_CHILD_RESULT 等），不应展示在聊天 UI。
 */
const PAIRED_INTERNAL_BLOCK =
  /<<<BEGIN_([A-Z0-9_]+)>>>\s*([\s\S]*?)\s*<<<END_\1>>>/g;

/**
 * 去掉所有已闭合的内部块后，若仍存在未闭合的 `<<<BEGIN_...>>>`（流式或异常），
 * 则从第一个 BEGIN 起截断到文末，避免把内部元数据闪给用户。
 */
const ANY_BEGIN_MARKER = /<<<BEGIN_[A-Z0-9_]+>>>/;

/**
 * 移除 OpenClaw / 子 Agent 注入的内部标记块，避免在聊天 UI 中展示。
 */
export function stripOpenClawHiddenBlocks(text) {
  if (text == null || typeof text !== "string") return "";
  let out = text;
  let prev;
  do {
    prev = out;
    out = out.replace(PAIRED_INTERNAL_BLOCK, "");
  } while (out !== prev);

  const openMatch = out.search(ANY_BEGIN_MARKER);
  if (openMatch !== -1) {
    out = out.slice(0, openMatch);
  }
  return out.replace(/\n{3,}/g, "\n\n").trimEnd();
}

/** @deprecated 与 stripOpenClawHiddenBlocks 相同，保留别名以免外部引用断裂 */
export const stripOpenClawInternalContext = stripOpenClawHiddenBlocks;
