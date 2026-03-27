import { useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import AgentTokenRoseChart from "../components/AgentTokenRoseChart.jsx";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Token 数展示：自适应 K / M / B 单位 */
function fmtTokens(n) {
  const x = Math.round(Number(n) || 0);
  if (x >= 1e9) {
    const v = x / 1e9;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}B`;
  }
  if (x >= 1e6) {
    const v = x / 1e6;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}M`;
  }
  if (x >= 1e3) {
    const v = x / 1e3;
    return `${v >= 10 ? v.toFixed(0) : v.toFixed(1)}K`;
  }
  return String(x);
}

const CARD_ACCENTS = [
  "from-primary/10 to-blue-50 dark:from-primary/20 dark:to-gray-900",
  "from-emerald-50 to-emerald-50/50 dark:from-emerald-950/50 dark:to-gray-900",
  "from-sky-50 to-indigo-50/80 dark:from-sky-950/40 dark:to-gray-900",
  "from-amber-50 to-orange-50/70 dark:from-amber-950/40 dark:to-gray-900",
];

function MomBadge({ pct }) {
  const pos = pct >= 0;
  return (
    <span
      className={[
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        pos
          ? "bg-emerald-50 text-emerald-700 ring-emerald-600/15 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-500/20"
          : "bg-rose-50 text-rose-700 ring-rose-600/15 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-500/20",
      ].join(" ")}
    >
      环比 {pos ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

export default function CostAnalysis() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [dailyAgentFilter, setDailyAgentFilter] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const r = await fetch("/api/cost-overview");
        const text = await r.text();
        if (!r.ok) {
          let msg = text;
          try {
            const j = JSON.parse(text);
            if (j?.error) msg = j.error;
          } catch {
            /* ignore */
          }
          throw new Error(msg || `HTTP ${r.status}`);
        }
        const j = JSON.parse(text);
        if (!cancelled) setSnapshot(j);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const barSeries = snapshot?.dailyByAgent?.series ?? [];
  const barRows = snapshot?.dailyByAgent?.rows ?? [];
  const trend14 = snapshot?.trend14d ?? [];
  const agentShare = snapshot?.agentShare ?? [];
  const inOutPie = snapshot?.inOut?.pie ?? [];
  const cards = snapshot?.cards;

  const overviewCards = useMemo(() => {
    if (!cards) return [];
    return [
      {
        kind: "total",
        title: "今日总 Token",
        value: cards.today.totalTokens,
        mom: cards.today.momPct,
        compareLabel: "较昨日",
        accent: CARD_ACCENTS[0],
      },
      {
        kind: "total",
        title: "本周总 Token",
        value: cards.week.totalTokens,
        mom: cards.week.momPct,
        compareLabel: "较上周同期",
        accent: CARD_ACCENTS[1],
      },
      {
        kind: "total",
        title: "本月总 Token",
        value: cards.month.totalTokens,
        mom: cards.month.momPct,
        compareLabel: "较上月同期",
        accent: CARD_ACCENTS[2],
      },
      {
        kind: "avg",
        title: "近 7 日均 Token",
        subtitle: "按自然日汇总后取均值",
        avgValue: cards.dailyAvg7d.avgTokens,
        peakDay: cards.dailyAvg7d.peakDay,
        peakValue: cards.dailyAvg7d.peakTokens,
        accent: CARD_ACCENTS[3],
      },
    ];
  }, [cards]);

  const dailySingleSeries =
    dailyAgentFilter == null ? null : barSeries.find((x) => x.dataKey === dailyAgentFilter) ?? null;

  const hasInOutData =
    (snapshot?.inOut?.inputTokens ?? 0) + (snapshot?.inOut?.outputTokens ?? 0) > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="app-card h-40 animate-pulse bg-gray-100/80 dark:bg-gray-800/80" />
          ))}
        </div>
        <LoadingSpinner message="正在加载成本概览…" />
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-lg border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
        成本概览加载失败：{err}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 成本总览 */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {overviewCards.map((m) => (
          <article
            key={m.title}
            className="relative overflow-hidden app-card p-6 transition duration-200 hover:shadow-card-hover dark:hover:shadow-none"
          >
            <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${m.accent} opacity-90`} />
            <div className="relative">
              {m.kind === "total" ? (
                <>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{m.title}</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
                      {fmtTokens(m.value)}
                    </span>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {m.mom != null ? (
                      <MomBadge pct={m.mom} />
                    ) : (
                      <span className="text-xs text-gray-400">无环比基线</span>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{m.compareLabel}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{m.title}</p>
                  <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{m.subtitle}</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    <span className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
                      {fmtTokens(m.avgValue)}
                    </span>
                  </div>
                  <div className="mt-4 rounded-lg border border-amber-200/80 bg-white/80 px-3 py-2 text-xs text-gray-600 dark:border-amber-800/60 dark:bg-gray-900/60 dark:text-gray-300">
                    <span className="font-medium text-gray-700 dark:text-gray-200">峰值日</span>
                    <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{m.peakDay}</span>
                    <span className="mx-1.5 text-gray-300 dark:text-gray-600">·</span>
                    <span className="font-semibold tabular-nums text-amber-800 dark:text-amber-200">{fmtTokens(m.peakValue)}</span>
                  </div>
                </>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* 每日 Token：按 Agent 拆分 */}
      <section className="app-card p-4 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">每日 Token 消耗情况</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              近 14 日按 Agent 维度堆叠柱形展示，纵轴为百万 Token（M）；数据源：otel.agent_sessions_logs
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Agent 筛选</span>
          <button
            type="button"
            onClick={() => setDailyAgentFilter(null)}
            className={[
              "rounded-full border px-3 py-1 text-xs font-medium transition",
              dailyAgentFilter == null
                ? "border-primary bg-primary-soft text-primary dark:bg-primary/20"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:border-gray-600",
            ].join(" ")}
          >
            全部
          </button>
          {barSeries.map((s) => {
            const active = dailyAgentFilter === s.dataKey;
            return (
              <button
                key={s.dataKey}
                type="button"
                onClick={() => setDailyAgentFilter(active ? null : s.dataKey)}
                className={[
                  "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-left text-xs font-medium transition",
                  active
                    ? "border-primary bg-primary-soft text-primary dark:bg-primary/20"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-gray-600",
                ].join(" ")}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="truncate">{s.name}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-4 h-[300px] w-full sm:h-[320px]">
          {barRows.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-gray-400">暂无近 14 日数据</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barRows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barCategoryGap="18%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} tickMargin={8} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} width={40} tickFormatter={(v) => `${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v, name) => [`${v}M`, name]}
                  labelFormatter={(l) => `日期 ${l}`}
                />
                {dailyAgentFilter == null ? (
                  barSeries.map((s, idx) => (
                    <Bar
                      key={s.dataKey}
                      dataKey={s.dataKey}
                      name={s.name}
                      stackId={barSeries.length > 1 ? "agent" : undefined}
                      fill={s.color}
                      maxBarSize={48}
                      radius={idx === barSeries.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                    />
                  ))
                ) : dailySingleSeries ? (
                  <Bar
                    dataKey={dailySingleSeries.dataKey}
                    name={dailySingleSeries.name}
                    fill={dailySingleSeries.color}
                    maxBarSize={48}
                    radius={[4, 4, 0, 0]}
                  />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="mt-4 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">
          {dailyAgentFilter == null
            ? "堆叠柱形自下而上为各 Agent 贡献；可与下方「Token 消耗趋势」总曲线对照，观察单实例波动与结构变化。"
            : "当前为单 Agent 日消耗柱形；点击「全部」或再次点击该 Agent 可恢复堆叠展示。"}
        </p>
      </section>

      {/* Agent Token 消耗占比 */}
      <section className="app-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Agent Token 消耗占比</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          本月（月初至今日）按 Agent 汇总 message_usage_total_tokens；占比按 Agent Token 合计计算
        </p>
        <div className="mx-auto mt-6 max-w-3xl">
          <p className="mb-3 text-center text-xs text-gray-400 dark:text-gray-500">
            南丁格尔玫瑰图：等分角、半径表示占比（%）
          </p>
          <div className="mx-auto w-full min-w-0">
            {agentShare.length > 0 ? (
              <AgentTokenRoseChart data={agentShare} height={380} />
            ) : (
              <p className="py-16 text-center text-sm text-gray-400">暂无本月 Agent 数据</p>
            )}
          </div>
          {agentShare.length > 0 ? (
            <div className="mt-4 grid gap-2 text-xs text-gray-600 dark:text-gray-400 sm:grid-cols-2">
              {agentShare.map((e) => (
                <div key={e.name} className="flex min-w-0 items-baseline justify-between gap-2">
                  <span className="truncate text-gray-600 dark:text-gray-400">{e.name}</span>
                  <span className="shrink-0 font-semibold tabular-nums text-gray-900 dark:text-gray-100">{e.value}%</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Token 消耗占比：输入 / 输出 */}
      <section className="app-card p-4 sm:p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Token 消耗占比：输入 / 输出</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          本月（月初至今日）按 message_usage_input / message_usage_output 汇总
        </p>
        <div className="mx-auto mt-6 max-w-md">
          {hasInOutData ? (
            <>
              <div className="mx-auto h-[240px] w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={inOutPie}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {inOutPie.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => [`${v}%`, "占比"]}
                      contentStyle={{ borderRadius: 8, fontSize: 12 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 flex justify-center gap-8 text-xs text-gray-600 dark:text-gray-400">
                <span>
                  输入：<span className="font-semibold text-primary">{snapshot?.inOut?.inputPct ?? 0}%</span>
                </span>
                <span>
                  输出：<span className="font-semibold text-emerald-700 dark:text-emerald-400">{snapshot?.inOut?.outputPct ?? 0}%</span>
                </span>
              </div>
            </>
          ) : (
            <p className="py-12 text-center text-sm text-gray-400">暂无本月输入/输出 Token 数据</p>
          )}
        </div>
      </section>

      {/* Token 消耗趋势 + 输入输出说明 */}
      <section className="app-card p-4 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Token 消耗趋势</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">近 14 日总 Token（百万 Token，M）</p>
          </div>
        </div>
        <div className="mt-4 h-[280px] w-full">
          {trend14.length === 0 ? (
            <p className="flex h-full items-center justify-center text-sm text-gray-400">暂无趋势数据</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend14} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="tokenFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#165DFF" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#6b7280" }} tickMargin={8} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} width={36} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                  formatter={(v) => [`${v}M`, "Token(约)"]}
                  labelFormatter={(l) => `日期 ${l}`}
                />
                <Area
                  type="monotone"
                  dataKey="tokens"
                  name="Token 消耗"
                  stroke="#165DFF"
                  strokeWidth={2}
                  fill="url(#tokenFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <p className="mt-4 border-t border-gray-100 pt-4 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">
          输入与输出占比见「Token 消耗占比：输入 / 输出」独立区块中的环形图；趋势图为全量 Token 随时间变化，可与业务发布、活动窗口对照分析。
        </p>
      </section>

      <p className="text-center text-xs text-gray-400 dark:text-gray-500">数据来自 Doris · otel 库</p>
    </div>
  );
}
