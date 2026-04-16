// ─── 括号内多选项 → 选择框（/ 或 ? 分隔）──────────────────────────

function stripOptionNoise(s) {
  return String(s)
    .replace(/[)）]+$/, "")
    .replace(/^[（(]+/, "")
    .trim();
}

/** 解析括号内的选项：优先按 / 或全角／ 分割，否则按 ? 分割（如 a? b? c） */
function splitOptionsInsideParens(inside) {
  let s = inside.trim().replace(/\uFF0F/g, "/");
  if (!s) return [];
  if (/\s*[/／]\s*/.test(s)) {
    const parts = s.split(/\s*[/／]\s*/).map(stripOptionNoise).filter(Boolean);
    if (parts.length >= 2) return parts;
  }
  const byQ = s.split("?").map(stripOptionNoise).filter(Boolean);
  if (byQ.length >= 2) return byQ;
  const one = stripOptionNoise(s);
  return one ? [one] : [];
}

function normalizeNumberedLine(line) {
  return line.trim().replace(/^\*{2}/, "").replace(/\*{2}$/, "").trim();
}

/**
 * 提取 `1. 问题？(A / B / C)` 或 `(A? B? C)` 形式的选项组（至少 2 个选项）
 */
export function extractParenChoiceGroups(text) {
  if (!text) return [];
  const groups = [];
  for (const line of text.split("\n")) {
    const t = normalizeNumberedLine(line);
    let num;
    let rest;
    let m = t.match(/^(\d)\uFE0F?\u20E3\s+(.+)$/);
    if (m) {
      num = m[1];
      rest = m[2];
    }
    if (!m) {
      m = t.match(/^(\d)[.)]\s+(.+)$/);
      if (m) {
        num = m[1];
        rest = m[2];
      }
    }
    if (!num || !rest) continue;
    rest = rest.replace(/\*{1,2}/g, "").replace(/`([^`]*)`/g, "$1").trim();
    const pm = rest.match(/^(.+?)\s*[（(]([^)）]+)[)）]\s*$/);
    if (!pm) continue;
    const prompt = pm[1].trim();
    const options = splitOptionsInsideParens(pm[2]);
    if (options.length < 2) continue;
    groups.push({ num, prompt, options });
  }
  return groups;
}

/** 从正文中去掉已转为选择框的括号段，避免 Markdown 里重复展示 */
export function stripParenChoiceBlocks(text) {
  return text
    .split("\n")
    .map((line) => {
      const t = normalizeNumberedLine(line);
      const m = t.match(/^(\d)(?:[.)]|\uFE0F?\u20E3\s+)\s*(.+)$/);
      if (!m) return line;
      let rest = m[2].replace(/\*{1,2}/g, "").replace(/`([^`]*)`/g, "$1").trim();
      const pm = rest.match(/^(.+?)\s*[（(]([^)）]+)[)）]\s*$/);
      if (!pm) return line;
      const options = splitOptionsInsideParens(pm[2]);
      if (options.length < 2) return line;
      const stripped = line.replace(/\s*[（(][^)）]+[)）]\s*$/u, "").trimEnd();
      return stripped;
    })
    .join("\n");
}

// ─── Choice Cards (detect numbered options in agent responses) ───

/**
 * 从 Agent 回复中提取编号选项。
 * 支持格式：1️⃣ text / 1. text / 1) text / **1. text**
 * 至少检测到 2 项才返回。
 * @param {Set<string>} [excludeNums] 已由括号选择框处理的题号，不再生成卡片
 */
export function extractChoices(text, excludeNums) {
  if (!text) return [];
  const choices = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    let num;
    let rest;

    let m = t.match(/^(\d)\uFE0F?\u20E3\s+(.+)$/);
    if (m) {
      num = m[1];
      rest = m[2];
    }

    if (!num) {
      m = t.match(/^(\d)[.)]\s+(.+)$/);
      if (m) {
        num = m[1];
        rest = m[2];
      }
    }

    if (!num) {
      m = t.match(/^\*{2}(\d)[.)]\s*(.+?)\*{2}$/);
      if (m) {
        num = m[1];
        rest = m[2];
      }
    }

    if (num && rest) {
      if (excludeNums?.has(num)) continue;
      const clean = rest.replace(/\*{1,2}/g, "").replace(/`([^`]*)`/g, "$1").trim();
      if (clean.length > 1 && clean.length < 150) {
        const isQuestion = /[？?]/.test(clean);
        let fillHint = "";
        if (isQuestion) {
          fillHint = clean
            .split(/[？?]/)[0]
            .replace(/是多少|是什么|有哪些|怎么样/g, "")
            .replace(/[（(].+?[)）]/g, "")
            .trim();
        }
        choices.push({ num, label: clean, isQuestion, fillHint });
      }
    }
  }
  return choices.length >= 2 ? choices : [];
}
