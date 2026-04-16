import {
  CHAT_SPLIT_DEFAULT,
  CHAT_SPLIT_HARD_MAX,
  CHAT_SPLIT_MIN,
  CHAT_SPLIT_STORAGE_KEY,
} from "./constants.js";

export function readStoredChatSplitPx() {
  if (typeof localStorage === "undefined") return CHAT_SPLIT_DEFAULT;
  try {
    const n = Number(localStorage.getItem(CHAT_SPLIT_STORAGE_KEY));
    if (Number.isFinite(n)) {
      return Math.min(CHAT_SPLIT_HARD_MAX, Math.max(CHAT_SPLIT_MIN, Math.round(n)));
    }
  } catch {
    /* ignore */
  }
  return CHAT_SPLIT_DEFAULT;
}

export function sessionTimeLabel(row) {
  const raw =
    row?.updatedAt ??
    row?.updated_at ??
    row?.createdAt ??
    row?.created_at ??
    "";
  if (!raw) return "";
  try {
    return new Date(raw).toLocaleString();
  } catch {
    return String(raw);
  }
}
