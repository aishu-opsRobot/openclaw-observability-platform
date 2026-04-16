/**
 * AG-UI 人机确认（与 OpenClaw 真实链路约定一致，前后端共用）：
 * 1) ```confirm … ``` JSON 代码块
 * 2) 正文末尾「如需 / 若需 … 请告知 / 请告知。」类自然语言邀约（从气泡中拆出为确认卡片）
 *
 * 后端 `openclaw-client.mjs` 与前端 `useAgui` 请统一走 `parseAssistantConfirmSources`。
 */

const CONFIRM_FENCE_RE = /```confirm\s*\n([\s\S]*?)```/;

export const DEFAULT_CONFIRM_ACTIONS = [
  { id: "approve", label: "确认", variant: "primary" },
  { id: "reject", label: "取消", variant: "secondary" },
];

/** 尾部自然语言邀约确认卡片的按钮文案 */
export const TAIL_INVITATION_CONFIRM_ACTIONS = [
  { id: "approve", label: "继续", variant: "primary" },
  { id: "reject", label: "暂不", variant: "secondary" },
];

/**
 * @param {unknown} parsed
 * @param {() => string} makeId
 * @returns {object | null}
 */
export function normalizeConfirmPayload(parsed, makeId) {
  if (!parsed || typeof parsed !== "object") return null;
  const title = parsed.title;
  const message = parsed.message;
  if (typeof title !== "string" || typeof message !== "string") return null;
  const actions = Array.isArray(parsed.actions) && parsed.actions.length > 0
    ? parsed.actions
    : DEFAULT_CONFIRM_ACTIONS;
  return {
    id: typeof parsed.id === "string" ? parsed.id : makeId(),
    title,
    message,
    ...(typeof parsed.command === "string" ? { command: parsed.command } : {}),
    ...(typeof parsed.severity === "string" ? { severity: parsed.severity } : {}),
    actions,
  };
}

/**
 * @param {string} text
 * @param {() => string} [makeId]
 * @returns {{ cleanText: string, confirmPayload: object | null }}
 */
export function parseConfirmBlock(text, makeId = () => "confirm") {
  if (!text || typeof text !== "string") return { cleanText: text || "", confirmPayload: null };
  const m = text.match(CONFIRM_FENCE_RE);
  if (!m) return { cleanText: text, confirmPayload: null };
  let parsed;
  try {
    parsed = JSON.parse(m[1].trim());
  } catch {
    return { cleanText: text, confirmPayload: null };
  }
  const confirmPayload = normalizeConfirmPayload(parsed, makeId);
  if (!confirmPayload) return { cleanText: text, confirmPayload: null };
  const cleanText = text.replace(CONFIRM_FENCE_RE, "").replace(/\n{3,}/g, "\n\n").trim();
  return { cleanText, confirmPayload };
}

/**
 * 识别末尾「如需…请告知」「若需…请告知」整段（须在 trim 后的全文末尾闭合）。
 * 用于如：「如需进一步分析（如调用 `sre-reasoning` …），请告知。」
 */
export function parseTailInvitationConfirm(text, makeId = () => "confirm") {
  if (!text || typeof text !== "string") return { cleanText: text || "", confirmPayload: null };
  const t = text.trimEnd();
  const kTell = t.lastIndexOf("请告知");
  if (kTell < 0) return { cleanText: text, confirmPayload: null };
  const afterTell = t.slice(kTell + "请告知".length);
  if (!/^[。．.？?\s]*$/.test(afterTell)) return { cleanText: text, confirmPayload: null };

  const rNeed = Math.max(t.lastIndexOf("如需", kTell), t.lastIndexOf("若需", kTell));
  if (rNeed < 0) return { cleanText: text, confirmPayload: null };

  const invite = t.slice(rNeed).trim();
  if (invite.length < 18 || invite.length > 8000) return { cleanText: text, confirmPayload: null };
  if (!/^(?:如需|若需)/.test(invite)) return { cleanText: text, confirmPayload: null };

  const beforeTell = invite.slice(0, invite.lastIndexOf("请告知"));
  const core = beforeTell.replace(/^(?:如需|若需)/, "");
  if (core.length < 8) return { cleanText: text, confirmPayload: null };

  const cleanPrefix = text.slice(0, rNeed).replace(/\s+$/, "").trimEnd();
  const confirmPayload = normalizeConfirmPayload(
    {
      title: "是否按提示继续？",
      message: invite,
      actions: TAIL_INVITATION_CONFIRM_ACTIONS,
    },
    makeId,
  );
  if (!confirmPayload) return { cleanText: text, confirmPayload: null };
  return { cleanText: cleanPrefix, confirmPayload };
}

/**
 * 合并解析：优先 ```confirm``` JSON；否则尝试尾部「如需/若需…请告知」邀约。
 */
export function parseAssistantConfirmSources(text, makeId = () => "confirm") {
  const fence = parseConfirmBlock(text, makeId);
  if (fence.confirmPayload) return fence;
  return parseTailInvitationConfirm(fence.cleanText, makeId);
}
