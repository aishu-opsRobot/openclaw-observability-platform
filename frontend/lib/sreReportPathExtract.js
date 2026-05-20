/**
 * 从 Agent 消息中提取 SRE 阶段报告路径（Markdown 报告与 JSON 阶段详情）。
 *
 * 报告 .md：SRE-{13位}-{6位}_{stage}_report.md
 * 阶段详情 .json：SRE-{13位}-{6位}_{stage}_content.json（用于任务规划「完成」判定等）
 * Tab「SRE报告」优先识别 *_stage5_final_content.json；仍兼容 *_final_report.md
 *
 * 同一个 SRE-{13d}-{6c} ID 对应同一次 SRE 分析会话。
 */

export const SRE_REPORT_CONFIGS = [
  {
    stage: "stage1",
    suffix: "_stage1_perception_report.md",
    contentSuffix: "_stage1_perception_content.json",
    label: "环境感知",
    /** Agent 往往在路径上方写「{cueLabel}详细内容:」，与按钮并排展示文件名时去掉该行 */
    cueLabel: "环境感知",
    color: "blue",
  },
  {
    stage: "stage2",
    suffix: "_stage2_analysis_report.md",
    contentSuffix: "_stage2_analysis_content.json",
    label: "异常分析",
    cueLabel: "异常分析",
    color: "amber",
  },
  {
    stage: "stage3",
    suffix: "_stage3_reasoning_report.md",
    contentSuffix: "_stage3_reasoning_content.json",
    label: "根因推理",
    cueLabel: "根因推理",
    color: "rose",
  },
  {
    stage: "stage4",
    suffix: "_stage4_execution_report.md",
    contentSuffix: "_stage4_execution_content.json",
    label: "行动建议",
    cueLabel: "行动建议",
    color: "emerald",
  },
  {
    stage: "final",
    suffix: "_final_report.md",
    contentSuffix: "_stage5_final_content.json",
    label: "SRE报告",
    /** Agent 可能在路径上行写仅此标题的行（不等同于「xxx详细内容」）*/
    alternateHeadingCues: ["SRE综合分析报告"],
    color: "violet",
  },
];

/** 提取 sessionId（SRE-{13d}-{6c}）的正则 */
export const SRE_SESSION_ID_RE = /SRE-(\d{13})-([A-Za-z0-9]{6})/;

