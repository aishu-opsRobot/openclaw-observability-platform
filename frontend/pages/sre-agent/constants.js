export const USE_MOCK =
  import.meta.env.VITE_SRE_AGENT_MOCK === "true" || import.meta.env.VITE_MOCK === "true";

export const SKILLS = [
  { key: "k8s", label: "巡检 K8s", icon: "cube", prompt: "请对当前 K8s 集群做一次巡检，列出异常 Pod 和关键事件" },
  { key: "prom", label: "查监控", icon: "chart", prompt: "查询当前集群 CPU 使用率、内存使用率和 5xx 错误率" },
  { key: "diagnose", label: "诊断故障", icon: "bug", prompt: "有服务响应变慢，请帮我诊断可能的原因" },
  { key: "report", label: "出报告", icon: "doc", prompt: "请生成一份今日集群巡检报告" },
];

export const REFRESH_INTERVAL = 60_000;

/** 会话页（聊天 + 工作区）左侧宽度，可拖拽调整并写入 localStorage */
export const CHAT_SPLIT_STORAGE_KEY = "sre-agent-chat-left-px";
export const CHAT_SPLIT_DEFAULT = 380;
export const CHAT_SPLIT_MIN = 280;
export const CHAT_SPLIT_HARD_MAX = 920;
export const WORKSPACE_MIN_WIDTH = 280;
