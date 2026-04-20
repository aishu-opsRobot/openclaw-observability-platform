/**
 * SRE Agent WebSocket：浏览器 WS → 同一套 AG-UI JSON 文本帧；连接可长驻。
 * 主流程结束即由 runSreAgent 下发 RUN_FINISHED。
 * 会话增量：客户端 `op: "poll_session"`，服务端拉取 Gateway transcript，有变化则 `CUSTOM openclaw_session_detail` 推送。
 */
import { WebSocketServer } from "ws";
import { messagesFromOpenClawSessionDetail } from "../../frontend/lib/sreOpenclawSessions.js";
import {
  runSreAgent,
  resolveGatewaySessionKeyForChat,
  getConfig,
  isOpenClawGatewayBaseUrl,
} from "./openclaw-client.mjs";
import { fetchOpenClawSessionHistoryDetail } from "./openclaw-session-history-fetch.mjs";

const WS_PATH = "/api/sre-agent/ws";

function requestPathname(raw) {
  const u = raw || "";
  const q = u.indexOf("?");
  const p = q >= 0 ? u.slice(0, q) : u;
  return p.length > 1 && p.endsWith("/") ? p.slice(0, -1) : p;
}

function safeSend(ws, obj) {
  if (ws.readyState !== 1) return;
  try {
    ws.send(JSON.stringify(obj));
  } catch {
    /* ignore */
  }
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
 * @param {import("ws").WebSocket} ws
 * @param {object} body
 */
async function handlePollSession(ws, body) {
  const cfg = getConfig();
  if (!isOpenClawGatewayBaseUrl(cfg.baseUrl)) return;

  const threadId = body.threadId != null ? String(body.threadId) : "";
  const reqAgent =
    body?.agentId != null && String(body.agentId).trim() !== ""
      ? String(body.agentId).trim()
      : "";
  const agentId = reqAgent || cfg.agentId || "";
  const sk = resolveGatewaySessionKeyForChat(threadId, agentId);
  if (!sk) return;

  if (ws._srePollLastThread !== threadId) {
    ws._srePollLastThread = threadId;
    ws._srePollLastSig = "";
    /** @type {number | undefined} 已推送过的扁平化 user/assistant 条数（与 messagesFromOpenClawSessionDetail 顺序一致） */
    ws._srePollLastFlatLen = 0;
  }

  let detail;
  try {
    detail = await fetchOpenClawSessionHistoryDetail(sk);
  } catch (e) {
    console.warn("[sre-ws] poll_session:", e?.message || e);
    return;
  }

  const cur = messagesFromOpenClawSessionDetail(detail);
  const sig = serializeMsgsForCompare(cur);
  if (sig === ws._srePollLastSig) return;

  const prevFlatLen = ws._srePollLastFlatLen ?? 0;
  ws._srePollLastSig = sig;

  // 切换线程后首次有内容：发完整 detail，由前端与已有气泡对齐合并；勿用纯 append，否则会与本地历史重复叠加
  if (prevFlatLen === 0 && cur.length > 0) {
    ws._srePollLastFlatLen = cur.length;
    safeSend(ws, {
      type: "CUSTOM",
      name: "openclaw_session_detail",
      value: { detail, incremental: false },
    });
    return;
  }

  // 仅推送自上次推送以来新增的扁平化消息，避免每次重复传输整段历史
  if (cur.length > prevFlatLen) {
    const tailFlat = cur.slice(prevFlatLen);
    ws._srePollLastFlatLen = cur.length;
    safeSend(ws, {
      type: "CUSTOM",
      name: "openclaw_session_detail",
      value: { incremental: true, tailMessages: tailFlat },
    });
    return;
  }

  // 条数未增（同长度改写、截断等）：仍需完整 detail 供前端做逐条合并
  ws._srePollLastFlatLen = cur.length;
  safeSend(ws, {
    type: "CUSTOM",
    name: "openclaw_session_detail",
    value: { detail, incremental: false },
  });
}

/**
 * @param {import("ws").WebSocket} ws
 */
async function handleSreAgentWebSocketConnection(ws) {
  let busy = false;
  /** @type {AbortController | null} */
  let currentRunAbort = null;

  ws.on("message", async (raw) => {
    let body;
    try {
      body = JSON.parse(String(raw ?? ""));
    } catch {
      safeSend(ws, { type: "RUN_ERROR", message: "无效的 JSON 消息" });
      return;
    }

    if (body?.op === "abort") {
      currentRunAbort?.abort();
      return;
    }

    if (body?.op === "poll_session") {
      void handlePollSession(ws, body);
      return;
    }

    if (body?.op && body.op !== "run") {
      safeSend(ws, { type: "RUN_ERROR", message: `未知 op: ${body.op}` });
      return;
    }

    if (busy) {
      safeSend(ws, { type: "RUN_ERROR", message: "上一段运行尚未结束" });
      return;
    }

    busy = true;
    const ac = new AbortController();
    currentRunAbort = ac;
    const onClose = () => ac.abort();
    ws.once("close", onClose);

    const emit = (event) => {
      safeSend(ws, event);
    };

    try {
      await runSreAgent(body, emit, ac.signal);
    } catch (e) {
      if (e?.name !== "AbortError") {
        safeSend(ws, { type: "RUN_ERROR", message: e?.message || String(e) });
      }
    } finally {
      ws.off("close", onClose);
      currentRunAbort = null;
      busy = false;
    }
  });
}

/**
 * 将 WebSocket 升级挂到已有 http.Server（与 Vite / 独立 API 共用）
 * @param {import("http").Server} httpServer
 */
export function attachSreAgentWebSocket(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (req, socket, head) => {
    const path = requestPathname(req.url || "");
    if (path !== WS_PATH) {
      return;
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit("connection", ws, req);
    });
  });

  wss.on("connection", (ws) => {
    handleSreAgentWebSocketConnection(ws);
  });

  return wss;
}

export { WS_PATH };