function escapeRegExp(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMarkdownBoldFence(s) {
  let t = String(s ?? "").trim();
  while (true) {
    if (t.startsWith("**")) t = t.slice(2).trimStart();
    else if (t.endsWith("**")) t = t.slice(0, -2).trimEnd();
    else break;
  }
  return t.trim();
}

function buildCueWithDetailRegex(cueLabel) {
  const escapedCue = escapeRegExp(String(cueLabel ?? "").trim());
  if (!escapedCue) return null;
  return new RegExp(
    `^[\\s📋📝❯›‣▸\\uFE0F]*(?:\\*{0,2})?${escapedCue}(?:\\*{0,2})?\\s*(?:\\*{0,2})?详细内容(?:\\*{0,2})?\\s*[：:]?\\s*$`,
    "u",
  );
}

/** 「📝 xxx报告:」等仅标题、不含「详细内容」的代理引导行（需显式枚举，避免误删正文短句）。 */
function buildStandaloneHeadingCueRegex(cueLabel) {
  const escapedCue = escapeRegExp(String(cueLabel ?? "").trim());
  if (!escapedCue) return null;
  return new RegExp(
    `^[\\s📋📝❯›‣▸\\uFE0F]*(?:\\*{0,2})?${escapedCue}(?:\\*{0,2})?\\s*[：:]?\\s*$`,
    "u",
  );
}

/**
 * 去掉紧邻 SRE 报告路径按钮前的阶段性引导行（及上方空行）。
 * @param {string} text
 * @param {{ detailCues?: string[]; standaloneHeadingCues?: string[] } | string} options 传 string 时为唯一 detailCue
 */
export function stripTrailingMarkdownBeforeSreReport(text, options) {
  let detailCues = [];
  let standaloneHeadingCues = [];
  if (typeof options === "string") {
    const one = options.trim();
    if (one) detailCues = [one];
  } else if (options && typeof options === "object") {
    detailCues = ([]).concat(options.detailCues ?? []).map((s) => String(s ?? "").trim()).filter(Boolean);
    standaloneHeadingCues = ([]).concat(options.standaloneHeadingCues ?? [])
      .map((s) => String(s ?? "").trim())
      .filter(Boolean);
  }

  const detailRes = [...new Set(detailCues)]
    .map(buildCueWithDetailRegex)
    .filter(Boolean);
  const headingRes = [...new Set(standaloneHeadingCues)]
    .map(buildStandaloneHeadingCueRegex)
    .filter(Boolean);

  if (detailRes.length === 0 && headingRes.length === 0) return String(text ?? "");

  let lines = String(text ?? "").split(/\r?\n/);
  while (lines.length > 0) {
    const raw = lines[lines.length - 1];
    if (!raw.trim()) {
      lines.pop();
      continue;
    }
    const lineProbe = stripMarkdownBoldFence(raw).trim();
    const matches =
      detailRes.some((re) => re.test(lineProbe)) || headingRes.some((re) => re.test(lineProbe));
    if (matches) {
      lines.pop();
      continue;
    }
    break;
  }
  return lines.join("\n");
}

/**
 * Markdown 段落与 SRE 报告按钮交错时：去掉每张按钮前置 markdown 末尾的阶段性「详细内容」引导行。
 * @param {Array<{ type: string }>} parts splitAssistantMessageOnSreReportPaths 的产物
 */
export function finalizeSreReportSplitParts(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return parts;

  const out = [];
  for (let i = 0; i < parts.length; i++) {
    const cur = parts[i];
    if (cur?.type !== "markdown") {
      out.push(cur);
      continue;
    }
    let md = String(cur.text ?? "");
    const next = parts[i + 1];
    if (next?.type === "sre_report") {
      const cfg = SRE_REPORT_CONFIGS.find((c) => c.stage === next.stage);
      const cueLabel = cfg?.cueLabel ?? cfg?.label;
      const headings = ([]).concat(cfg?.alternateHeadingCues ?? []).filter(Boolean);
      if (cueLabel || headings.length) {
        md = stripTrailingMarkdownBeforeSreReport(md, {
          detailCues: cueLabel ? [cueLabel] : [],
          standaloneHeadingCues: headings,
        });
      }
    }
    if (md.trim()) out.push({ type: "markdown", text: md });
  }

  return out.length > 0 ? out : [{ type: "markdown", text: "" }];
}

/** 允许的阶段产物后缀（小写）：报告 md + 阶段 content json */
const ALLOWED_SUFFIXES = SRE_REPORT_CONFIGS.flatMap((c) => {
  const parts = [];
  if (c.suffix) parts.push(c.suffix.toLowerCase());
  if (c.contentSuffix) parts.push(c.contentSuffix.toLowerCase());
  return parts;
});

function isAllowedSreArtifactPath(p) {
  const low = String(p || "").toLowerCase();
  return ALLOWED_SUFFIXES.some((s) => low.endsWith(s));
}

/**
 * 从单条消息文本中提取所有 SRE 阶段产物路径（`*.md` 报告与 `*_content.json` 详情）。
 * 同时支持反引号包裹（`path`）和裸路径两种写法。
 * @param {string} text
 * @returns {string[]}
 */
export function extractSreReportPaths(text) {
  const src = String(text ?? "");
  const found = [];
  const seen = new Set();

  // 反引号路径
  const tickRe = /`([~./][^`\n]+?\.(?:md|json))`/gi;
  let m;
  while ((m = tickRe.exec(src)) !== null) {
    const p = m[1].trim();
    if (isAllowedSreArtifactPath(p) && !seen.has(p)) {
      seen.add(p);
      found.push(p);
    }
  }

  // 裸路径（不含空格、引号等）
  const bareRe = /([~./][^\s`\]"'<>\n]*?\.(?:md|json))/gi;
  while ((m = bareRe.exec(src)) !== null) {
    const p = m[1].trim();
    if (isAllowedSreArtifactPath(p) && !seen.has(p)) {
      seen.add(p);
      found.push(p);
    }
  }

  return found;
}

