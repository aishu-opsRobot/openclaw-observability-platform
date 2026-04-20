/**
 * OpenClaw Gateway：在 HTTP 主流程结束后轮询会话 transcript，将增量以 AG-UI MESSAGES_SNAPSHOT 推送。
 * 与 frontend/lib/sreAgentSessionFollowUp.js 策略对齐（约 3s、稳定/超时）。
 */
import { messagesFromOpenClawSessionDetail } from "../../frontend/lib/sreOpenclawSessions.js";
import { stripOpenClawHiddenBlocks } from "../../frontend/pages/sre-agent/messageDisplayUtils.js";
import { getConfig, isOpenClawGatewayBaseUrl } from "./openclaw-client.mjs";
import { fetchOpenClawSessionHistoryDetail } from "./openclaw-session-history-fetch.mjs";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function serializeMsgsForCompare(aguiMsgs) {
  if (!Array.isArray(aguiMsgs)) return "";
  return JSON.stringify(
    aguiMsgs.map((x) => ({
      role: x.role,
      content: String(x.content ?? ""),
    })),
  );
}

/**
 * 从最后一条助手正文判断多阶段流水线是否可能仍在进行（与 OpenClaw 侧异步阶段一致）。
 * 若匹配到「当前阶段 < 总阶段」则不应用「稳定即停」，避免过早 RUN_FINISHED。
 */
export function looksLikeIncompleteMultiStagePipeline(aguiMsgs) {
  if (!Array.isArray(aguiMsgs) || aguiMsgs.length === 0) return false;
  let lastAssistant = "";
  for (let i = aguiMsgs.length - 1; i >= 0; i--) {
    if (aguiMsgs[i]?.role === "assistant") {
      lastAssistant = stripOpenClawHiddenBlocks(String(aguiMsgs[i].content ?? ""));
      break;
    }
  }
  if (!lastAssistant) return false;
  const patterns = [
    /\[Stage\s*(\d+)\s*[/／]\s*(\d+)\]/i,
    /Stage\s*(\d+)\s*[/／]\s*(\d+)/i,
    /阶段\s*(\d+)\s*[/／]\s*(\d+)/,
    /第\s*(\d+)\s*[/／]\s*(\d+)\s*阶段/,
  ];
  for (const re of patterns) {
    const m = lastAssistant.match(re);
    if (m) {
      const cur = parseInt(m[1], 10);
      const total = parseInt(m[2], 10);
      if (
        Number.isFinite(cur) &&
        Number.isFinite(total) &&
        total > 0 &&
        cur < total
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * @param {(e: object) => void} emit
 * @param {AbortSignal} signal
 * @param {string} gatewaySessionKey - 已解析的 Gateway session key（仅本会话）
 */
export async function runServerOpenClawSessionFollowUp(emit, signal, gatewaySessionKey) {
  const sk = String(gatewaySessionKey ?? "").trim();
  if (!sk) return;
  if (!isOpenClawGatewayBaseUrl(getConfig().baseUrl)) return;

  /** 多阶段任务可能数分钟才写入 transcript，需长于「流结束」间隔 */
  const maxMs = 900_000;
  const intervalMs = 3000;
  /** 约 3s×40≈2min 无变化才认为会话静止（未完成多阶段时由下方逻辑禁用提前退出） */
  const stablePollsBeforeStop = 40;
  const maxConsecErrors = 6;
  const start = Date.now();
  let consecErr = 0;
  let sawChange = false;
  let stableAfterGrowth = 0;

  let baseSig = "";
  try {
    const d0 = await fetchOpenClawSessionHistoryDetail(sk);
    baseSig = serializeMsgsForCompare(messagesFromOpenClawSessionDetail(d0));
  } catch {
    baseSig = "";
  }

  while (!signal.aborted && Date.now() - start < maxMs) {
    await sleep(intervalMs);
    if (signal.aborted) break;

    let detail;
    try {
      detail = await fetchOpenClawSessionHistoryDetail(sk);
      consecErr = 0;
    } catch {
      consecErr++;
      if (consecErr >= maxConsecErrors) break;
      continue;
    }

    const cur = messagesFromOpenClawSessionDetail(detail);
    const sig = serializeMsgsForCompare(cur);
    const pipelineMaybeRunning = looksLikeIncompleteMultiStagePipeline(cur);

    if (sig !== baseSig) {
      emit({
        type: "MESSAGES_SNAPSHOT",
        messages: cur.map((m) => ({
          ...m,
          streaming: false,
        })),
      });
      baseSig = sig;
      sawChange = true;
      stableAfterGrowth = 0;
    } else if (sawChange && !pipelineMaybeRunning) {
      stableAfterGrowth++;
      if (stableAfterGrowth >= stablePollsBeforeStop) break;
    } else if (sawChange && pipelineMaybeRunning) {
      stableAfterGrowth = 0;
    }

    if (!sawChange && Date.now() - start > 600_000) break;
  }
}
