/**
 * 直连 OpenClaw Gateway 拉取会话历史（与 sre-agent-handler proxyOpenClawSessionDetail 对齐）
 * 供服务端 WS follow-up 使用，不经由 HTTP 自调用。
 */
import { getConfig } from "./openclaw-client.mjs";

function parseOpenClawJsonBody(text, pathForLog) {
  const t = String(text ?? "").replace(/^\uFEFF/, "").trim();
  if (t.startsWith("<") || /^<!doctype/i.test(t)) {
    throw new Error(`${pathForLog || "?"} 返回 HTML 而非 JSON`);
  }
  try {
    return JSON.parse(t || "{}");
  } catch (e) {
    throw new Error(`${pathForLog || "?"} 非合法 JSON：${e?.message || e}`);
  }
}

async function postOpenClawToolsInvoke(baseUrl, apiKey, payload) {
  const root = String(baseUrl ?? "").replace(/\/+$/, "");
  const paths = ["/tools/invoke", "/api/tools/invoke"];
  let lastErr = null;
  for (const path of paths) {
    const url = `${root}${path}`;
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      const text = await resp.text().catch(() => "");
      if (!resp.ok) {
        let hint = String(text ?? "").trim().replace(/\s+/g, " ").slice(0, 240);
        if (hint.startsWith("{")) {
          try {
            const j = JSON.parse(text);
            if (j?.error && typeof j.error === "object" && j.error.message) {
              hint = String(j.error.message);
            } else if (typeof j?.error === "string") {
              hint = j.error;
            }
          } catch {
            /* keep hint */
          }
        }
        lastErr = new Error(`${path} → HTTP ${resp.status}${hint ? `: ${hint}` : ""}`);
        if (
          resp.status === 404 &&
          /Tool not available/i.test(hint) &&
          path === "/tools/invoke"
        ) {
          break;
        }
        continue;
      }
      return parseOpenClawJsonBody(text, path);
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e));
    }
  }
  throw lastErr ?? new Error("POST /tools/invoke 失败");
}

function unwrapToolsInvokeResultPayload(result) {
  if (result == null) return null;
  if (typeof result === "string") {
    try {
      return JSON.parse(result);
    } catch {
      return null;
    }
  }
  if (typeof result !== "object") return null;
  if (result.details != null && typeof result.details === "object") {
    return result.details;
  }
  return result;
}

function messagesPayloadFromToolsResult(result) {
  const payload = unwrapToolsInvokeResultPayload(result);
  if (!payload || typeof payload !== "object") return null;
  if (payload.error && !Array.isArray(payload.messages)) return null;
  if (!Array.isArray(payload.messages)) return null;
  return {
    sessionKey: payload.sessionKey,
    messages: payload.messages,
    truncated: payload.truncated,
    droppedMessages: payload.droppedMessages,
    contentTruncated: payload.contentTruncated,
    contentRedacted: payload.contentRedacted,
    bytes: payload.bytes,
  };
}

/**
 * @param {string} sessionKey
 * @returns {Promise<object>} 与 GET /api/openclaw/sessions/:key 类似的 JSON（含 messages 数组）
 */
export async function fetchOpenClawSessionHistoryDetail(sessionKey) {
  const key = decodeURIComponent(String(sessionKey ?? "").trim());
  const { baseUrl, apiKey } = getConfig();
  const root = String(baseUrl ?? "").replace(/\/+$/, "");
  const authHeaders = {
    Accept: "application/json",
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  };

  if (!key) {
    return { messages: [], error: "缺少 session key" };
  }

  const scopeSk = (() => {
    if (/^agent:[^:]+:main$/i.test(key)) return undefined;
    const m = /^agent:([^:]+):/.exec(key);
    return m && m[1] ? `agent:${m[1]}:main` : undefined;
  })();

  const historyHeaderVariants = [
    authHeaders,
    { ...authHeaders, "x-openclaw-scopes": "operator.read" },
  ];
  try {
    const histUrl = `${root}/sessions/${encodeURIComponent(key)}/history`;
    for (const h of historyHeaderVariants) {
      try {
        const r = await fetch(histUrl, { headers: h, signal: AbortSignal.timeout(25_000) });
        const text = await r.text().catch(() => "");
        if (r.ok && text && !/^\s*</.test(text.trim())) {
          return parseOpenClawJsonBody(text, "/sessions/.../history");
        }
      } catch {
        /* next */
      }
    }
  } catch {
    /* fall through */
  }

  const historyArgs = { sessionKey: key, limit: 500, includeTools: true };
  const historyPayloads = [];
  if (scopeSk) {
    historyPayloads.push({
      tool: "sessions_history",
      action: "json",
      args: historyArgs,
      sessionKey: scopeSk,
    });
  }
  historyPayloads.push({
    tool: "sessions_history",
    action: "json",
    args: historyArgs,
  });
  let historyErrMsg = "";
  for (const payload of historyPayloads) {
    try {
      const json = await postOpenClawToolsInvoke(baseUrl, apiKey, payload);
      if (json && json.ok === false) {
        const em =
          (json.error && typeof json.error === "object" && json.error.message != null
            ? String(json.error.message)
            : null) ||
          (typeof json.error === "string" ? json.error : null) ||
          "tools/invoke 返回失败";
        historyErrMsg = em;
        continue;
      }
      if (json && json.ok !== false) {
        const out = messagesPayloadFromToolsResult(json.result);
        if (out) return out;
      }
    } catch (err) {
      historyErrMsg = err instanceof Error ? err.message : String(err);
    }
  }

  return {
    messages: [],
    error:
      historyErrMsg ||
      "未能加载该会话详情（GET /sessions/.../history 与 sessions_history 均无有效 messages）。",
  };
}
