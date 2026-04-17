import { stripOpenClawHiddenBlocks } from "../pages/sre-agent/messageDisplayUtils.js";
import { uid } from "./agui.js";
import {
  computeGatewaySessionKeyForChat,
  fetchOpenClawSessionDetail,
  messagesFromOpenClawSessionDetail,
} from "./sreOpenclawSessions.js";

function normalizeMsg(m) {
  if (!m || typeof m !== "object") return "";
  const role = m.role === "assistant" || m.role === "user" ? m.role : "";
  const raw = String(m.content ?? "").trim();
  const content = role === "assistant" ? stripOpenClawHiddenBlocks(raw) : raw;
  return `${role}|${content}`;
}

/**
 * 将 Gateway 会话 transcript 与当前 UI 消息合并：用于 HTTP 流已结束（RUN_FINISHED）
 * 但 OpenClaw 仍异步写入子 Agent / 感知阶段后续回复的场景。
 *
 * @param {Array<{ id?: string, role: string, content: string, streaming?: boolean }>} localMessages
 * @param {object} detail - GET /api/openclaw/sessions/:key 的 JSON
 * @returns {typeof localMessages} 无变化时返回同一引用，避免多余渲染
 */
export function mergeChatWithSessionHistory(localMessages, detail) {
  const remote = messagesFromOpenClawSessionDetail(detail);
  if (!remote.length || !Array.isArray(localMessages)) return localMessages;

  let prefix = 0;
  const max = Math.min(localMessages.length, remote.length);
  for (let i = 0; i < max; i++) {
    if (normalizeMsg(localMessages[i]) !== normalizeMsg(remote[i])) break;
    prefix++;
  }

  if (prefix === localMessages.length && remote.length > localMessages.length) {
    const tail = remote.slice(localMessages.length).map((m) => ({
      ...m,
      id: m.id && String(m.id).trim() ? m.id : uid("sess"),
      streaming: false,
    }));
    return [...localMessages, ...tail];
  }

  if (
    prefix === localMessages.length &&
    remote.length === localMessages.length &&
    localMessages.length > 0
  ) {
    const i = localMessages.length - 1;
    const L = localMessages[i];
    const R = remote[i];
    if (L?.role === "assistant" && R?.role === "assistant") {
      const sl = stripOpenClawHiddenBlocks(String(L.content ?? ""));
      const sr = stripOpenClawHiddenBlocks(String(R.content ?? ""));
      if (sr.length > sl.length && sr.startsWith(sl)) {
        const next = [...localMessages.slice(0, i), { ...L, content: R.content, streaming: false }];
        return next;
      }
    }
    return localMessages;
  }

  if (prefix === localMessages.length - 1 && localMessages.length > 0) {
    const i = prefix;
    const L = localMessages[i];
    const R = remote[i];
    if (L?.role === "assistant" && R?.role === "assistant") {
      const sl = stripOpenClawHiddenBlocks(String(L.content ?? ""));
      const sr = stripOpenClawHiddenBlocks(String(R.content ?? ""));
      if (sr.length >= sl.length && sr.startsWith(sl)) {
        const head = [...localMessages.slice(0, i), { ...L, content: R.content, streaming: false }];
        if (remote.length > localMessages.length) {
          const tail = remote.slice(localMessages.length).map((m) => ({
            ...m,
            id: m.id && String(m.id).trim() ? m.id : uid("sess"),
            streaming: false,
          }));
          return [...head, ...tail];
        }
        return head;
      }
    }
  }

  return localMessages;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * HTTP/SSE 会话结束后轮询 OpenClaw 会话历史，合并异步推送的助手消息。
 * 策略：首次立即拉取，之后约每 3s 一次，直至超时或稳定条件满足。
 */
export async function runOpenClawSessionFollowUpPoll({
  threadId,
  agentId,
  getMessages,
  setMessages,
  signal,
}) {
  const key = computeGatewaySessionKeyForChat(threadId, agentId);
  if (!key) return;

  const maxMs = 300_000;
  /** 会话（SSE）结束后：首次立即拉取，之后约每 3s 一次 */
  const intervalMs = 3000;
  const maxConsecErrors = 6;
  /** 约 10 × 3s：历史曾增长后若连续无新变化则停止 */
  const stablePollsBeforeStop = 10;
  const start = Date.now();
  let consecErr = 0;
  let sawRemoteGrowth = false;
  let stableAfterGrowth = 0;

  while (!signal.aborted && Date.now() - start < maxMs) {
    let detail;
    try {
      detail = await fetchOpenClawSessionDetail(key);
      consecErr = 0;
    } catch {
      consecErr++;
      if (consecErr >= maxConsecErrors) break;
      await sleep(intervalMs);
      continue;
    }

    const prev = getMessages();
    const merged = mergeChatWithSessionHistory(prev, detail);
    const changed = merged !== prev;
    if (changed) {
      setMessages(merged);
      sawRemoteGrowth = true;
      stableAfterGrowth = 0;
    } else if (sawRemoteGrowth) {
      stableAfterGrowth++;
      if (stableAfterGrowth >= stablePollsBeforeStop) break;
    }

    if (!sawRemoteGrowth && Date.now() - start > 180_000) break;

    await sleep(intervalMs);
  }
}