/**
 * 从文件路径中提取 SRE sessionId（SRE-{13d}-{6c}）。
 * @param {string} filePath
 * @returns {string | null}
 */
export function getSreSessionId(filePath) {
  const m = String(filePath || "").match(SRE_SESSION_ID_RE);
  if (!m) return null;
  return `SRE-${m[1]}-${m[2]}`;
}

/**
 * 从文件路径中判断属于哪个 stage。
 * @param {string} filePath
 * @returns {{ stage: string; label: string; color: string; pathKind: "report" | "content" } | null}
 */
export function getSreReportStageConfig(filePath) {
  const low = String(filePath || "").toLowerCase();
  const fromReport = SRE_REPORT_CONFIGS.find((c) => c.suffix && low.endsWith(c.suffix.toLowerCase()));
  if (fromReport) {
    return {
      stage: fromReport.stage,
      label: fromReport.label,
      color: fromReport.color,
      pathKind: "report",
    };
  }
  const fromContent = SRE_REPORT_CONFIGS.find(
    (c) => c.contentSuffix && low.endsWith(c.contentSuffix.toLowerCase()),
  );
  if (fromContent) {
    return {
      stage: fromContent.stage,
      label: fromContent.label,
      color: fromContent.color,
      pathKind: "content",
    };
  }
  return null;
}

/**
 * 从 SRE sessionId 提取时间戳（用于排序，选最新会话）。
 * @param {string} sessionId SRE-{13d}-{6c}
 * @returns {number}
 */
export function getSreSessionTimestamp(sessionId) {
  const m = String(sessionId || "").match(/SRE-(\d{13})-/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * 将助手消息按「SRE 阶段报告 .md / content .json 路径」拆成 Markdown 与可点击 Tab 段。
 * 同一阶段若同时出现 content json 与 report md，优先展示 content 路径的按钮。
 *
 * @param {string} text
 * @returns {{ parts: Array<{ type: "markdown"; text: string } | { type: "sre_report"; path: string; stage: string; label: string; color: string }> } | null}
 */
export function splitAssistantMessageOnSreReportPaths(text) {
  const src = String(text ?? "");
  const hits = [];
  const seen = new Set();

  const pathRank = (p) => (getSreReportStageConfig(p)?.pathKind === "content" ? 2 : 1);

  const addHit = (p, start, end) => {
    const cfg = getSreReportStageConfig(p);
    if (!cfg || seen.has(p)) return;
    const overlaps = hits.some((h) => start < h.end && end > h.start);
    if (overlaps) return;

    const dupIdx = hits.findIndex((h) => h.stage === cfg.stage);
    if (dupIdx >= 0) {
      const prevPath = hits[dupIdx].path;
      if (pathRank(p) <= pathRank(prevPath)) return;
      hits.splice(dupIdx, 1);
      seen.delete(prevPath);
    }

    seen.add(p);
    hits.push({ path: p, stage: cfg.stage, label: cfg.label, color: cfg.color, start, end });
  };

  // 1. 反引号包裹的路径（优先）；含 stage content .json 与报告 .md
  const tickRe = /`([~./][^`\n]+?\.(?:md|json))`/gi;
  let m;
  while ((m = tickRe.exec(src)) !== null) {
    addHit(m[1].trim(), m.index, m.index + m[0].length);
  }

  // 2. 裸路径
  const bareRe = /([~./][^\s`\]"'<>\n]*?\.(?:md|json))/gi;
  while ((m = bareRe.exec(src)) !== null) {
    addHit(m[1].trim(), m.index, m.index + m[0].length);
  }

  if (hits.length === 0) return null;
  hits.sort((a, b) => a.start - b.start);

  const parts = [];
  let last = 0;
  for (const hit of hits) {
    if (hit.start > last) parts.push({ type: "markdown", text: src.slice(last, hit.start) });
    parts.push({ type: "sre_report", path: hit.path, stage: hit.stage, label: hit.label, color: hit.color });
    last = hit.end;
  }
  if (last < src.length) parts.push({ type: "markdown", text: src.slice(last) });

  const partsFinal = finalizeSreReportSplitParts(parts);
  return { parts: partsFinal };
}
